import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { InjectModel } from '@nestjs/mongoose';
import { Usuario, UsuarioDocument } from '../Usuarios/usuario.schema';
import { Evento, EventoDocument } from '../Eventos/evento.schema';
import { Entrada, EntradaDocument } from '../Entrada/entrada.schema';
import { Model } from 'mongoose';
import { ClubService } from '../Clubs/club.service';

@Injectable()
export class PagoService {
    private stripe: Stripe;    constructor(
        private configService: ConfigService,
        @InjectModel(Usuario.name)
        private readonly usuarioModel: Model<UsuarioDocument>,
        @InjectModel(Evento.name)
        private readonly eventoModel: Model<EventoDocument>,
        @InjectModel(Entrada.name)
        private readonly entradaModel: Model<EntradaDocument>,
        @Inject(forwardRef(() => ClubService))
        private readonly clubService: ClubService,
    ) {
        const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
        if (!stripeSecretKey) {
            throw new Error('STRIPE_SECRET_KEY no está definido');
        }

        this.stripe = new Stripe(stripeSecretKey, {
            apiVersion: '2022-11-15',
        });
    }

    async crearSesionCheckout(usuarioUid: string, eventoId: string, tipoEntrada: string) {
        const usuario = await this.usuarioModel.findOne({ uid: usuarioUid });
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }
        const evento = await this.eventoModel
            .findById(eventoId)
            .populate('clubId', 'nombre')
            .populate('djIds', 'nombre')
            .lean();

        if (!evento) {
            throw new Error('Evento no encontrado');
        }
        if (!evento.entradas || evento.entradas.length === 0) {
            throw new Error('Este evento no tiene entradas configuradas');
        }

        const entradaSeleccionada = evento.entradas.find(
            (entrada) => entrada.tipo === tipoEntrada,
        );
        console.log('Tipo de entrada recibido:', tipoEntrada);
        console.log('Entradas configuradas en el evento:', evento.entradas);
        console.log('Entrada seleccionada:', entradaSeleccionada);

        if (!entradaSeleccionada) {
            throw new Error('Tipo de entrada no válido');
        }

        const entradasVendidas = await this.entradaModel.countDocuments({ eventoId: evento._id, tipoEntrada });
        console.log('Entradas vendidas:', entradasVendidas);
        let precioFinal: number | null = null;
        let acumulado = 0;
        for (const tramo of entradaSeleccionada.tramos) {
            acumulado += tramo.hasta;
            console.log('Revisando tramo:', tramo, 'Acumulado:', acumulado);
            if (entradasVendidas < acumulado) {
                precioFinal = tramo.precio;
                console.log('Tramo seleccionado:', tramo, 'Precio final:', precioFinal);
                break;
            }
        }
        if (precioFinal === null || precioFinal <= 0) {
            console.error('Error: El precio de la entrada es 0 o no se ha encontrado un tramo válido.');
            throw new Error('El precio de la entrada debe ser mayor que 0');
        }

        const clubNombre = (evento.clubId as any)?.nombre || 'club';
        let djNombre = 'DJ';
        if (Array.isArray(evento.djIds) && evento.djIds.length > 0) {
            djNombre = evento.djIds.map((dj: any) => dj.nombre).join(', ');
        }

        const frontendUrl = this.configService.get<string>('FRONTEND_URL');
        if (!frontendUrl || !/^https?:\/\//.test(frontendUrl)) {
            console.error('FRONTEND_URL no está definida correctamente:', frontendUrl);
            throw new Error('Configuración incorrecta: FRONTEND_URL debe estar definida y empezar por http(s)://');
        }
        const cancelUrl = `${frontendUrl}/pago-cancelado?evento=${encodeURIComponent(evento.nombre)}`;

        const sesion = await this.stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            customer_email: usuario.email,
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: evento.nombre,
                            description: `Evento en ${clubNombre} con ${djNombre}`,
                        },
                        unit_amount: Math.round(precioFinal * 100),
                    },
                    quantity: 1,
                },
            ],            metadata: {
                eventoId: evento._id.toString(),
                clubId: (evento.clubId as any)._id?.toString?.() || '',
                tipoEntrada: tipoEntrada,
            },
            success_url: `${frontendUrl}/compra-exitosa?evento=${encodeURIComponent(evento.nombre || '')}`,
            cancel_url: cancelUrl,
        });

        return { url: sesion.url };
    }

    construirEventoDesdeStripe(payload: Buffer, sig: string, secret: string | undefined) {
        if (!secret) {
            throw new Error('STRIPE_WEBHOOK_SECRET no definido');
        }

        return this.stripe.webhooks.constructEvent(payload, sig, secret);
    }
    async registrarEntradaExitosa(email: string, eventoId: string, tipoEntrada: string) {
        const usuario = await this.usuarioModel.findOne({ email });
        if (!usuario) {
            console.error(`Usuario no encontrado durante registro de entrada`);
            throw new Error('Usuario no encontrado');
        }
        
        const evento = await this.eventoModel.findById(eventoId);
        if (!evento) {
            console.error(`Evento no encontrado durante registro de entrada`);
            throw new Error('Evento no encontrado');
        }
        
        const yaExiste = await this.entradaModel.findOne({
            usuarioId: usuario._id,
            eventoId: evento._id,
            tipoEntrada,
        });        if (yaExiste) {
            console.log(`Entrada ya existe para este usuario y evento`);
            return;
        }

        const tipoSeleccionado = evento.entradas.find((e) => e.tipo === tipoEntrada);
        if (!tipoSeleccionado) throw new Error('Tipo de entrada inválido');

        const entradasVendidas = await this.entradaModel.countDocuments({ eventoId: evento._id, tipoEntrada });
        let precioFinal: number | null = null;
        let acumulado = 0;
        for (const tramo of tipoSeleccionado.tramos) {
            acumulado += tramo.hasta;
            if (entradasVendidas < acumulado) {
                precioFinal = tramo.precio;
                break;
            }
        }        if (precioFinal === null) {
            console.error('No hay tramos disponibles para este tipo de entrada');
            throw new Error('No hay tramos disponibles para este tipo de entrada');
        }
          try {
            const nuevaEntrada = new this.entradaModel({
                usuarioId: usuario._id,
                eventoId: evento._id,
                fechaCompra: new Date(),
                tipoEntrada,
                precioPagado: precioFinal,
            });
            
            console.log('Guardando nueva entrada');
            const entradaGuardada = await nuevaEntrada.save();
            
            if (!evento.asistentes.includes(usuario._id)) {
                evento.asistentes.push(usuario._id);
                await evento.save();
                console.log('Evento actualizado con nuevo asistente');
            }
              console.log('Entrada creada correctamente');
            
            if (evento.clubId) {
                try {
                    const clubId = typeof evento.clubId === 'object' ? evento.clubId.toString() : evento.clubId;
                    await this.clubService.calculateAndUpdatePriceRange(clubId);
                    console.log(`Rango de precios del club ${clubId} actualizado tras la compra`);
                } catch (priceRangeError) {
                    console.error('Error al actualizar el rango de precios del club:', priceRangeError);
                }
            }
            
            return entradaGuardada;
        } catch (error) {
            console.error('Error al guardar la entrada:', error);
            throw new Error(`Error al registrar entrada: ${error.message}`);
        }
    }
}

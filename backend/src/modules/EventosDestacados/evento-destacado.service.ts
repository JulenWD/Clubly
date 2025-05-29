import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { EventoDestacado, EventoDestacadoDocument, EstadoSolicitud } from "./evento-destacado.schema";
import { Model, Types } from "mongoose";
import { Entrada } from "../Entrada/entrada.schema";

@Injectable()
export class EventoDestacadoService {
    constructor(
        @InjectModel(EventoDestacado.name) private eventoDestacadoModel: Model<EventoDestacadoDocument>
    ) {}
    async crearSolicitud(eventoId: string, clubId: string, ciudad: string): Promise<EventoDestacado> {
        const solicitudExistente = await this.eventoDestacadoModel.findOne({
            eventoId: new Types.ObjectId(eventoId),
            estado: { $in: [EstadoSolicitud.PENDIENTE, EstadoSolicitud.APROBADA] }
        });

        if (solicitudExistente) {
            throw new BadRequestException('Ya existe una solicitud para este evento');
        }

        try {
            const clubModel = this.eventoDestacadoModel.db.model('Club');
            const club = await clubModel.findById(clubId);

            if (!club) {
                throw new NotFoundException('Club no encontrado');
            }
        } catch (error) {
            console.error('Error al verificar club:', error);
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new BadRequestException('Error al verificar el club. Inténtalo de nuevo más tarde.');
        }

        const nuevaSolicitud = new this.eventoDestacadoModel({
            eventoId: new Types.ObjectId(eventoId),
            clubId: new Types.ObjectId(clubId),
            ciudad,
            estado: EstadoSolicitud.PENDIENTE,
        });

        return nuevaSolicitud.save();
    }

    async obtenerSolicitudesPorCiudad(): Promise<Record<string, any[]>> {
        const solicitudes = await this.eventoDestacadoModel.find({
            estado: EstadoSolicitud.PENDIENTE
        })
        .populate('eventoId', 'nombre fecha')
        .populate('clubId', 'nombre email ubicacion')
        .sort({ ciudad: 1, createdAt: 1 })
        .lean();

        const solicitudesPorCiudad = solicitudes.reduce((acc, solicitud) => {
            const ciudad = solicitud.ciudad;
            if (!acc[ciudad]) {
                acc[ciudad] = [];
            }
            acc[ciudad].push(solicitud);
            return acc;
        }, {});

        return solicitudesPorCiudad;
    }
    async aprobarSolicitud(solicitudId: string): Promise<EventoDestacado> {
        const solicitud = await this.eventoDestacadoModel.findById(solicitudId);

        if (!solicitud) {
            throw new NotFoundException('Solicitud no encontrada');
        }

        const now = new Date();
        const eventosDestacadosActivos = await this.eventoDestacadoModel.countDocuments({
            ciudad: solicitud.ciudad,
            estado: EstadoSolicitud.APROBADA,
            activo: true,
            fechaExpiracion: { $gt: now }
        });

        if (eventosDestacadosActivos >= 3) {
            throw new BadRequestException(`Ya hay 3 eventos destacados en ${solicitud.ciudad}. No se pueden aprobar más eventos para esta ciudad hasta que expire alguno de los destacados actuales.`);
        }

        solicitud.estado = EstadoSolicitud.APROBADA;
        solicitud.fechaAprobacion = new Date();

        const fechaExpiracion = new Date();
        fechaExpiracion.setDate(fechaExpiracion.getDate() + 7);
        solicitud.fechaExpiracion = fechaExpiracion;
        solicitud.activo = true;

        return solicitud.save();
    }

    async denegarSolicitud(solicitudId: string): Promise<EventoDestacado> {
        const solicitud = await this.eventoDestacadoModel.findByIdAndUpdate(
            solicitudId,
            { estado: EstadoSolicitud.DENEGADA },
            { new: true }
        );

        if (!solicitud) {
            throw new NotFoundException('Solicitud no encontrada');
        }

        return solicitud;
    }
    async obtenerEventosDestacadosPorCiudad(ciudad: string): Promise<any[]> {
        const eventosDestacados = await this.eventoDestacadoModel.find({
            ciudad,
            estado: EstadoSolicitud.APROBADA,
            activo: true,
            fechaExpiracion: { $gt: new Date() }
        })
        .populate({
            path: 'eventoId',
            select: 'nombre fecha hora descripcion imagen cartelUrl entradas generos clubId djIds imagenes',
            populate: [
                {
                    path: 'clubId',
                    select: 'nombre ubicacion direccion fotoPerfil priceRange priceRangeCalculated priceRangeInitial averageTicketPrice'
                },
                {
                    path: 'djIds',
                    select: 'nombre fotoPerfil generos'
                }
            ]
        })
        .lean();

        const eventosCompletos: any[] = [];
        for (const destacado of eventosDestacados) {
            const evento = destacado.eventoId as any;
            const ventas = await this.eventoDestacadoModel.db.model('Entrada').aggregate([
                { $match: { eventoId: evento._id } },
                { $group: { _id: "$tipoEntrada", total: { $sum: 1 } } }
            ]);
            evento.ventasPorTipo = {};
            ventas.forEach((v: any) => {
                evento.ventasPorTipo[v._id] = v.total;
            });

            if (evento.entradas && Array.isArray(evento.entradas)) {
                for (const entrada of evento.entradas) {
                    const entradasVendidas = evento.ventasPorTipo[entrada.tipo] || 0;
                    entrada.entradasVendidas = entradasVendidas;

                    if (entrada.tramos && Array.isArray(entrada.tramos)) {
                        let ventasAcumuladas = 0;
                        for (const tramo of entrada.tramos) {
                            tramo.cantidadVendida = Math.min(
                                (tramo.cantidadDisponible as number) || (tramo.hasta - ventasAcumuladas),
                                Math.max(0, entradasVendidas - ventasAcumuladas)
                            );
                            ventasAcumuladas += (tramo.cantidadDisponible as number) || (tramo.hasta - (ventasAcumuladas || 0));
                        }
                    }
                }
            }

            eventosCompletos.push(evento);
        }

        return eventosCompletos;
    }

    async obtenerSolicitudesPorClub(clubId: string): Promise<EventoDestacado[]> {
        return this.eventoDestacadoModel.find({
            clubId: new Types.ObjectId(clubId)
        })
        .populate('eventoId', 'nombre fecha')
        .sort({ createdAt: -1 })
        .lean();
    }

    async contarEventosDestacadosPorCiudad(ciudad: string): Promise<number> {
        const now = new Date();
        return this.eventoDestacadoModel.countDocuments({
            ciudad,
            estado: EstadoSolicitud.APROBADA,
            activo: true,
            fechaExpiracion: { $gt: now }
        });
    }

    async verificarEventoYaDestacado(eventoId: string): Promise<boolean> {
        const now = new Date();
        const destacado = await this.eventoDestacadoModel.findOne({
            eventoId: new Types.ObjectId(eventoId),
            estado: { $in: [EstadoSolicitud.PENDIENTE, EstadoSolicitud.APROBADA] },
            $or: [
                { fechaExpiracion: { $gt: now } },
                { estado: EstadoSolicitud.PENDIENTE }
            ]
        });

        return !!destacado;
    }

    async desactivarEventosExpirados(): Promise<number> {
        const resultado = await this.eventoDestacadoModel.updateMany(
            {
                fechaExpiracion: { $lte: new Date() },
                activo: true
            },
            { activo: false }
        );

        return resultado.modifiedCount;
    }
}

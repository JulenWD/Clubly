import {
    Body,
    Controller,
    Headers,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { PagoService } from './pagos.service';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {FirebaseAuthGuard} from "../../auth/firebase-auth-guard";

@Controller('pagos')
export class PagosController {
    constructor(
        private readonly pagosService: PagoService,
        private readonly configService: ConfigService,
    ) {}

    @Post('crear-sesion')
    @UseGuards(FirebaseAuthGuard)
    async crearSesion(@Body() body, @Req() req) {
        const { eventoId, tipoEntrada } = body;
        return this.pagosService.crearSesionCheckout(
            req.user.uid,
            eventoId,
            tipoEntrada,
        );
    }    @Post('webhook')
    async handleStripeWebhook(
        @Req() req: any,
        @Headers('stripe-signature') signature: string,
    ) {
        const endpointSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
        const rawBody = req.body;
        if (!Buffer.isBuffer(rawBody)) {
            console.error('El body recibido en el webhook NO es un Buffer. Esto causará fallo de firma Stripe. Tipo:', typeof rawBody);
        } else {
            console.log('El body recibido en el webhook es un Buffer.');
        }
        let event: Stripe.Event;

        try {
            event = this.pagosService.construirEventoDesdeStripe(
                rawBody,
                signature,
                endpointSecret,
            );
            console.log('Webhook recibido de Stripe:', event.type, JSON.stringify(event.data.object));
        } catch (err) {
            console.error('Error verificando webhook de Stripe:', err.message);
            return { error: 'Invalid webhook signature', status: 'failed' };
        }

        if (event.type !== 'checkout.session.completed') {
            console.log('Evento de Stripe ignorado:', event.type);
            return { received: true };
        }

        const session = event.data.object as Stripe.Checkout.Session;
        const sessionData = {
            id: session.id,
            metadata: session.metadata,
            customerEmail: session.customer_email
        };
        console.log('Datos de la sesión de Stripe:', sessionData);

        const eventoId = session.metadata?.eventoId;
        const tipoEntrada = session.metadata?.tipoEntrada;
        const usuarioEmail = session.customer_email;

        if (!eventoId || !tipoEntrada || !usuarioEmail) {
            const error = 'Faltan datos requeridos en el evento de Stripe';
            console.error(error, { eventoId, tipoEntrada, usuarioEmail });
            return { error, received: false };
        }
        try {
            const entradaRegistrada = await this.pagosService.registrarEntradaExitosa(
                usuarioEmail,
                eventoId,
                tipoEntrada,
            );
            console.log('Resultado de registrarEntradaExitosa:', entradaRegistrada);
            return {
                received: true,
                success: true,
                entradaId: entradaRegistrada?._id || null
            };
        } catch (err) {
            console.error('Error en registrarEntradaExitosa:', err);
            return {
                error: 'Error al registrar la entrada',
                details: err.message,
                received: true,
                success: false
            };
        }
    }
}

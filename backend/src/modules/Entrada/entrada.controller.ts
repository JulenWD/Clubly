import {Controller, Get, Param, Post, Req, UseGuards} from "@nestjs/common";
import {AuthGuard} from "../../auth/auth.guard";
import {EntradaService} from "./entrada.service";
import {Types} from "mongoose";

@Controller('entradas')
@UseGuards(AuthGuard)
export class EntradaController {
    constructor(private readonly entradaService: EntradaService) {}

    @Post('comprar/:eventoId')
    async comprarEntrada(@Req() req, @Param('eventoId') eventoId: string) {
        const usuarioId = new Types.ObjectId(req.user._id)
        return this.entradaService.crearEntrada(usuarioId, new Types.ObjectId(eventoId))
    }    @Get('mis-entradas')    async verEntradas(@Req() req) {
        const usuarioId = req.user._id || req.user.uid || req.user.id;
        if (!usuarioId) {
            return [];
        }
        
        try {
            if (usuarioId && usuarioId.length === 24) {
                return await this.entradaService.obtenerEntradasDeUsuario(new Types.ObjectId(usuarioId));
            } else if (usuarioId) {
                return await this.entradaService.obtenerEntradasDeUsuarioPorUid(usuarioId);
            }
            return [];
        } catch (err) {
            console.error('Error al obtener entradas:', err);
            return [];
        }
    }

    @Get('ultima')
    async obtenerUltimaEntrada(@Req() req) {
        if (!req.user) {
            throw new Error('No autorizado: usuario no autenticado');
        }
        const usuarioId = req.user._id || req.user.uid || req.user.id;
        let entrada;
        if (usuarioId && usuarioId.length === 24) {
            entrada = await this.entradaService.obtenerUltimaEntradaPorObjectId(usuarioId);
        } else if (usuarioId) {
            entrada = await this.entradaService.obtenerUltimaEntradaPorUid(usuarioId);
        } else {
            throw new Error('No autorizado: usuario no autenticado');
        }
        if (!entrada) throw new Error('No se encontró ninguna entrada');
        return entrada;
    }

    @Get(':id')
    async obtenerEntradaPorId(@Param('id') id: string) {
        return this.entradaService.obtenerEntradaPorId(id);
    }

    @Get('ventas-por-evento/:eventoId')
    async ventasPorEvento(@Param('eventoId') eventoId: string) {
        return this.entradaService.ventasPorEvento(eventoId);
    }
}
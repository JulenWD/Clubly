import { Controller, Post, Get, Param, Put, Body, UseGuards, Req, Inject } from '@nestjs/common';
import { EventoDestacadoService } from './evento-destacado.service';
import { FirebaseAuthGuard } from '../../auth/firebase-auth-guard';
import { Roles } from '../../decorators/roles.decorators';
import { RolesGuard } from '../../auth/roles.guard';
import { UsuarioService } from '../Usuarios/usuario.service';

@Controller('eventos-destacados')
export class EventoDestacadoController {
    constructor(
        private readonly eventoDestacadoService: EventoDestacadoService,
        private readonly usuarioService: UsuarioService
    ) {}
    
    @Post('solicitar/:eventoId')
    @UseGuards(FirebaseAuthGuard)
    async solicitarDestacado(
        @Param('eventoId') eventoId: string,
        @Body() data: { clubId: string, ciudad: string }
    ) {
        try {
            return await this.eventoDestacadoService.crearSolicitud(
                eventoId,
                data.clubId,
                data.ciudad
            );
        } catch (error) {
            console.error('Error al solicitar destacar evento:', error);
            throw error;        
        }
    }
    
    @Get('solicitudes')
    @UseGuards(FirebaseAuthGuard)
    async obtenerSolicitudesPorCiudad(@Req() req) {
        try {
            if (!req.user) {
                throw new Error('No estás autenticado. Por favor, inicia sesión.');
            }
            
            const usuarioBD = await this.usuarioService.findByUid(req.user.uid);
            
            if (usuarioBD && usuarioBD.rol === 'admin') {
                const resultado = await this.eventoDestacadoService.obtenerSolicitudesPorCiudad();
                return resultado;
            }
            
            throw new Error('No tienes permisos para acceder a esta funcionalidad. Se requiere rol de administrador.');
        } catch (error) {
            console.error('Error al obtener solicitudes por ciudad:', error);
            throw error;
        }
    }
    
    @Put('aprobar/:id')
    @UseGuards(FirebaseAuthGuard)
    async aprobarSolicitud(@Param('id') id: string, @Req() req) {
        try {
            if (!req.user) {
                throw new Error('No estás autenticado. Por favor, inicia sesión.');
            }
            
            const usuarioBD = await this.usuarioService.findByUid(req.user.uid);
            
            if (usuarioBD && usuarioBD.rol === 'admin') {
                return await this.eventoDestacadoService.aprobarSolicitud(id);
            }
            
            throw new Error('No tienes permisos para aprobar solicitudes. Se requiere rol de administrador.');
        } catch (error) {
            console.error('Error al aprobar solicitud:', error);
            throw error;
        }
    }
    
    @Put('denegar/:id')
    @UseGuards(FirebaseAuthGuard)
    async denegarSolicitud(@Param('id') id: string, @Req() req) {
        try {
            if (!req.user) {
                throw new Error('No estás autenticado. Por favor, inicia sesión.');
            }
            
            const usuarioBD = await this.usuarioService.findByUid(req.user.uid);
            
            if (usuarioBD && usuarioBD.rol === 'admin') {
                return await this.eventoDestacadoService.denegarSolicitud(id);
            }
            
            throw new Error('No tienes permisos para denegar solicitudes. Se requiere rol de administrador.');
        } catch (error) {
            console.error('Error al denegar solicitud:', error);
            throw error;
        }
    }
    
    @Get('ciudad/:ciudad')
    async obtenerEventosDestacadosPorCiudad(@Param('ciudad') ciudad: string) {
        try {
            const eventos = await this.eventoDestacadoService.obtenerEventosDestacadosPorCiudad(ciudad);
            
            if (eventos && eventos.length > 0) {
                eventos.forEach((evento, index) => {
                    if (!evento.cartelUrl) {
                        console.warn(`⚠️ El evento ${evento.nombre} (${evento._id}) no tiene cartelUrl definido`);
                    }
                    if (!evento.entradas || evento.entradas.length === 0) {
                        console.warn(`⚠️ El evento ${evento.nombre} (${evento._id}) no tiene entradas definidas`);
                    }
                });
            }
            
            return eventos;
        } catch (error) {
            console.error(`Error al obtener eventos destacados para ${ciudad}:`, error);
            throw error;
        }
    }
    
    @Get('club/:clubId')
    @UseGuards(FirebaseAuthGuard)
    async obtenerSolicitudesPorClub(@Param('clubId') clubId: string) {
        try {
            return await this.eventoDestacadoService.obtenerSolicitudesPorClub(clubId);
        } catch (error) {
            console.error('Error al obtener solicitudes por club:', error);
            throw error;
        }
    }
    
    @Get('contar/:ciudad')
    async contarEventosDestacadosPorCiudad(@Param('ciudad') ciudad: string) {
        return {
            total: await this.eventoDestacadoService.contarEventosDestacadosPorCiudad(ciudad)
        };
    }
    
    @Get('verificar/:eventoId')
    async verificarEventoYaDestacado(@Param('eventoId') eventoId: string) {
        const estaDestacado = await this.eventoDestacadoService.verificarEventoYaDestacado(eventoId);
        return { destacado: estaDestacado };
    }

    @Post('limpiar-expirados')
    @UseGuards(FirebaseAuthGuard, RolesGuard)
    @Roles('admin')
    async limpiarEventosExpirados() {
        const desactivados = await this.eventoDestacadoService.desactivarEventosExpirados();
        return { 
            mensaje: 'Eventos destacados expirados desactivados', 
            desactivados 
        };
    }
}

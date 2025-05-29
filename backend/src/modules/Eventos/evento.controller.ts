import {Body, Controller, Delete, Get, Param, Post, Put, UseGuards, Req, NotFoundException} from "@nestjs/common";
import {EventoService} from "./evento.service";
import {Evento} from "./evento.schema";
import {CreateEventoDto} from "./dto/create-evento.dto";
import {AuthGuard} from "../../auth/auth.guard";
import {ClubService} from "../Clubs/club.service";
import {UsuarioService} from "../Usuarios/usuario.service";
import { DjService } from "../DJ/dj.service";

@Controller('eventos')
export class EventoController {
    constructor(
        private readonly eventoService: EventoService,
        private readonly clubService: ClubService,
        private readonly usuarioService: UsuarioService,
        private readonly djService: DjService
    ) {}

    @Post()
    async create(@Body() data: CreateEventoDto): Promise<Evento> {
        if (data.clubId) {
            const club = await this.clubService.findById(String(data.clubId));
            if (!club) throw new NotFoundException('Club no encontrado');
            if (!club.verificado) {
                throw new Error('No se pueden crear eventos para un club no verificado. Por favor, contacta con el administrador para verificar tu club.');
            }
        }
        
        if (data.djIds && Array.isArray(data.djIds)) {
            for (const djId of data.djIds) {
                const dj = await this.djService.findById(String(djId));
                if (!dj) throw new NotFoundException('DJ no encontrado');
                if (!dj.verificado) {
                    throw new Error('No se puede asignar un DJ no verificado a un evento');
                }
            }
        }
        return this.eventoService.create(data)
    }

    @Get()
    async findAll(): Promise<Evento[]> {
        return this.eventoService.findAll()
    }    @Get('mis-eventos')
    @UseGuards(AuthGuard)
    async getMisEventos(@Req() req): Promise<Evento[]> {
        const usuario = await this.usuarioService.findByUid(req.user.uid);
        if (!usuario) throw new NotFoundException('Usuario no encontrado');
        if (usuario.rol !== 'propietario') return [];
        const club = await this.clubService.findByUsuarioUid(req.user.uid);
        if (!club) return [];
        return this.eventoService.findByClubId(club['_id']);
    }

    @Get('dj/:id')
    async findByDjId(@Param('id') id: string): Promise<Evento[]> {
        const eventos = await this.eventoService.findByDjId(id);
        return eventos;
    }

    @Get('club/:id')
    async findByClubId(@Param('id') id: string): Promise<Evento[]> {
        return this.eventoService.findByClubId(id);
    }

    @Get(':id')
    async findById(@Param('id') id:string): Promise<Evento | null>{
        return this.eventoService.findById(id)
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() data: Partial<Evento>): Promise<Evento | null> {
        if (data.djIds && Array.isArray(data.djIds)) {
            for (const djId of data.djIds) {
                const dj = await this.djService.findById(String(djId));
                if (!dj) throw new NotFoundException('DJ no encontrado');
                if (!dj.verificado) {
                    throw new Error('No se puede asignar un DJ no verificado a un evento');
                }
            }
        }
        return this.eventoService.update(id,data)
    }

    @Put(':id/entradas')
    async actualizarEntradas(
        @Param('id') id: string,
        @Body('entradas') entradas: any[]
    ) {
        return this.eventoService.actualizarEntradas(id, entradas);
    }

    @Delete(':id')
    async delete(@Param('id') id: string): Promise<Evento | null> {
        return this.eventoService.delete(id)
    }
}
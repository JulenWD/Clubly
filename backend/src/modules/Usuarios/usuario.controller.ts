import {Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Put, Req, UseGuards, ConflictException} from "@nestjs/common";
import {UsuarioService} from "./usuario.service";
import {Usuario} from "./usuario.schema";
import { AuthGuard } from "../../auth/auth.guard";
import { Roles } from "../../decorators/roles.decorators";
import { RolesGuard } from "../../auth/roles.guard";
import {CreateUsuarioDto} from "./dto/create-usuario.dto";

interface AuthRequest extends Request {
    user: {
        uid: string;
        email: string;
    }
}

@Controller("usuarios")
export class UsuarioController {

    constructor(private readonly usuarioService: UsuarioService ) {
    }

    @Post()
    async create(@Body() data: CreateUsuarioDto): Promise<{ message: string; usuario: Usuario }> {
        try {
            let mayorDeEdad = false;
            if (data.fechaNacimiento) {
                const hoy = new Date();
                const fechaNac = new Date(data.fechaNacimiento);
                const edad = hoy.getFullYear() - fechaNac.getFullYear();
                const cumpleEsteAnyo = new Date(hoy.getFullYear(), fechaNac.getMonth(), fechaNac.getDate());
                mayorDeEdad = hoy >= cumpleEsteAnyo ? edad >= 18 : edad - 1 >= 18;
            }
            const usuarioConUidYEmail = {
                ...data,
                mayorDeEdad,
                fechaNacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento) : undefined,
            };
            const usuario = await this.usuarioService.create(usuarioConUidYEmail);
            return { message: 'Usuario creado o encontrado exitosamente', usuario };
        } catch (error) {
            throw new Error('Error al crear el usuario: ' + error.message);
        }
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin')
    @Get()
    async findAll():Promise<Usuario[]> {
       return this.usuarioService.findAll()
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin')
    @Get(":id")
    async findById(@Param("id") uid: string):Promise<Usuario | null> {
        return this.usuarioService.findByUid(uid)
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles('usuario', 'dj', 'propietario')
    @Put("me")
    async update(@Req() req: AuthRequest, @Body() data: Partial<Usuario>): Promise<Usuario> {
        const uid = req.user.uid;

        if (data.fechaNacimiento) {
            const hoy = new Date()
            const fechaNac = new Date(data.fechaNacimiento)
            const edad = hoy.getFullYear() - fechaNac.getFullYear()
            const cumpleEsteAnyo = new Date(hoy.getFullYear(), fechaNac.getMonth(), fechaNac.getDate())
            data['mayorDeEdad'] = hoy >= cumpleEsteAnyo ? edad >= 18 : edad -1 >= 18
        }
        const actualizado = await this.usuarioService.updateByUid(uid, data)

        if(!actualizado) {
            throw new NotFoundException('Usuario no encontrado')
        }

        const actualizadoDoc = await this.usuarioService.findByUid(uid);
        if (actualizadoDoc) {
            await this.usuarioService.syncClubWithUsuario(actualizadoDoc, data);
        }

        return actualizado
    }    
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin')
    @Get('admin-list')
    async getAdminList() {
        const all = await this.usuarioService.findAll();
        return {
            usuarios: all.filter(u => (u.rol?.toLowerCase?.() === 'usuario') && u.verificado !== true),
            djs: all.filter(u => (u.rol?.toLowerCase?.() === 'dj') && u.verificado !== true),
            clubs: all.filter(u => (u.rol?.toLowerCase?.() === 'propietario') && u.verificado !== true),
        };
    }    
    @Get('debug-public')
    debugPublic() {
        return { test: 'public ok', time: new Date().toISOString() };
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin')
    @Get('admin-list-debug')
    async getAdminListDebug() {
        return { test: 'ok', time: new Date().toISOString() };
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin')
    @Patch(':id/verificar')
    async verificarUsuario(@Param('id') id: string, @Body() body: { verificado: boolean }) {
        return this.usuarioService.setVerificado(id, body.verificado);
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin')
    @Delete(":id")
    async delete(@Param("id") id: string): Promise<Usuario> {
        return this.usuarioService.delete(id)
    }
}

import { UseGuards, NotFoundException, Patch, Param, Body, Delete, Get, Controller } from '@nestjs/common';
import { Roles } from './decorators/roles.decorators';
import { AuthGuard } from './auth/auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { UsuarioService } from './modules/Usuarios/usuario.service';
import { Usuario } from './modules/Usuarios/usuario.schema';
import { Rol } from './modules/Usuarios/roles.enum';

@Controller('administracion')
export class AdministracionController {    constructor(private readonly usuarioService: UsuarioService) {}    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin')    @Get('usuarios')    async getAdminList() {
        const all = await this.usuarioService.findAll();
        
        return {
            usuarios: all.filter(u => u.rol === Rol.USUARIO && u.verificado !== true),
            djs: all.filter(u => u.rol === Rol.DJ && u.verificado !== true),
            clubs: all.filter(u => u.rol === Rol.PROPIETARIO && (u.verificado === false || u.verificado === null || u.verificado === undefined)),
        };
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin')
    @Patch('usuarios/:id/verificar')
    async verificarUsuario(@Param('id') id: string, @Body() body: { verificado: boolean }) {
        return this.usuarioService.setVerificado(id, body.verificado);
    }

    @UseGuards(AuthGuard, RolesGuard)
    @Roles('admin')
    @Delete('usuarios/:id')
    async delete(@Param('id') id: string): Promise<Usuario> {
        return this.usuarioService.delete(id)
    }
}
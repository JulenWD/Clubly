import {CanActivate, ExecutionContext, forwardRef, Inject, Injectable, UnauthorizedException} from '@nestjs/common';
import admin from './firebase.config';
import { UsuarioService } from "../modules/Usuarios/usuario.service";

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        @Inject(forwardRef(() => UsuarioService))
        private readonly usuarioService: UsuarioService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        const authHeader = request.headers['authorization'];
        if (!authHeader) throw new UnauthorizedException('No authorization header');

        const token = authHeader.split(' ')[1];
        if (!token) throw new UnauthorizedException('No token provided');

        try {
            const decodedToken = await admin.auth().verifyIdToken(token);
            const isCreateUserRequest = request.method === 'POST' && request.url === '/usuarios'

            if(!isCreateUserRequest) {                const usuario = await this.usuarioService.findByUid(decodedToken.uid)
                if (!usuario) {
                    throw new UnauthorizedException('Usuario no encontrado en la base de datos')
                }
                request.user = {
                    uid: usuario.uid,
                    email: usuario.email,
                    rol: usuario.rol,
                    verificado: usuario.verificado
                }
            } else {
                request.user = {
                    uid: decodedToken.uid,
                    email: decodedToken.email
                }
            }
            return true;
        } catch (error) {
            console.error('Firebase Token Error:', error);
            throw new UnauthorizedException('Invalid token');
        }
    }
}

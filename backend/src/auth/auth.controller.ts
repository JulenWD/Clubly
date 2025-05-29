import {
    Body,
    ConflictException,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    Req,
    Res,
    UnauthorizedException,
    UseGuards
} from "@nestjs/common";
import { JwtService } from '@nestjs/jwt';
import { UsuarioService } from "../modules/Usuarios/usuario.service";
import * as admin from 'firebase-admin';
import { Response } from 'express';
import { AuthGuard } from "./auth.guard";
import { CreateUsuarioDto } from "../modules/Usuarios/dto/create-usuario.dto";
import { Rol } from '../modules/Usuarios/roles.enum';
import { Usuario } from "../modules/Usuarios/usuario.schema";
import { ClubService } from "../modules/Clubs/club.service";

interface RequestWithCookies extends Request {
    cookies: {
        refreshToken?: string;
    }
}

@Controller('auth')
export class AuthController {
    constructor(
        private readonly jwtService: JwtService,
        private readonly usuarioService: UsuarioService,
        private readonly clubService: ClubService
    ) {}    @Post('register')
    async register(@Body() body: { idToken: string, email: string, nombre: string, rol: string, [key: string]: any }, @Res() res: Response) {
        try {
            const decodedToken = await admin.auth().verifyIdToken(body.idToken);
            const uid = decodedToken.uid;
            
            const existingUser = await this.usuarioService.findByUid(uid);
            if (existingUser) {
                throw new ConflictException('El usuario ya está registrado');
            }
            
            let rolBackend: Rol;
            switch(body.rol.toLowerCase()) {
                case 'dj':
                    rolBackend = Rol.DJ;
                    break;
                case 'usuario':
                    rolBackend = Rol.USUARIO;
                    break;
                case 'propietario':
                    rolBackend = Rol.PROPIETARIO;
                    break;
                case 'admin':
                    rolBackend = Rol.ADMIN;
                    break;
                default:
                    rolBackend = Rol.USUARIO;
            }
            
            const userData: Partial<Usuario> = {
                uid: uid,
                email: body.email,
                nombre: body.nombre,
                rol: rolBackend,
                verificado: rolBackend === Rol.ADMIN,
                gustosMusicales: body.gustos ? body.gustos.split(',').map(g => g.trim()) : [],
                ubicacion: body.ciudad || '',
                fotoPerfil: body.fotoPerfil || '',
                biografia: body.bio || '',
                dni: body.dni || '',
            };
            
            if (body.fechaNacimiento) {
                userData.fechaNacimiento = new Date(body.fechaNacimiento);
            }
            
            const clubData = rolBackend === Rol.PROPIETARIO 
                ? { 
                    priceRangeInitial: body.priceRangeInitial || 1,
                    direccion: body.direccion || ''
                } 
                : null;
            
            const newUser = await this.usuarioService.create(userData);
            
            if (rolBackend === Rol.PROPIETARIO && clubData) {
        
                const usuarioCreado = await this.usuarioService.findByUid(newUser.uid);
                if (usuarioCreado) {
                    await this.clubService.create({
                        propietario: usuarioCreado['_id'], 
                        nombre: body.nombreClub || `Club de ${newUser.nombre}`,
                        ubicacion: body.ciudad || '',
                        direccion: clubData.direccion,
                        priceRangeInitial: clubData.priceRangeInitial,
                        rangoPrecios: 'medio', 
                        redesSociales: []
                    });
                }
            }
            
            const payload = { uid: newUser.uid, rol: newUser.rol };
            const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
            const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
            
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            
            return res.json({
                accessToken,
                perfil: newUser,
            });
              } catch (error) {
            if (error instanceof ConflictException) {
                throw error;
            }
            throw new UnauthorizedException(error.message || 'Error durante el registro');
        }
    }

    @Post('login')
    async login(@Body() body: { idToken: string }, @Res() res: Response) {
        try {            const decodedToken = await admin.auth().verifyIdToken(body.idToken);
            const uid = decodedToken.uid;
            let usuario = await this.usuarioService.findByUid(uid);

            if (!usuario) {
                throw new UnauthorizedException('Perfil no encontrado. Completa el registro.');
            }

            const payload = { uid: usuario.uid, rol: usuario.rol };
            const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
            const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            return res.json({
                accessToken,
                perfil: usuario,
            });        } catch (error) {
            throw new UnauthorizedException(error.message || 'Token inválido o usuario no encontrado');
        }
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(@Req() req: RequestWithCookies, @Res() res: Response) {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            throw new UnauthorizedException('No hay refresh token');
        }

        try {
            const decoded = this.jwtService.verify(refreshToken);

            const payload = {
                uid: decoded.uid,
                rol: decoded.rol,
            };

            const newAccessToken = this.jwtService.sign(payload, {
                expiresIn: '15m',
            });

            return res.json({ accessToken: newAccessToken });        } catch (err) {
            throw new UnauthorizedException('Refresh token inválido');
        }
    }

    @UseGuards(AuthGuard)
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    logout(@Res({ passthrough: true }) res: Response) {
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
        });

        return { message: 'Logout exitoso' };
    }
}

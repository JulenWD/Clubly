import {JwtModule} from "@nestjs/jwt";
import {UsuarioModule} from "../modules/Usuarios/usuario.module";
import {AuthController} from "./auth.controller";
import {Module} from "@nestjs/common";
import {AuthGuard} from "./auth.guard";
import {UsuarioService} from "../modules/Usuarios/usuario.service";
import {ClubModule} from "../modules/Clubs/club.module";

@Module({    imports: [
        JwtModule.register({
            secret: 'jwt-secret',
            signOptions: { expiresIn: '15m' }
        }),
        UsuarioModule,
        ClubModule,
    ],
    controllers: [AuthController],
    providers: [AuthGuard],
    exports: []
})
export class AuthModule {}
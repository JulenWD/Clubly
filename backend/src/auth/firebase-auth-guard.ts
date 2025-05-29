import admin from "./firebase-admin"
import {CanActivate, ExecutionContext, Injectable, UnauthorizedException} from "@nestjs/common";

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest()
        const  authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("Token no encontrado")
        }

        const idToken = authHeader.split("Bearer ")[1];

        try {
            const decodedToken = await admin.auth().verifyIdToken(idToken)
            req.user = decodedToken
            return true
        } catch (err) {
            throw new UnauthorizedException("Token inválido o expirado")
        }
    }
}
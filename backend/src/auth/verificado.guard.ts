import {CanActivate, ExecutionContext, ForbiddenException, Injectable} from "@nestjs/common";

@Injectable()
export class VerificadoGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        
        if (!user || !user.verificado) {
            throw new ForbiddenException('Solo los usuarios verificados pueden realizar esta acción');
        }

        return true;
    }
}
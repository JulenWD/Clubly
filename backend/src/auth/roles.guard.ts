import {CanActivate, ExecutionContext, ForbiddenException, Injectable} from "@nestjs/common";
import {Reflector} from "@nestjs/core";
import {ROLES_KEY} from "../decorators/roles.decorators";

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()]
        );
        
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }
        
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.rol) {
            throw new ForbiddenException('Acceso denegado: no tienes los permisos necesarios');
        }

        if (requiredRoles.includes(user.rol)) {
            return true;
        }        throw new ForbiddenException(
            `Acceso denegado: se requiere el rol '${requiredRoles.join(' o ')}'`
        );
    }
}

import { Module, forwardRef } from "@nestjs/common";
import { PagoService } from "./pagos.service";
import { PagosController } from "./pagos.controller";
import { EventoModule } from "../Eventos/evento.module";
import { EntradaModule } from "../Entrada/entrada.module";
import { UsuarioModule } from "../Usuarios/usuario.module";
import { ClubModule } from "../Clubs/club.module";

@Module({    imports: [
        forwardRef(() => EventoModule),
        forwardRef(() => EntradaModule), 
        forwardRef(() => UsuarioModule),
        forwardRef(() => ClubModule)
    ],
    controllers: [PagosController],
    providers: [PagoService],
    exports: [PagoService]
})
export class PagosModule {}
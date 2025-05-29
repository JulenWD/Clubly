import {MongooseModule} from "@nestjs/mongoose";
import {Evento, EventoSchema} from "./evento.schema";
import {EventoController} from "./evento.controller";
import {EventoService} from "./evento.service";
import {Module, forwardRef} from "@nestjs/common";
import {Club, ClubSchema} from "../Clubs/club.schema";
import {Usuario, UsuarioSchema} from "../Usuarios/usuario.schema";
import { UsuarioModule } from '../Usuarios/usuario.module';
import { ClubModule } from '../Clubs/club.module';
import { ReviewModule } from '../Review/review.module';
import { DjModule } from '../DJ/dj.module';

@Module({    imports: [
        MongooseModule.forFeature([
            { name: Evento.name, schema: EventoSchema },
            { name: Club.name, schema: ClubSchema },
            { name: Usuario.name, schema: UsuarioSchema }
        ]),
        forwardRef(() => ClubModule),
        forwardRef(() => UsuarioModule),
        forwardRef(() => ReviewModule),
        forwardRef(() => DjModule)
    ],
    controllers: [EventoController],
    providers: [EventoService],
    exports: [EventoService, MongooseModule]
})
export class EventoModule {}
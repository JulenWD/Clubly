import {Module, forwardRef} from "@nestjs/common";
import {MongooseModule} from "@nestjs/mongoose";
import {Usuario, UsuarioSchema} from "./usuario.schema";
import {UsuarioService} from "./usuario.service";
import {DjModule} from "../DJ/dj.module";
import {ClubModule} from "../Clubs/club.module";
import { DJ, DJSchema } from '../DJ/dj.schema';
import { Club, ClubSchema } from '../Clubs/club.schema';
import { UsuarioController } from "./usuario.controller";

@Module({    imports:[MongooseModule.forFeature([
            { name: Usuario.name, schema: UsuarioSchema},
            { name: Club.name, schema: ClubSchema},
            { name: DJ.name, schema: DJSchema},
    ]),
        forwardRef(() => ClubModule),
        forwardRef(() => DjModule)
    ],
    controllers: [UsuarioController],
    providers: [UsuarioService],
    exports: [UsuarioService, MongooseModule]
})
export class UsuarioModule {}
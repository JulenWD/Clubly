import {MongooseModule} from "@nestjs/mongoose";
import {Review, ReviewSchema} from "./review.schema";
import {ReviewController} from "./review.controller";
import {ReviewService} from "./review.service";
import {forwardRef, Module} from "@nestjs/common";
import {UsuarioModule} from "../Usuarios/usuario.module";
import {EntradaModule} from "../Entrada/entrada.module";
import { DiagnosticoController } from "./diagnostico.controller";
import { ClubModule } from "../Clubs/club.module";
import { DjModule } from "../DJ/dj.module";
import { Club, ClubSchema } from "../Clubs/club.schema";
import { DJ, DJSchema } from "../DJ/dj.schema";

@Module({
    imports: [
        MongooseModule.forFeature([
            {name: Review.name, schema: ReviewSchema},
            {name: Club.name, schema: ClubSchema},
            {name: DJ.name, schema: DJSchema}
        ]),
        forwardRef(() => UsuarioModule),
        forwardRef(() => EntradaModule),
        forwardRef(() => ClubModule),
        forwardRef(() => DjModule)
    ],
    controllers: [ReviewController, DiagnosticoController],
    providers: [ReviewService],
    exports: [ReviewService]
})
export class ReviewModule {}
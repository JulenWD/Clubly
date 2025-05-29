import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DJ, DJSchema } from "./dj.schema";
import { DjController } from "./dj.controller";
import { DjService } from "./dj.service";
import { UsuarioModule } from '../Usuarios/usuario.module';
import { ReviewModule } from '../Review/review.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: DJ.name, schema: DJSchema }]),
        forwardRef(() => UsuarioModule),
        forwardRef(() => ReviewModule),
    ],
    controllers: [DjController],
    providers: [DjService],
    exports: [DjService],
})
export class DjModule {}
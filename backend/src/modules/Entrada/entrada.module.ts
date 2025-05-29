import {forwardRef, Module} from "@nestjs/common";
import {MongooseModule} from "@nestjs/mongoose";
import {Entrada, EntradaSchema} from "./entrada.schema";
import {EntradaService} from "./entrada.service";
import {EntradaController} from "./entrada.controller";
import {UsuarioModule} from "../Usuarios/usuario.module";

@Module({
    imports: [MongooseModule.forFeature([{name: Entrada.name, schema: EntradaSchema}]),
    forwardRef(() => UsuarioModule)],
    providers: [EntradaService],
    controllers: [EntradaController],
    exports: [EntradaService, MongooseModule]
})
export class EntradaModule {}
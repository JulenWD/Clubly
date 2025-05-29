import { Module, forwardRef } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {MongooseModule} from "@nestjs/mongoose";
import {EventoModule} from "./modules/Eventos/evento.module";
import {UsuarioModule} from "./modules/Usuarios/usuario.module";
import {ReviewModule} from "./modules/Review/review.module";
import {DjModule} from "./modules/DJ/dj.module";
import {ClubModule} from "./modules/Clubs/club.module";
import {AuthModule} from "./auth/auth.module";
import {ConfigModule} from "@nestjs/config";
import {PagosModule} from "./modules/Pagos/pagos.module";
import {EventoDestacadoModule} from "./modules/EventosDestacados/evento-destacado.module";
import { AdministracionController } from './administracion.controller';

@Module({  
  imports: [  ConfigModule.forRoot({
    isGlobal: true
  }),
  MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb+srv://julenalonsorodero:1234@cluster0.tlb2w.mongodb.net/ClublyDB?retryWrites=true&w=majority&appName=Cluster0'),
  forwardRef(() => EventoModule),
  forwardRef(() => UsuarioModule),
  forwardRef(() => ReviewModule),
  forwardRef(() => DjModule),
  forwardRef(() => ClubModule),
  forwardRef(() => PagosModule),
  forwardRef(() => EventoDestacadoModule),
  AuthModule
  ],
  controllers: [AppController, AdministracionController],
  providers: [AppService],
})
export class AppModule {}

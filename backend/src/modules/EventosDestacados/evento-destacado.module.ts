import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { EventoDestacado, EventoDestacadoSchema } from './evento-destacado.schema';
import { EventoDestacadoService } from './evento-destacado.service';
import { EventoDestacadoController } from './evento-destacado.controller';
import { SchedulerService } from './scheduler.service';
import { UsuarioModule } from '../Usuarios/usuario.module';

@Module({  imports: [
    MongooseModule.forFeature([
      { name: EventoDestacado.name, schema: EventoDestacadoSchema }
    ]),
    ScheduleModule.forRoot(),
    UsuarioModule
  ],
  controllers: [EventoDestacadoController],
  providers: [EventoDestacadoService, SchedulerService],
  exports: [EventoDestacadoService]
})
export class EventoDestacadoModule {}

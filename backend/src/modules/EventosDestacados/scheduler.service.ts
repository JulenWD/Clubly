import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventoDestacadoService } from './evento-destacado.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly eventoDestacadoService: EventoDestacadoService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDesactivarEventosExpirados() {
    this.logger.log('Ejecutando tarea de desactivación de eventos destacados expirados');
    
    try {
      const eventosDesactivados = await this.eventoDestacadoService.desactivarEventosExpirados();
      this.logger.log(`Eventos desactivados: ${eventosDesactivados}`);
    } catch (error) {
      this.logger.error('Error al desactivar eventos expirados', error);
    }
  }
}

import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Get('test-root')
  testRoot() {
    console.log('Entrando en testRoot');
    return { test: 'root ok' };
  }
}

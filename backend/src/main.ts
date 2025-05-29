import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { json, raw } from 'express';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'https://clubly-p2t0087v8-julens-projects-2e33d71b.vercel.app', // tu frontend en Vercel
      'http://localhost:5173' // para desarrollo local, si quieres
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  app.use(cookieParser());
  app.use('/pagos/webhook', raw({ type: '*/*' }));
  app.use(json());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

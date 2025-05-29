import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { json, raw } from 'express';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'https://clubly-pdko9apjj-julens-projects-2e33d71b.vercel.app',
      'https://clubly-p2t0087v8-julens-projects-2e33d71b.vercel.app',
      'http://localhost:5173'
    ],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  app.use(cookieParser());
  app.use('/pagos/webhook', raw({ type: '*/*' }));
  app.use(json());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

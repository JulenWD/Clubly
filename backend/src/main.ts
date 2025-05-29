import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { json, raw } from 'express';
import { ValidationPipe, Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS dinámico para todos los subdominios de Vercel y localhost
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:5173',
      ];
      // Permite cualquier subdominio de clubly en vercel.app
      const vercelRegex = /^https:\/\/clubly-[a-z0-9-]+-julens-projects-2e33d71b\.vercel\.app$/;
      if (!origin || allowedOrigins.includes(origin) || vercelRegex.test(origin)) {
        callback(null, true);
      } else {
        Logger.warn(`CORS blocked for origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: '*',
    preflightContinue: false,
    optionsSuccessStatus: 204
  });

  app.use(cookieParser());
  app.use('/pagos/webhook', raw({ type: '*/*' }));
  app.use(json());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

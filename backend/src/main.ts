import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { json, raw } from 'express';
import { ValidationPipe, Logger } from '@nestjs/common';

async function bootstrap() {
  // Desactiva el bodyParser global de NestJS
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  // Middleware RAW solo para Stripe Webhook
  app.use('/pagos/webhook', raw({ type: '*/*' }));

  // Body parser JSON para el resto de rutas
  app.use((req, res, next) => {
    if (req.originalUrl === '/pagos/webhook') return next();
    json()(req, res, next);
  });

  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:5173',
        'https://clubly-dun.vercel.app', // Dominio principal de producción
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
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin'
    ],
    preflightContinue: false,
    optionsSuccessStatus: 204
  });

  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import cors from 'cors';
import express from 'express';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

let cachedApp: INestApplication;

async function createApp() {
  if (cachedApp) {
    return cachedApp;
  }

  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());
  app.use(
    cors({
      origin: configService.get('CORS_ORIGIN', '*'),
      credentials: true,
    }),
  );

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.init();
  cachedApp = app;

  return app;
}

export default async function handler(req: Request, res: Response) {
  const app = await createApp();
  const expressApp = app.getHttpAdapter().getInstance();
  return expressApp(req, res);
}


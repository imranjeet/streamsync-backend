import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import cors from 'cors';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { WorkerService } from './worker/worker.service';

async function bootstrap() {
  let app: INestApplication;
  try {
    app = await NestFactory.create(AppModule);
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

  const port = configService.get('PORT', 3000);
  const host = configService.get('HOST', '0.0.0.0');
  await app.listen(port, host);
  console.log(`Application is running on: http://${host}:${port}`);
  console.log(`Health check available at: http://${host}:${port}/health`);

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    try {
      const workerService = app.get(WorkerService);
      if (workerService && typeof workerService.stop === 'function') {
        workerService.stop();
      }
    } catch (error) {
      console.error('Error stopping worker service:', error);
    }
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    try {
      const workerService = app.get(WorkerService);
      if (workerService && typeof workerService.stop === 'function') {
        workerService.stop();
      }
    } catch (error) {
      console.error('Error stopping worker service:', error);
    }
    await app.close();
    process.exit(0);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('Bootstrap error:', error);
  process.exit(1);
});


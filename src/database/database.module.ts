import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { Video } from './entities/video.entity';
import { Progress } from './entities/progress.entity';
import { Favorite } from './entities/favorite.entity';
import { Notification } from './entities/notification.entity';
import { FcmToken } from './entities/fcm-token.entity';
import { NotificationJob } from './entities/notification-job.entity';
import { PendingAction } from './entities/pending-action.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get('NODE_ENV', 'development');
        const isProduction = nodeEnv === 'production' || process.env.VERCEL;
        
        // Support DATABASE_URL (Neon, Vercel Postgres, etc.) or individual parameters
        const databaseUrl = configService.get('DATABASE_URL') || 
                           configService.get('POSTGRES_URL') ||
                           configService.get('POSTGRES_PRISMA_URL');
        
        if (databaseUrl) {
          console.log(`[Database] Using DATABASE_URL (${databaseUrl.substring(0, 30)}...)`);
          // Use URL-based connection (for Neon, Vercel Postgres, etc.)
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [
              User,
              Video,
              Progress,
              Favorite,
              Notification,
              FcmToken,
              NotificationJob,
              PendingAction,
            ],
            synchronize: nodeEnv === 'development',
            logging: nodeEnv === 'development',
            ssl: databaseUrl.includes('sslmode=require') || databaseUrl.includes('ssl=true') 
              ? { rejectUnauthorized: false } 
              : false,
          };
        }
        
        // In production/serverless, require DATABASE_URL
        if (isProduction) {
          const error = new Error(
            'DATABASE_URL environment variable is required in production. ' +
            'Please set DATABASE_URL in Vercel Dashboard → Settings → Environment Variables. ' +
            'Expected format: postgresql://user:password@host:port/database?sslmode=require'
          );
          console.error('[Database]', error.message);
          throw error;
        }
        
        // Fallback to individual parameters (development only)
        const host = configService.get('DB_HOST') || configService.get('PGHOST') || configService.get('POSTGRES_HOST') || 'localhost';
        const port = parseInt(configService.get('DB_PORT') || configService.get('PGPORT') || '5432', 10);
        const username = configService.get('DB_USERNAME') || configService.get('PGUSER') || configService.get('POSTGRES_USER') || 'postgres';
        const database = configService.get('DB_DATABASE') || configService.get('PGDATABASE') || configService.get('POSTGRES_DATABASE') || 'streamsync_lite';
        
        console.log(`[Database] Using individual parameters: ${host}:${port}/${database}`);
        
        return {
          type: 'postgres',
          host,
          port,
          username,
          password: configService.get('DB_PASSWORD') || configService.get('PGPASSWORD') || configService.get('POSTGRES_PASSWORD') || 'postgres',
          database,
          entities: [
            User,
            Video,
            Progress,
            Favorite,
            Notification,
            FcmToken,
            NotificationJob,
            PendingAction,
          ],
          synchronize: nodeEnv === 'development',
          logging: nodeEnv === 'development',
          ssl: configService.get('DB_SSL') === 'true' || configService.get('POSTGRES_SSL') === 'true'
            ? { rejectUnauthorized: false }
            : false,
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      User,
      Video,
      Progress,
      Favorite,
      Notification,
      FcmToken,
      NotificationJob,
      PendingAction,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}


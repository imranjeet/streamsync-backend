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
        // Support DATABASE_URL (Neon, Vercel Postgres, etc.) or individual parameters
        const databaseUrl = configService.get('DATABASE_URL') || 
                           configService.get('POSTGRES_URL') ||
                           configService.get('POSTGRES_PRISMA_URL');
        
        if (databaseUrl) {
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
            synchronize: configService.get('NODE_ENV') === 'development',
            logging: configService.get('NODE_ENV') === 'development',
            ssl: databaseUrl.includes('sslmode=require') || databaseUrl.includes('ssl=true') 
              ? { rejectUnauthorized: false } 
              : false,
          };
        }
        
        // Fallback to individual parameters
        return {
          type: 'postgres',
          host: configService.get('DB_HOST') || configService.get('PGHOST') || configService.get('POSTGRES_HOST') || 'localhost',
          port: parseInt(configService.get('DB_PORT') || configService.get('PGPORT') || '5432', 10),
          username: configService.get('DB_USERNAME') || configService.get('PGUSER') || configService.get('POSTGRES_USER') || 'postgres',
          password: configService.get('DB_PASSWORD') || configService.get('PGPASSWORD') || configService.get('POSTGRES_PASSWORD') || 'postgres',
          database: configService.get('DB_DATABASE') || configService.get('PGDATABASE') || configService.get('POSTGRES_DATABASE') || 'streamsync_lite',
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
          synchronize: configService.get('NODE_ENV') === 'development',
          logging: configService.get('NODE_ENV') === 'development',
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


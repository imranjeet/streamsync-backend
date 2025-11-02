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
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'streamsync_lite'),
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
      }),
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


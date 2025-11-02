import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from '../database/entities/notification.entity';
import { FcmToken } from '../database/entities/fcm-token.entity';
import { NotificationJob } from '../database/entities/notification-job.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, FcmToken, NotificationJob])],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}


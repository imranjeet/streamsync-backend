import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VideosModule } from './videos/videos.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FavoritesModule } from './favorites/favorites.module';
import { WorkerService } from './worker/worker.service';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    VideosModule,
    NotificationsModule,
    FavoritesModule,
  ],
  controllers: [AppController],
  providers: [WorkerService],
})
export class AppModule {
  // WorkerService will start automatically via OnModuleInit
  // No need to call start() manually here
}


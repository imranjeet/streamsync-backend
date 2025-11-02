import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideosService } from './videos.service';
import { VideosController } from './videos.controller';
import { Video } from '../database/entities/video.entity';
import { Progress } from '../database/entities/progress.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Video, Progress])],
  controllers: [VideosController],
  providers: [VideosService],
  exports: [VideosService],
})
export class VideosModule {}


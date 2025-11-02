import { Controller, Get, Param, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { VideosService } from './videos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '../common/dto/api-response.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Progress } from '../database/entities/progress.entity';

@Controller('videos')
@UseGuards(JwtAuthGuard)
export class VideosController {
  constructor(
    private videosService: VideosService,
    @InjectRepository(Progress)
    private progressRepository: Repository<Progress>,
  ) {}

  @Get('latest')
  async getLatest(@Query('channelId') channelId?: string) {
    const videos = await this.videosService.getLatestVideos(channelId);
    return ApiResponse.success(videos);
  }

  @Get(':videoId')
  async getVideo(@Param('videoId') videoId: string) {
    const video = await this.videosService.getVideoById(videoId);
    if (!video) {
      return ApiResponse.error('Video not found', 404);
    }
    return ApiResponse.success(video);
  }

  @Post('progress')
  async saveProgress(
    @Request() req: any,
    @Body() body: { videoId: string; positionSeconds: number; completedPercent?: number; updatedAt?: string },
  ) {
    const userId = req.user.userId;
    
    let progress = await this.progressRepository.findOne({
      where: { userId, videoId: body.videoId },
    });

    const video = await this.videosService.getVideoById(body.videoId);
    const totalDuration = video?.durationSeconds || 1;
    const calculatedPercent = (body.positionSeconds / totalDuration) * 100;

    if (progress) {
      // Last-Write-Wins conflict resolution by updatedAt
      const serverUpdatedAt = progress.updatedAt;
      const clientUpdatedAt = body.updatedAt ? new Date(body.updatedAt) : new Date();
      
      if (clientUpdatedAt > serverUpdatedAt) {
        progress.positionSeconds = body.positionSeconds;
        progress.completedPercent = body.completedPercent ?? calculatedPercent;
        progress.synced = true;
        progress.updatedAt = clientUpdatedAt;
      }
    } else {
      progress = this.progressRepository.create({
        userId,
        videoId: body.videoId,
        positionSeconds: body.positionSeconds,
        completedPercent: body.completedPercent ?? calculatedPercent,
        synced: true,
        updatedAt: body.updatedAt ? new Date(body.updatedAt) : new Date(),
      });
    }

    await this.progressRepository.save(progress);
    
    // Return canonical state for client reconciliation (includes updatedAt for sync)
    return ApiResponse.success({
      ...progress,
      updatedAt: progress.updatedAt.toISOString(),
    }, 'Progress saved');
  }
}


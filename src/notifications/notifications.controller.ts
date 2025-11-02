import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '../common/dto/api-response.dto';
import { RateLimiterGuard } from '../common/guards/rate-limiter.guard';
import { SendTestPushDto } from './dto/send-test-push.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @Request() req: any,
    @Query('limit') limit?: number,
    @Query('since') since?: string,
  ) {
    const userId = req.user.userId;
    const limitNum = limit ? parseInt(limit.toString(), 10) : 50;
    const sinceDate = since ? new Date(since) : undefined;
    
    const notifications = await this.notificationsService.getNotifications(
      userId,
      limitNum,
      sinceDate,
    );
    const unreadCount = await this.notificationsService.getUnreadCount(userId);
    
    return ApiResponse.success({
      notifications,
      unreadCount,
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createNotification(@Request() req: any, @Body() body: { userId: string; title: string; body: string; linkedContent?: string }) {
    // Admin endpoint: allows creating notifications for any user
    // In production, add role-based guard here
    const notification = await this.notificationsService.createNotification(
      body.userId,
      body.title,
      body.body,
      body.linkedContent,
    );
    return ApiResponse.success(notification, 'Notification created');
  }

  @Post('send-test')
  @UseGuards(RateLimiterGuard)
  @HttpCode(HttpStatus.CREATED)
  async sendTestPush(@Request() req: any, @Body() dto: SendTestPushDto) {
    const notification = await this.notificationsService.sendTestPush(
      req.user.userId,
      dto.title,
      dto.body,
      dto.idempotencyKey,
    );
    return ApiResponse.success(notification, 'Test notification sent');
  }

  @Post('mark-read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Request() req: any, @Body() body: { notificationId: string }) {
    await this.notificationsService.markAsRead(req.user.userId, body.notificationId);
    return ApiResponse.success(null, 'Notification marked as read');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteNotification(@Request() req: any, @Param('id') id: string) {
    await this.notificationsService.deleteNotification(req.user.userId, id);
    return ApiResponse.success(null, 'Notification deleted');
  }
}


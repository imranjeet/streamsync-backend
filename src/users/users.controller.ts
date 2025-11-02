import { Controller, Post, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '../common/dto/api-response.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private usersService: UsersService,
    private notificationsService: NotificationsService,
  ) {}

  @Post(':id/fcmToken')
  async registerFcmToken(
    @Param('id') id: string,
    @Body() body: { token: string; platform: string },
    @Request() req: any,
  ) {
    // Verify user owns this ID
    if (req.user.userId !== id) {
      return ApiResponse.error('Unauthorized', 403);
    }

    await this.notificationsService.registerFcmToken(id, body.token, body.platform);
    return ApiResponse.success(null, 'FCM token registered');
  }

  @Delete(':id/fcmToken')
  async deleteFcmToken(
    @Param('id') id: string,
    @Body() body: { token: string },
    @Request() req: any,
  ) {
    // Verify user owns this ID
    if (req.user.userId !== id) {
      return ApiResponse.error('Unauthorized', 403);
    }

    await this.notificationsService.deleteFcmToken(id, body.token);
    return ApiResponse.success(null, 'FCM token deleted');
  }
}


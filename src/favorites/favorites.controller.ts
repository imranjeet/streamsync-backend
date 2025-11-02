import { Controller, Get, Post, Delete, Body, UseGuards, Request } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '../common/dto/api-response.dto';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private favoritesService: FavoritesService) {}

  @Get()
  async getFavorites(@Request() req: any) {
    const favorites = await this.favoritesService.getFavorites(req.user.userId);
    return ApiResponse.success(favorites);
  }

  @Post('toggle')
  async toggleFavorite(@Request() req: any, @Body() body: { videoId: string }) {
    await this.favoritesService.toggleFavorite(req.user.userId, body.videoId);
    return ApiResponse.success(null, 'Favorite toggled');
  }
}


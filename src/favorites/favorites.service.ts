import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from '../database/entities/favorite.entity';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private favoritesRepository: Repository<Favorite>,
  ) {}

  async getFavorites(userId: string) {
    return this.favoritesRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async toggleFavorite(userId: string, videoId: string) {
    const existing = await this.favoritesRepository.findOne({
      where: { userId, videoId },
    });

    if (existing) {
      await this.favoritesRepository.remove(existing);
      return { action: 'removed', synced: true };
    } else {
      const favorite = this.favoritesRepository.create({
        userId,
        videoId,
        synced: true,
        updatedAt: new Date(),
      });
      await this.favoritesRepository.save(favorite);
      return { action: 'added', synced: true, favorite };
    }
  }
}


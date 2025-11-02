import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { Video } from '../database/entities/video.entity';

@Injectable()
export class VideosService {
  private youtubeApiKey: string;
  private cache: Map<string, { videos: Video[]; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  constructor(
    @InjectRepository(Video)
    private videosRepository: Repository<Video>,
    private configService: ConfigService,
  ) {
    this.youtubeApiKey = this.configService.get('YOUTUBE_API_KEY', '');
  }

  async getLatestVideos(channelId?: string): Promise<Video[]> {
    const cacheKey = channelId || 'default';
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.videos;
    }

    // Default channel ID - you can configure this
    const defaultChannelId = channelId || this.configService.get('YOUTUBE_CHANNEL_ID', 'UC_x5XG1OV2P6uZZ5FSM9Ttw'); // Google Developers channel as default

    try {
      // First, get channel uploads playlist
      const channelResponse = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
        params: {
          part: 'contentDetails',
          id: defaultChannelId,
          key: this.youtubeApiKey,
        },
      });

      const uploadsPlaylistId =
        channelResponse.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

      if (!uploadsPlaylistId) {
        throw new Error('Could not find uploads playlist');
      }

      // Get channel info for channel name
      const channelInfoResponse = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
        params: {
          part: 'snippet',
          id: defaultChannelId,
          key: this.youtubeApiKey,
        },
      });
      const channelName = channelInfoResponse.data.items?.[0]?.snippet?.title || 'Unknown Channel';

      // Get latest videos from uploads playlist
      const playlistResponse = await axios.get(
        'https://www.googleapis.com/youtube/v3/playlistItems',
        {
          params: {
            part: 'snippet,contentDetails',
            playlistId: uploadsPlaylistId,
            maxResults: 10,
            key: this.youtubeApiKey,
          },
        },
      );

      const videoIds = playlistResponse.data.items
        .map((item: any) => item.contentDetails.videoId)
        .join(',');

      // Get video details
      const videosResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: {
          part: 'snippet,contentDetails',
          id: videoIds,
          key: this.youtubeApiKey,
        },
      });

      const videos: Video[] = await Promise.all(
        videosResponse.data.items.map(async (item: any) => {
          const duration = this.parseDuration(item.contentDetails.duration);
          
          // Check if video exists in DB
          let video = await this.videosRepository.findOne({
            where: { videoId: item.id },
          });

          if (!video) {
            video = this.videosRepository.create({
              videoId: item.id,
              title: item.snippet.title,
              description: item.snippet.description,
              thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
              durationSeconds: duration,
              publishedAt: new Date(item.snippet.publishedAt),
              channelId: item.snippet.channelId,
              channelName: channelName,
            });
            video = await this.videosRepository.save(video);
          } else {
            // Update if needed
            video.title = item.snippet.title;
            video.description = item.snippet.description;
            video.thumbnailUrl = item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url;
            video.durationSeconds = duration;
            video.publishedAt = new Date(item.snippet.publishedAt);
            video.channelName = channelName;
            await this.videosRepository.save(video);
          }

          return video;
        }),
      );

      this.cache.set(cacheKey, { videos, timestamp: Date.now() });
      return videos;
    } catch (error) {
      console.error('Error fetching videos from YouTube:', error);
      // Return cached data if available, even if expired
      if (cached) {
        return cached.videos;
      }
      throw new Error('Failed to fetch videos from YouTube');
    }
  }

  async getVideoById(videoId: string): Promise<Video | null> {
    return this.videosRepository.findOne({ where: { videoId } });
  }

  private parseDuration(duration: string): number {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);

    return hours * 3600 + minutes * 60 + seconds;
  }
}


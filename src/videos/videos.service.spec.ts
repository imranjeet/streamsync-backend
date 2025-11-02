import { Test, TestingModule } from '@nestjs/testing';
import { VideosService } from './videos.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Video } from '../database/entities/video.entity';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';

describe('VideosService', () => {
  let service: VideosService;
  let repository: Repository<Video>;
  let configService: ConfigService;

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      if (key === 'YOUTUBE_API_KEY') return 'test-api-key';
      if (key === 'YOUTUBE_CHANNEL_ID') return 'test-channel-id';
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideosService,
        {
          provide: getRepositoryToken(Video),
          useValue: mockRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<VideosService>(VideosService);
    repository = module.get<Repository<Video>>(getRepositoryToken(Video));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get video by id', async () => {
    const mockVideo = {
      videoId: 'test-video-id',
      title: 'Test Video',
      description: 'Test Description',
    };

    mockRepository.findOne.mockResolvedValue(mockVideo);

    const result = await service.getVideoById('test-video-id');

    expect(result).toEqual(mockVideo);
    expect(mockRepository.findOne).toHaveBeenCalledWith({
      where: { videoId: 'test-video-id' },
    });
  });
});


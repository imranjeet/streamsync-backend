import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Simple in-memory rate limiter - user-based for test push endpoint
const requestCounts = new Map<string, { count: number; resetTime: number }>();

@Injectable()
export class RateLimiterGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Use user ID for rate limiting (better than IP for authenticated endpoints)
    const userId = request.user?.userId || request.ip || 'unknown';
    const now = Date.now();
    const windowMs = this.configService.get('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000); // 15 minutes default
    const maxRequests = this.configService.get('RATE_LIMIT_MAX_REQUESTS', 5);

    const record = requestCounts.get(userId);

    if (!record || now > record.resetTime) {
      requestCounts.set(userId, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (record.count >= maxRequests) {
      throw new HttpException(
        {
          status: 'error',
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    record.count += 1;
    return true;
  }
}


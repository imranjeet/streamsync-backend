import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class WorkerService implements OnModuleInit, OnModuleDestroy {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(private notificationsService: NotificationsService) {}

  onModuleInit() {
    // Skip starting worker in serverless environments (Vercel)
    // Worker will be handled by Vercel Cron Jobs instead
    if (process.env.VERCEL || process.env.SERVERLESS) {
      console.log('Skipping worker service in serverless environment. Use cron jobs instead.');
      return;
    }
    
    // Add small delay to ensure database is connected
    setTimeout(() => {
      this.start();
    }, 2000);
  }

  onModuleDestroy() {
    this.stop();
  }

  start() {
    if (this.isRunning) {
      console.warn('Worker is already running');
      return;
    }
    
    this.isRunning = true;
    console.log('Starting notification worker service...');
    
    // Process notification jobs every 5 seconds
    this.intervalId = setInterval(async () => {
      try {
        await this.notificationsService.processNotificationJobs();
      } catch (error) {
        console.error('Worker error:', error);
        // Don't stop worker on error, just log it
      }
    }, 5000);
  }

  stop() {
    if (this.intervalId) {
      console.log('Stopping notification worker service...');
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
    }
  }
}


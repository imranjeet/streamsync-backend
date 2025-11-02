// Vercel Cron Job endpoint for processing notification jobs
// This replaces the continuous WorkerService interval for serverless deployment
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Request, Response } from 'express';
import { AppModule } from '../src/app.module';
import { NotificationsService } from '../src/notifications/notifications.service';

let cachedApp: any;

async function createApp() {
  if (cachedApp) {
    return cachedApp;
  }

  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
  await app.init();
  cachedApp = app;
  return app;
}

export default async function handler(req: Request, res: Response) {
  try {
    // Vercel Cron automatically adds Authorization header
    // Optional: Add CRON_SECRET env var in Vercel dashboard for extra security
    if (process.env.CRON_SECRET) {
      const authHeader = req.headers['authorization'];
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    const app = await createApp();
    const notificationsService = app.get(NotificationsService);
    
    console.log('Processing notification jobs via Vercel Cron...');
    await notificationsService.processNotificationJobs();
    
    return res.status(200).json({ 
      success: true, 
      message: 'Notification jobs processed',
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Worker cron error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}


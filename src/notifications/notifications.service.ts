import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { Notification } from '../database/entities/notification.entity';
import { FcmToken } from '../database/entities/fcm-token.entity';
import { NotificationJob, JobStatus } from '../database/entities/notification-job.entity';

@Injectable()
export class NotificationsService {
  private firebaseApp: admin.app.App | null = null;

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(FcmToken)
    private fcmTokenRepository: Repository<FcmToken>,
    @InjectRepository(NotificationJob)
    private jobRepository: Repository<NotificationJob>,
    private configService: ConfigService,
  ) {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      if (!admin.apps.length) {
        // Try loading from serviceAccountKey.json file (for local development)
        const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
        
        if (fs.existsSync(serviceAccountPath)) {
          // Use JSON file if it exists (local development)
          const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
          console.log('[Firebase] Initializing from serviceAccountKey.json');
          this.firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
          return;
        }

        // Fallback to environment variables (for Vercel/production)
        const projectId = this.configService.get('FIREBASE_PROJECT_ID');
        const privateKey = this.configService.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');
        const clientEmail = this.configService.get('FIREBASE_CLIENT_EMAIL');

        if (projectId && privateKey && clientEmail) {
          console.log('[Firebase] Initializing from environment variables');
          this.firebaseApp = admin.initializeApp({
            credential: admin.credential.cert({
              projectId,
              privateKey,
              clientEmail,
            }),
          });
        } else {
          console.warn('[Firebase] Firebase credentials not found. Push notifications will be disabled.');
        }
      } else {
        this.firebaseApp = admin.app();
      }
    } catch (error) {
      console.error('[Firebase] Initialization error:', error);
    }
  }

  async registerFcmToken(userId: string, token: string, platform: string) {
    let fcmToken = await this.fcmTokenRepository.findOne({ where: { token } });
    
    if (fcmToken) {
      fcmToken.userId = userId;
      fcmToken.platform = platform;
    } else {
      fcmToken = this.fcmTokenRepository.create({
        userId,
        token,
        platform,
      });
    }

    return this.fcmTokenRepository.save(fcmToken);
  }

  async getNotifications(userId: string, limit: number = 50, since?: Date) {
    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .andWhere('notification.isDeleted = false')
      .orderBy('notification.createdAt', 'DESC')
      .limit(limit);

    if (since) {
      queryBuilder.andWhere('notification.createdAt >= :since', { since });
    }

    return queryBuilder.getMany();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, isRead: false, isDeleted: false },
    });
  }

  async createNotification(userId: string, title: string, body: string, linkedContent?: string) {
    const notification = this.notificationRepository.create({
      userId,
      title,
      body,
      linkedContent: linkedContent ?? null,
      metadata: { type: 'system' },
      receivedAt: new Date(),
      sent: false,
    });

    const savedNotification = await this.notificationRepository.save(notification);
    
    // Queue push job
    await this.queuePushNotification(savedNotification.id, userId);

    // Attempt immediate processing to reduce latency in serverless environments
    try {
      await this.processNotificationJobs();
    } catch (e) {
      console.warn('Immediate job processing failed (will be handled by worker/cron):', e);
    }

    return savedNotification;
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.isRead = true;
    return this.notificationRepository.save(notification);
  }

  async deleteNotification(userId: string, notificationId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.isDeleted = true;
    return this.notificationRepository.save(notification);
  }

  private idempotencyCache = new Map<string, { notificationId: string; timestamp: number }>();

  async sendTestPush(
    userId: string,
    title: string,
    body: string,
    idempotencyKey?: string,
    mode: string = 'self', // mode='self' for test push endpoint
  ) {
    // Verify mode is 'self' for test push (enforces self-only notification)
    if (mode !== 'self') {
      throw new Error('Test push endpoint only supports mode=self');
    }
    // Check idempotency
    if (idempotencyKey) {
      const cached = this.idempotencyCache.get(idempotencyKey);
      if (cached && Date.now() - cached.timestamp < 60000) {
        // Return cached notification if within 1 minute
        const notification = await this.notificationRepository.findOne({
          where: { id: cached.notificationId },
        });
        if (notification) {
          return notification;
        }
      }
    }

    const notification = this.notificationRepository.create({
      userId,
      title,
      body,
      linkedContent: null as string | null,
      metadata: { type: 'test', idempotencyKey },
      receivedAt: new Date(),
      sent: false,
    });

    const savedNotification = await this.notificationRepository.save(notification);

    // Cache for idempotency
    if (idempotencyKey) {
      this.idempotencyCache.set(idempotencyKey, {
        notificationId: savedNotification.id,
        timestamp: Date.now(),
      });
      // Clean old entries (older than 5 minutes)
      for (const [key, value] of this.idempotencyCache.entries()) {
        if (Date.now() - value.timestamp > 300000) {
          this.idempotencyCache.delete(key);
        }
      }
    }

    // Queue push job
    await this.queuePushNotification(savedNotification.id, userId);

    // Attempt immediate processing for test pushes to deliver in near real-time
    try {
      await this.processNotificationJobs();
    } catch (e) {
      console.warn('Immediate job processing failed (will be handled by worker/cron):', e);
    }

    return savedNotification;
  }

  async deleteFcmToken(userId: string, token: string) {
    const fcmToken = await this.fcmTokenRepository.findOne({
      where: { userId, token },
    });

    if (!fcmToken) {
      throw new Error('FCM token not found');
    }

    await this.fcmTokenRepository.remove(fcmToken);
    return { success: true };
  }

  private async queuePushNotification(notificationId: string, userId: string) {
    const fcmTokens = await this.fcmTokenRepository.find({
      where: { userId },
    });

    for (const token of fcmTokens) {
      const job = this.jobRepository.create({
        notificationId,
        fcmTokenId: token.id,
        status: JobStatus.PENDING,
      });
      await this.jobRepository.save(job);
    }
  }

  async processNotificationJobs() {
    // Atomically select and mark jobs as processing using query builder
    // Only select jobs that are not in exponential backoff period
    const now = new Date();
    const jobs = await this.jobRepository
      .createQueryBuilder('job')
      .where('job.status = :status', { status: JobStatus.PENDING })
      .andWhere('(job.processingAt IS NULL OR job.processingAt <= :now)', { now })
      .orderBy('job.createdAt', 'ASC')
      .limit(10)
      .getMany();

    for (const job of jobs) {
      // Atomically update status to PROCESSING
      const updateResult = await this.jobRepository
        .createQueryBuilder()
        .update(NotificationJob)
        .set({
          status: JobStatus.PROCESSING,
          processingAt: new Date(),
        })
        .where('id = :id', { id: job.id })
        .andWhere('status = :status', { status: JobStatus.PENDING })
        .execute();

      // If update affected 0 rows, job was already processed by another worker
      if (updateResult.affected === 0) {
        continue;
      }

      try {
        const fcmToken = await this.fcmTokenRepository.findOne({
          where: { id: job.fcmTokenId },
        });
        const notification = await this.notificationRepository.findOne({
          where: { id: job.notificationId },
        });

        if (fcmToken && notification && this.firebaseApp) {
          const messageId = await admin.messaging().send({
            token: fcmToken.token,
            notification: {
              title: notification.title,
              body: notification.body,
            },
            android: {
              priority: 'high',
              notification: {
                channelId: 'default',
                sound: 'default',
              },
            },
            apns: {
              headers: {
                'apns-priority': '10',
              },
              payload: {
                aps: {
                  sound: 'default',
                  'content-available': 1,
                },
              },
            },
            data: {
              notificationId: notification.id,
              linkedContent: notification.linkedContent || '',
              userId: notification.userId,
              type: (notification.metadata as any)?.type || 'system',
            },
          });

          // Success - mark job as completed and record messageId
          job.status = JobStatus.COMPLETED;
          job.messageId = messageId; // Record messageId as per assignment requirement
          job.processingAt = null;
          job.errorMessage = null;
          notification.sent = true;
          
          await this.jobRepository.save(job);
          await this.notificationRepository.save(notification);
          
          console.log(`Notification sent successfully. MessageId: ${messageId}, JobId: ${job.id}`);
        } else {
          throw new Error('Missing required data');
        }
      } catch (error) {
        console.error('Error sending push:', error);
        job.retries += 1;
        job.errorMessage = error instanceof Error ? error.message : 'Unknown error';
        job.processingAt = null;

        const maxRetries = 5;
        if (job.retries >= maxRetries) {
          // Move to Dead Letter Queue
          job.status = JobStatus.DLQ;
          console.error(`Job ${job.id} moved to DLQ after ${job.retries} retries`);
        } else {
          // Exponential backoff: wait 2^retries seconds before retry
          const backoffSeconds = Math.pow(2, job.retries);
          job.status = JobStatus.PENDING;
          
          // Set processingAt to a future time for exponential backoff
          const nextRetryTime = new Date();
          nextRetryTime.setSeconds(nextRetryTime.getSeconds() + backoffSeconds);
          job.processingAt = nextRetryTime;
          
          console.log(`Job ${job.id} will retry in ${backoffSeconds} seconds (retry ${job.retries}/${maxRetries})`);
      }

      await this.jobRepository.save(job);
      }
    }
  }
}


import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DLQ = 'dlq', // Dead Letter Queue
}

@Entity('notification_jobs')
export class NotificationJob {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'notification_id', type: 'varchar' })
  notificationId!: string;

  @Column({ name: 'fcm_token_id', type: 'varchar' })
  fcmTokenId!: string;

  @Column({
    type: 'enum',
    enum: JobStatus,
    default: JobStatus.PENDING,
  })
  status!: JobStatus;

  @Column({ type: 'integer', default: 0 })
  retries!: number;

  @Column({ name: 'error_message', nullable: true, type: 'text' })
  errorMessage!: string | null; // Note: Assignment mentions 'last_error', but 'error_message' is equivalent and more descriptive

  @Column({ name: 'message_id', nullable: true, type: 'varchar', length: 255 })
  messageId!: string | null; // FCM message ID for tracking sent notifications

  @Column({ name: 'processing_at', nullable: true, type: 'timestamp' })
  processingAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

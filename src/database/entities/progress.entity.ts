import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Video } from './video.entity';

@Entity('progress')
@Unique(['userId', 'videoId'])
export class Progress {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'varchar' })
  userId!: string;

  @Column({ name: 'video_id', type: 'varchar' })
  videoId!: string;

  @Column({ name: 'position_seconds', type: 'integer', default: 0 })
  positionSeconds!: number;

  @Column({ name: 'completed_percent', type: 'decimal', precision: 5, scale: 2, default: 0 })
  completedPercent!: number;

  @Column({ default: false })
  synced!: boolean;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.progress)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Video, (video) => video.progress)
  @JoinColumn({ name: 'video_id' })
  video!: Video;
}

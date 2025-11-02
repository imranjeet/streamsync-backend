import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Progress } from './progress.entity';
import { Favorite } from './favorite.entity';

@Entity('videos')
export class Video {
  @PrimaryColumn({ name: 'video_id', type: 'varchar' })
  videoId!: string;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'thumbnail_url', type: 'varchar' })
  thumbnailUrl!: string;

  @Column({ name: 'duration_seconds', type: 'integer', nullable: true })
  durationSeconds!: number | null;

  @Column({ name: 'published_at', type: 'timestamp', nullable: true })
  publishedAt!: Date | null;

  @Column({ name: 'channel_id', type: 'varchar', nullable: true })
  channelId!: string | null;

  @Column({ name: 'channel_name', type: 'varchar', nullable: true })
  channelName!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => Progress, (progress) => progress.video)
  progress!: Progress[];

  @OneToMany(() => Favorite, (favorite) => favorite.video)
  favorites!: Favorite[];
}

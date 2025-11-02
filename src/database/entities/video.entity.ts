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
  @PrimaryColumn({ name: 'video_id' })
  videoId!: string;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'thumbnail_url' })
  thumbnailUrl!: string;

  @Column({ name: 'duration_seconds', nullable: true })
  durationSeconds!: number | null;

  @Column({ name: 'published_at', nullable: true })
  publishedAt!: Date | null;

  @Column({ name: 'channel_id', nullable: true })
  channelId!: string | null;

  @Column({ name: 'channel_name', nullable: true })
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

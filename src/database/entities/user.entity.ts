import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Progress } from './progress.entity';
import { Favorite } from './favorite.entity';
import { Notification } from './notification.entity';
import { FcmToken } from './fcm-token.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  name!: string;

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Column({ default: 'user' })
  role!: string; // 'user' | 'admin'

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => Progress, (progress) => progress.user)
  progress!: Progress[];

  @OneToMany(() => Favorite, (favorite) => favorite.user)
  favorites!: Favorite[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications!: Notification[];

  @OneToMany(() => FcmToken, (fcmToken) => fcmToken.user)
  fcmTokens!: FcmToken[];
}


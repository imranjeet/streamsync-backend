import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum ActionType {
  PROGRESS_UPDATE = 'progress_update',
  FAVORITE_TOGGLE = 'favorite_toggle',
  NOTIFICATION_DELETE = 'notification_delete',
}

@Entity('pending_actions')
export class PendingAction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'varchar' })
  userId!: string;

  @Column({
    type: 'enum',
    enum: ActionType,
  })
  actionType!: ActionType;

  @Column({ type: 'jsonb' })
  payload!: Record<string, any>;

  @Column({ type: 'varchar', nullable: true })
  idempotencyKey!: string | null;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;
}

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '@app/user/user.entity';

export enum ApiKeyScope {
  TRANSACTIONS_READ = 'transactions:read',
  TRANSACTIONS_WRITE = 'transactions:write',
}

@Entity('api_keys')
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 16 })
  prefix: string;

  @Column({ unique: true, length: 64 })
  keyHash: string;

  @Column({ length: 120 })
  name: string;

  @Column({ type: 'simple-json' })
  scopes: ApiKeyScope[];

  @Column({ type: 'timestamp', nullable: true })
  revokedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt: Date | null;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

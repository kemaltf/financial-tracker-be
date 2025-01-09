import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '@app/user/user.entity';
import { Wallet } from '../wallet.entity';

@Entity('wallet_logs')
export class WalletLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  action: string; // Contoh: "Insert", "Update"

  @Column('json', { nullable: true })
  oldValue: Record<string, any> | null; // Data sebelum perubahan (nullable untuk "Insert" action)

  @Column('json')
  newValue: Record<string, any>; // Data setelah perubahan

  @ManyToOne(() => User, { eager: true, onDelete: 'SET NULL', nullable: true })
  performed_by: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @ManyToOne(() => Wallet, (wallet) => wallet.logs, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  wallet: Wallet; // Wallet terkait log
}

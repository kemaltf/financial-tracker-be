import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';
import { Transaction } from '../transaction.entity';
import { User } from '@app/user/user.entity';

@Entity('transaction_logs')
export class TransactionLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Transaction, (transaction) => transaction.logs, {
    onDelete: 'CASCADE',
  })
  transaction: Transaction;

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
}

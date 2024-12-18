import { Account } from 'src/account/account.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('accounting_accounts')
export class AccountingAccount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => Account, (account) => account.id)
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @Column('decimal', { precision: 10, scale: 2 })
  balance: number;

  @Column({ nullable: true })
  account_number: string;
}

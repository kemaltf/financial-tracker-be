import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { SubAccount } from './sub-account.entity';

export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
  EQUITY = 'EQUITY',
}

export enum BalanceImpactSide {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

@Entity('account')
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: AccountType,
    unique: true,
  })
  type: AccountType; // Jenis akun seperti ASSET, LIABILITY, REVENUE, dll.

  @Column({
    type: 'enum',
    enum: BalanceImpactSide,
  })
  normalBalance: BalanceImpactSide; // Menentukan sisi mana yang mempengaruhi saldo (DEBIT atau CREDIT)

  @OneToMany(() => SubAccount, (subAccount) => subAccount.account)
  subAccounts: SubAccount[];
}

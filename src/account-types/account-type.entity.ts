import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export type AccountTypeTypes =
  | 'Assets'
  | 'Liabilities'
  | 'Revenue'
  | 'Expenses'
  | 'Equity';

@Entity('account_types') // Nama tabel di database
export class AccountType {
  @PrimaryGeneratedColumn()
  id: number; // ID akun jenis

  @Column({
    type: 'enum',
    enum: ['Assets', 'Liabilities', 'Revenue', 'Expenses', 'Equity'],
  })
  type: AccountTypeTypes; // Jenis tipe akun
}

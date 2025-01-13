import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
  EQUITY = 'EQUITY',
}

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string; // Kode akun, misalnya "101", "201", dll.

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string; // Nama akun, misalnya "Kas", "Pendapatan", "Biaya Operasional"

  @Column({
    type: 'enum',
    enum: AccountType,
  })
  type: AccountType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string; // Deskripsi opsional

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}

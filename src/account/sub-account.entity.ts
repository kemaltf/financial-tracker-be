import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Account } from './account.entity';
import { ColumnNumericTransformer } from '@app/common/transformer/column-numeric.transformer';

@Entity('sub_accounts')
export class SubAccount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string; // Kode akun, misalnya "101", "201", dll.

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string; // Nama akun, misalnya "Kas", "Pendapatan", "Biaya Operasional"

  @ManyToOne(() => Account, { nullable: false })
  @JoinColumn({ name: 'account_id' })
  account: Account; // Mengacu pada AccountType

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string; // Deskripsi opsional

  // Kolom untuk menyimpan saldo akun
  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    transformer: new ColumnNumericTransformer(),
  })
  balance: number; // Saldo akun

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}

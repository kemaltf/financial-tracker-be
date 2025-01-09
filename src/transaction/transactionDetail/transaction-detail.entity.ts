import { Transaction } from 'src/transaction/transaction.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('transaction_details')
export class TransactionDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Transaction, (transaction) => transaction.details)
  transaction: Transaction;

  // Informasi Produk saat Transaksi
  @Column()
  productName: string; // Nama produk saat transaksi

  @Column()
  productSku: string; // SKU produk saat transaksi

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: number; // Harga produk saat transaksi

  @Column('int')
  quantity: number; // Jumlah produk yang dibeli

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  discount: number; // Diskon yang diberikan (opsional)

  @Column('decimal', { precision: 10, scale: 2 })
  totalPrice: number; // Total setelah diskon

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

import { ColumnNumericTransformer } from '@app/common/transformer/column-numeric.transformer';
import { EventDiscount } from '@app/discount/event-discount.entity';
import { Transaction } from 'src/transaction/transaction.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('transaction_order')
export class TransactionOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Transaction, (transaction) => transaction.transactionOrder, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction;

  // Informasi Produk saat Transaksi
  @Column()
  productName: string; // Nama produk saat transaksi

  @Column()
  productSku: string; // SKU produk saat transaksi

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    transformer: new ColumnNumericTransformer(),
  })
  unitPrice: number; // Harga produk saat transaksi

  @Column('int')
  quantity: number; // Jumlah produk yang dibeli

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    transformer: new ColumnNumericTransformer(),
  })
  totalPrice: number; // Total setelah diskon

  @Column({ nullable: true })
  productImage?: string; // Gambar utama produk saat dibeli (opsional)

  @Column({ type: 'text', nullable: true })
  productCategories?: string; // Simpan kategori dalam JSON string (opsional)

  // 🔥 Relasi ke Event Discount (Opsional)
  @ManyToOne(() => EventDiscount, { nullable: true })
  @JoinColumn({ name: 'event_discount_id' })
  eventDiscount?: EventDiscount; // ID event diskon yang digunakan (jika ada)

  // 🔥 Copy Data Event Discount ke TransactionOrder (Agar Fix)
  @Column({ nullable: true })
  eventDiscountName?: string; // Nama event diskon saat transaksi

  @Column({
    type: 'enum',
    enum: ['PERCENTAGE', 'FIXED'],
    nullable: true,
  })
  eventDiscountType?: 'PERCENTAGE' | 'FIXED'; // Jenis diskon yang diberikan

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  eventDiscountValue?: number; // Nilai diskon saat transaksi

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  eventMaxDiscount?: number; // Maksimal potongan saat transaksi
}

import { ColumnNumericTransformer } from '@app/common/transformer/column-numeric.transformer';
import { Transaction } from 'src/transaction/transaction.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('shipping')
export class Shipping {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Transaction, (transaction) => transaction.shipping, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction;

  @Column()
  courierName: string; // Nama jasa pengiriman (JNE, J&T, dll)

  @Column()
  courierService: string; // Jenis layanan (Reguler, Express, dll)

  @Column()
  trackingNumber: string; // Nomor resi pengiriman

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
  })
  shippingCost: number; // Biaya pengiriman

  @Column({
    type: 'enum',
    enum: ['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
    default: 'PENDING',
  })
  shippingStatus: 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'; // Status pengiriman

  @Column({ type: 'timestamp', nullable: true })
  shippedAt?: Date; // Waktu barang dikirim

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt?: Date; // Waktu barang diterima pelanggan
}

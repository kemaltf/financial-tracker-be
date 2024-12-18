import { Product } from 'src/product/product.entity';
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

  @ManyToOne(() => Product, (product) => product.transactionDetails)
  product: Product;

  @Column('int')
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  discount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  totalPrice: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

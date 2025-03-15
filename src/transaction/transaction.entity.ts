import { FinancialParty } from '@app/financial-party/entity/financial-party.entity';
import { Store } from 'src/store/store.entity';
import { TransactionContact } from '@app/transaction/transaction-contact/transaction-contact.entity';
import { TransactionOrder } from '@app/transaction/transaction-order/transaction-order.entity';
import { TransactionType } from '@app/transaction/transactionType/transaction-type.entity';
import { User } from 'src/user/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { ColumnNumericTransformer } from '@app/common/transformer/column-numeric.transformer';
import { DebtsAndReceivables } from '@app/debt-receivable/debts-and-receivables.entity';
import { SubAccount } from '@app/account/sub-account.entity';
import { Shipping } from './shipping/shipping.entity';
import { Voucher } from '@app/discount/voucher/voucher.entity';
@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => TransactionType,
    (transactionType) => transactionType.transactions,
    { onDelete: 'CASCADE' }, // Menambahkan cascade delete
  )
  @JoinColumn({ name: 'transaction_type_id' })
  transactionType: TransactionType;

  // NOMINAL TRANSACTION SEBELUM ADA POTONGAN
  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
  })
  subTotal: number; // total transaksi sebelum dikasih biaya lain

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
  })
  shippingCost: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
  })
  discountShipping: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
  })
  serviceFee: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
  })
  insuranceFee: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
  })
  promoDiscount?: number; // Diskon yang diberikan dari promo

  // NOMINAL TRANSACTION YANG DIBAYARKAN
  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
  })
  amount: number; // total transakasi setelah semuanya dibayarkan

  // NOTES TRANSACTION / DESCRIPTION
  @Column({ type: 'text' })
  note: string;

  @ManyToOne(() => SubAccount, { eager: true, onDelete: 'CASCADE' }) // Menambahkan cascade delete
  @JoinColumn({ name: 'debitAccountId' }) // Kolom foreign key untuk akun debit
  debitAccount: SubAccount;

  @ManyToOne(() => SubAccount, { eager: true, onDelete: 'CASCADE' }) // Menambahkan cascade delete
  @JoinColumn({ name: 'creditAccountId' }) // Kolom foreign key untuk akun kredit
  creditAccount: SubAccount;

  // TRANSACTION CONTACT INFORMATION (WE WILL WRITE TRANSACTION ADDRESS SEPARATELY)
  @OneToOne(() => TransactionContact, (contact) => contact.transaction, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  }) // Menambahkan cascade delete
  transactionContact: TransactionContact;

  // IF TRANSACTION RELATED TO DEBT OR RECEIVABLE
  @ManyToOne(
    () => DebtsAndReceivables,
    (debtsAndReceivables) => debtsAndReceivables.transaction,
    // { onDelete: 'CASCADE' }, // Menambahkan cascade delete
  )
  @JoinColumn({ name: 'debs_and_receivables_id' })
  debtsAndReceivables: DebtsAndReceivables;

  // IF TRANSACTION RELATED TO PRODUCT
  @OneToMany(
    () => TransactionOrder,
    (transactionOrder) => transactionOrder.transaction,
  )
  transactionOrder: TransactionOrder[];

  // WHO CREATE THIS TRANSACTION
  @ManyToOne(() => User, (user) => user.Transactions, { onDelete: 'CASCADE' }) // Menambahkan cascade delete
  @JoinColumn({ name: 'user_id' })
  user: User;

  // IF TRANSACTION RELATED TO CUSTOMER
  @ManyToOne(() => FinancialParty, (customer) => customer.transactions, {
    nullable: true,
    // onDelete: 'CASCADE', // Menambahkan cascade delete
  })
  @JoinColumn({ name: 'customer_id' })
  customer: FinancialParty;

  // IF TRANSACTION RELATED TO STORE
  @ManyToOne(() => Store, (store) => store.transactions, {
    onDelete: 'CASCADE',
  }) // Menambahkan cascade delete
  store: Store;

  // Relasi ke Promo
  @ManyToOne(() => Voucher, (promo) => promo.transactions, { nullable: true })
  @JoinColumn({ name: 'promo_id' })
  promo?: Voucher; // ID promo yang digunakan (jika ada)

  // shipping
  @OneToOne(() => Shipping, (shipping) => shipping.transaction, {
    nullable: true,
  })
  @JoinColumn()
  shipping?: Shipping;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}

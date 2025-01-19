import { FinancialParty } from '@app/financial-party/entity/financial-party.entity';
import { Store } from 'src/store/store.entity';
import { TransactionContact } from '@app/transaction/transaction-contact/transaction-contact.entity';
import { TransactionProduct } from '@app/transaction/transactionProduct/transaction-product.entity';
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

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => TransactionType,
    (transactionType) => transactionType.transactions,
  )
  @JoinColumn({ name: 'transaction_type_id' })
  transactionType: TransactionType;

  // NOMINAL TRANSACTION
  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
  })
  amount: number;

  // NOTES TRANSACTION / DESCRIPTION
  @Column({ type: 'text' })
  note: string;

  @ManyToOne(() => SubAccount, { eager: true }) // Relasi ke entitas Account
  @JoinColumn({ name: 'debitAccountId' }) // Kolom foreign key untuk akun debit
  debitAccount: SubAccount;

  @ManyToOne(() => SubAccount, { eager: true }) // Relasi ke entitas Account
  @JoinColumn({ name: 'creditAccountId' }) // Kolom foreign key untuk akun kredit
  creditAccount: SubAccount;

  // TRANSACTION CONTACT INFORMATION (WE WILL WRITE TRANSACTION ADDRESS SEPARATELY)
  // FOR EXAMPLE: THE CUSTOMER WILL BUY SOMETHING, WE WILL WRITE THE CUSTOMER INFORMATION HERE
  // SO THE INFORMATION WILL BE STORED IN CONTACT TABLE AND WILL NOT UPDATE IF THE CUSTOMER INFORMATION IS UPDATED
  @OneToOne(() => TransactionContact, (contact) => contact.transaction)
  @JoinColumn({ name: 'transaction_contact_id' }) // Menambahkan JoinColumn untuk menghubungkan dengan kolom yang benar
  transactionContact: TransactionContact;

  // IF TRANSACTION RELATED TO DEBT OR RECEIVABLE
  @OneToMany(
    () => DebtsAndReceivables,
    (debtsAndReceivables) => debtsAndReceivables.transaction,
  )
  debtsAndReceivables: DebtsAndReceivables[];

  // IF TRANSACTION RELATED TO PRODUCT
  @OneToMany(
    () => TransactionProduct,
    (transactionProduct) => transactionProduct.transaction,
  )
  transactionProduct: TransactionProduct[];

  // WHO CREATE THIS TRANSACTION
  @ManyToOne(() => User, (user) => user.Transactions)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // IF TRANSACTION RELATED TO CUSTOMER
  @ManyToOne(() => FinancialParty, (customer) => customer.transactions, {
    nullable: true,
  })
  @JoinColumn({ name: 'customer_id' })
  customer: FinancialParty;

  // IF TRANSACTION RELATED TO STORE
  @ManyToOne(() => Store, (store) => store.transactions)
  store: Store;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}

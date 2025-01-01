import { Product } from 'src/product/entity/product.entity';
import { Transaction } from 'src/transaction/transaction.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity()
export class Store {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column()
  owner: string;

  @OneToMany(() => Product, (product) => product.store)
  products: Product[];

  @OneToMany(() => Transaction, (transaction) => transaction.store)
  transactions: Transaction[];
}

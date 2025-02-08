import { Category } from '@app/category/category.entity';
import { User } from '@app/user/user.entity';
import { Product } from 'src/product/entity/product.entity';
import { Transaction } from 'src/transaction/transaction.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';

@Entity()
@Unique(['name', 'user'])
export class Store {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @ManyToOne(
    () => User,
    (user) => user.Stores,
    { onDelete: 'CASCADE' }, // Menambahkan cascade delete
  )
  @JoinColumn({ name: 'user_id' }) // Menentukan nama kolom di DB
  user: User;

  @OneToMany(() => Product, (product) => product.store)
  products: Product[];

  @OneToMany(() => Transaction, (transaction) => transaction.store)
  transactions: Transaction[];

  @OneToMany(() => Category, (category) => category.store)
  categories: Category[];
}

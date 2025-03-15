import { Category } from '@app/category/category.entity';
import { Courier } from '@app/courier/entity/courier.entity';
import { ProductDiscount } from '@app/discount/product-discount/product-discount.entity';
import { Voucher } from '@app/discount/voucher/voucher.entity';
import { Image } from '@app/image/image.entity';
import { ProductVariant } from '@app/product/entity/product-variant.entity';
import { User } from '@app/user/user.entity';
import { VariantType } from '@app/variant/variant-type.entity';
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

  @OneToMany(() => ProductVariant, (productVariant) => productVariant.store)
  productVariants: ProductVariant[];

  @OneToMany(() => Transaction, (transaction) => transaction.store)
  transactions: Transaction[];

  @OneToMany(() => Category, (category) => category.store)
  categories: Category[];

  @OneToMany(() => Voucher, (voucher) => voucher.store)
  vouchers: Voucher[];

  @OneToMany(() => ProductDiscount, (productDiscount) => productDiscount.store)
  productDiscount: ProductDiscount[];

  @OneToMany(() => Courier, (courier) => courier.store)
  couriers: Courier[];

  @OneToMany(() => Image, (image) => image.store)
  images: Image[];

  @OneToMany(() => VariantType, (variantType) => variantType.store)
  variantType: VariantType[];
}

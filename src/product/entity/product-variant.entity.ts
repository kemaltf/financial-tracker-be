import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Product } from './product.entity';
import { VariantType } from '../../variant/variant-type.entity';
import { Image } from 'src/image/image.entity';

@Entity('product_variants')
export class ProductVariant {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Product, (product) => product.variants)
  product: Product;

  @ManyToOne(() => VariantType, (variantType) => variantType.productVariants)
  variantType: VariantType;

  @Column({ type: 'varchar', length: 100 })
  variant_value: string; // Contoh: "Merah", "L", "Basic Model"

  @Column({ type: 'varchar', length: 100, unique: true })
  sku: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int' })
  stock: number;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updated_at: Date;

  @OneToMany(() => Image, (image) => image.productVariant)
  images: Image[];
}

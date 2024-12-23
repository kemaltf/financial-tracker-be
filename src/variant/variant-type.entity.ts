import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ProductVariant } from '../product/entity/product-variant.entity';

@Entity('variant_types')
export class VariantType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string; // Contoh: "Warna", "Ukuran", "Model"

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updated_at: Date;

  @OneToMany(() => ProductVariant, (variant) => variant.variantType)
  productVariants: ProductVariant[];
}

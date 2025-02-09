import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  Unique,
} from 'typeorm';
import { ProductVariant } from '../product/entity/product-variant.entity';
import { Store } from '@app/store/store.entity';

@Entity('variant_types')
@Unique(['store', 'name']) // Membuat kombinasi user dan code unik
export class VariantType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string; // Contoh: "Warna", "Ukuran", "Model"

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => ProductVariant, (variant) => variant.variantType)
  productVariants: ProductVariant[];

  @ManyToOne(() => Store, (store) => store.variantType, { nullable: false })
  store: Store;
}

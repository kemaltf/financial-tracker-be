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
import { Store } from '@app/store/store.entity';
import { VariantName } from './variant-name.entity';

// e.g
// name      | store (mtO)          | variantNames (otM)
// 'Warna'   | 1                    |  [1,2,3]

@Entity('variant_types')
@Unique(['store', 'name']) // Membuat kombinasi user dan code unik
export class VariantType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string; // Contoh: "Warna", "Ukuran", "Model"

  @ManyToOne(() => Store, (store) => store.variantType, { nullable: false })
  store: Store;

  @OneToMany(() => VariantName, (variantName) => variantName.variantType)
  variantNames: VariantName[];

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;
}

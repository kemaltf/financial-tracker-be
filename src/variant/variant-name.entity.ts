import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { VariantType } from './variant-type.entity';
import { VariantOption } from '@app/product/entity/variant-option.entity';

// e.g
// name     | variantType (mtO) | variantOption (otM)
// 'Yellow' | 1                 | [1,2,3]

@Entity()
export class VariantName {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ManyToOne(() => VariantType, (variantType) => variantType.variantNames)
  variantType: VariantType;

  @OneToMany(() => VariantOption, (variantOption) => variantOption.variantName)
  variantOptions: VariantOption[];
}

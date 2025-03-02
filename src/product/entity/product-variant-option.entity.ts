import { Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { ProductVariant } from './product-variant.entity';
import { VariantOption } from '@app/product/entity/variant-option.entity';

@Entity()
export class ProductVariantOptions {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ProductVariant, (productVariant) => productVariant.options, {
    onDelete: 'CASCADE',
  })
  productVariant: ProductVariant;

  @ManyToOne(
    () => VariantOption,
    (variantOption) => variantOption.productVariantOptions,
  )
  variantOption: VariantOption;
}

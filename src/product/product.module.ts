import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { Product } from './entity/product.entity';
import { ProductVariant } from './entity/product-variant.entity';
import { Category } from 'src/category/category.entity';
import { Store } from 'src/store/store.entity';
import { Image } from 'src/image/image.entity';
import { VariantType } from 'src/variant/variant-type.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductVariant,
      Category,
      Store,
      Image,
      VariantType,
    ]),
  ],
  providers: [ProductService],
  controllers: [ProductController],
})
export class ProductModule {}

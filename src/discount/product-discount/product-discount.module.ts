import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '@app/product/entity/product.entity';
import { Store } from '@app/store/store.entity';
import { ProductDiscount } from './product-discount.entity';
import { ProductDiscountService } from './product-discount.service';
import { ProductDiscountController } from './product-discount.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProductDiscount, Product, Store])],
  controllers: [ProductDiscountController],
  providers: [ProductDiscountService],
})
export class ProductDiscountModule {}

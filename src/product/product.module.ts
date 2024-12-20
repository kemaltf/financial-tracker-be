import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { Product } from './entity/product.entity';
import { ProductVariant } from './entity/product-variant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductVariant])],
  providers: [ProductService],
  controllers: [ProductController],
})
export class ProductModule {}

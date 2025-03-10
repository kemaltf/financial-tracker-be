import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Voucher } from './voucher.entity';
import { VoucherService } from './voucher.service';
import { VoucherController } from './voucher.controller';
import { Product } from '@app/product/entity/product.entity';
import { Store } from '@app/store/store.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Voucher, Product, Store])],
  controllers: [VoucherController],
  providers: [VoucherService],
})
export class VoucherModule {}

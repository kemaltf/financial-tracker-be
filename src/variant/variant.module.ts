import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VariantType } from './variant-type.entity';
import { VariantTypeService } from './variant-type.service';
import { VariantTypeController } from './variant-type.controller';
import { Store } from '@app/store/store.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VariantType, Store])],
  providers: [VariantTypeService],
  controllers: [VariantTypeController],
})
export class VariantModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VariantType } from './variant-type.entity';
import { VariantTypeService } from './variant-type.service';
import { VariantTypeController } from './variant-type.controller';

@Module({
  imports: [TypeOrmModule.forFeature([VariantType])],
  providers: [VariantTypeService],
  controllers: [VariantTypeController],
})
export class VariantModule {}

import { Module } from '@nestjs/common';
import { RajaOngkirController } from './rajaongkir.controller';
import { RajaOngkirService } from './rajaongkir.service';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Courier } from '@app/courier/entity/courier.entity';
import { Store } from '@app/store/store.entity';

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([Courier, Store])],
  controllers: [RajaOngkirController],
  providers: [RajaOngkirService],
  exports: [RajaOngkirService],
})
export class RajaOngkirModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Courier } from './entity/courier.entity';
import { CourierController } from './courier.controller';
import { CourierService } from './courier.service';
import { Store } from '@app/store/store.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Courier, Store])],
  controllers: [CourierController],
  providers: [CourierService],
})
export class CourierModule {}

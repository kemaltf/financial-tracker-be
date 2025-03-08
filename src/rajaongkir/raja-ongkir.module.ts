import { Module } from '@nestjs/common';
import { RajaOngkirController } from './rajaongkir.controller';
import { RajaOngkirService } from './rajaongkir.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [RajaOngkirController],
  providers: [RajaOngkirService],
  exports: [RajaOngkirService],
})
export class RajaOngkirModule {}

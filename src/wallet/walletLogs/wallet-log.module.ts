import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletLog } from './wallet-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WalletLog])],
  providers: [],
  exports: [],
})
export class WalletLogModule {}

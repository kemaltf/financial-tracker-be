import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from './wallet.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Wallet])],
  providers: [],
  exports: [],
})
export class WalletModule {}

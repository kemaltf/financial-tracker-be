import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialParty } from './entity/financial-party.entity';
import { CustomerService } from './financial-party.service';
import { CustomerController } from './financial-party.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FinancialParty])],
  providers: [CustomerService],
  controllers: [CustomerController],
})
export class CustomerModule {}

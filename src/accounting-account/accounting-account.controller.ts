import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { AccountingAccountService } from './accounting-account.service';
import { AccountingAccount } from './accounting-account.entity';

@Controller('accounting-accounts')
export class AccountingAccountController {
  constructor(
    private readonly accountingAccountService: AccountingAccountService,
  ) {}

  @Post()
  async create(
    @Body() accountingAccount: Partial<AccountingAccount>,
  ): Promise<AccountingAccount> {
    return await this.accountingAccountService.create(accountingAccount);
  }

  @Get()
  async findAll(): Promise<AccountingAccount[]> {
    return await this.accountingAccountService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<AccountingAccount> {
    return await this.accountingAccountService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() updateData: Partial<AccountingAccount>,
  ): Promise<AccountingAccount> {
    return await this.accountingAccountService.update(id, updateData);
  }

  @Delete(':id')
  async remove(@Param('id') id: number): Promise<void> {
    await this.accountingAccountService.remove(id);
  }
}

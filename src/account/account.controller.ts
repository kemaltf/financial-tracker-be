import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { Account } from './account.entity';
import { AccountService } from './account.service';

@Controller('accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get()
  async findAll(): Promise<Account[]> {
    return this.accountService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Account> {
    return this.accountService.findOne(id);
  }

  @Post()
  async create(@Body() account: Partial<Account>): Promise<Account> {
    return this.accountService.create(account);
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() account: Partial<Account>,
  ): Promise<Account> {
    return this.accountService.update(id, account);
  }

  @Delete(':id')
  async delete(@Param('id') id: number): Promise<void> {
    return this.accountService.delete(id);
  }
}

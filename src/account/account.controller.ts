import {
  Body,
  Controller,
  Post,
  Put,
  Param,
  Get,
  Delete,
} from '@nestjs/common';
import { AccountService } from './account.service';
import { CreateAccountDTO } from './dto/create-account.dto';
import { UpdateAccountDTO } from './dto/update-account.dto';
import { Account } from './account.entity';

@Controller('accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post()
  async createAccount(
    @Body() createAccountDTO: CreateAccountDTO,
  ): Promise<Account> {
    return this.accountService.createAccount(createAccountDTO);
  }

  @Put(':id')
  async updateAccount(
    @Param('id') id: number,
    @Body() updateAccountDTO: UpdateAccountDTO,
  ): Promise<Account> {
    return this.accountService.updateAccount(id, updateAccountDTO);
  }

  // Mendapatkan semua akun
  @Get()
  async getAllAccounts(): Promise<Account[]> {
    return this.accountService.getAllAccounts();
  }

  // Mendapatkan akun berdasarkan ID
  @Get(':id')
  async getAccountById(@Param('id') id: number): Promise<Account> {
    return this.accountService.getAccountById(id);
  }

  // Menghapus akun berdasarkan ID
  @Delete(':id')
  async deleteAccount(@Param('id') id: number): Promise<{ message: string }> {
    await this.accountService.deleteAccount(id);
    return { message: `Account with ID ${id} has been deleted` };
  }
}

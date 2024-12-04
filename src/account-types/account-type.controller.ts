import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { AccountType, AccountTypeTypes } from './account-type.entity';
import { AccountTypeService } from './account-type.service';

@Controller('account-types')
export class AccountTypeController {
  constructor(private readonly accountTypeService: AccountTypeService) {}

  // Mendapatkan semua jenis akun
  @Get()
  async getAllAccountTypes(): Promise<AccountType[]> {
    return this.accountTypeService.getAllAccountTypes();
  }

  // Mendapatkan jenis akun berdasarkan ID
  @Get(':id')
  async getAccountTypeById(@Param('id') id: number): Promise<AccountType> {
    return this.accountTypeService.getAccountTypeById(id);
  }

  // Menambahkan akun jenis baru
  @Post()
  async createAccountType(
    @Body('name') name: string,
    @Body('type') type: AccountTypeTypes,
  ): Promise<AccountType> {
    return this.accountTypeService.createAccountType(name, type);
  }

  // Memperbarui akun jenis berdasarkan ID
  @Put(':id')
  async updateAccountType(
    @Param('id') id: number,
    @Body('name') name: string,
    @Body('type') type: AccountTypeTypes,
  ): Promise<AccountType> {
    return this.accountTypeService.updateAccountType(id, name, type);
  }

  // Menghapus akun jenis berdasarkan ID
  @Delete(':id')
  async deleteAccountType(@Param('id') id: number): Promise<void> {
    return this.accountTypeService.deleteAccountType(id);
  }
}

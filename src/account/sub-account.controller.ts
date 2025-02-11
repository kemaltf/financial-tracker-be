import {
  Body,
  Controller,
  Post,
  Put,
  Param,
  Get,
  Delete,
  BadRequestException,
} from '@nestjs/common';
import { SubAccountService } from './sub-account.service';
import { CreateAccountDTO } from './dto/create-account.dto';
import { UpdateAccountDTO } from './dto/update-account.dto';
import { SubAccount } from './sub-account.entity';
import { GetUser } from '@app/common/decorators/get-user.decorator';
import { User } from '@app/user/user.entity';

@Controller('accounts')
export class subAccountController {
  constructor(private readonly subAccountService: SubAccountService) {}

  @Post()
  async createAccount(
    @Body() createAccountDTO: CreateAccountDTO,
    @GetUser() user: User,
  ): Promise<SubAccount> {
    return this.subAccountService.createAccount(createAccountDTO, user);
  }

  @Put(':id')
  async updateAccount(
    @Param('id') id: number,
    @Body() updateAccountDTO: UpdateAccountDTO,
    @GetUser() user: User,
  ): Promise<SubAccount> {
    return this.subAccountService.updateAccount(id, updateAccountDTO, user);
  }

  // Mendapatkan semua akun
  @Get()
  async getAllAccounts(@GetUser() user: User): Promise<SubAccount[]> {
    return this.subAccountService.getAllAccounts(user);
  }

  // Mendapatkan akun berdasarkan ID
  @Get(':id')
  async getAccountById(
    @Param('id') id: number,
    @GetUser() user: User,
  ): Promise<SubAccount> {
    return this.subAccountService.getSubAccountById(id, user);
  }

  // Menghapus akun berdasarkan ID
  @Delete(':id')
  async deleteAccount(
    @Param('id') id: number,
    user: User,
  ): Promise<{ message: string }> {
    await this.subAccountService.deleteAccount(id, user);
    return { message: `Account with ID ${id} has been deleted` };
  }

  /**
   * Get available accounts based on transaction type
   * @param transactionTypeId ID of the transaction type
   * @param accounts List of accounts to filter
   * @returns Available debit and credit accounts
   */
  @Get('/options/:transactionTypeId')
  async getAvailableAccounts(
    @Param('transactionTypeId') transactionTypeId: number,
    @GetUser() user: User,
  ) {
    console.log(transactionTypeId);
    if (!transactionTypeId) {
      throw new BadRequestException(
        'TransactionTypeId and accounts are required.',
      );
    }

    // Fetch available accounts based on transaction type
    return this.subAccountService.getAvailableAccounts(transactionTypeId, user);
  }
}

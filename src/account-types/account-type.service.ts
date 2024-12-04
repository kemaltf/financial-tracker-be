import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountType, AccountTypeTypes } from './account-type.entity';
import { HandleErrors } from 'src/common/decorators';

@Injectable()
export class AccountTypeService {
  constructor(
    @InjectRepository(AccountType)
    private readonly accountTypeRepository: Repository<AccountType>,
  ) {}

  // Menambahkan akun jenis baru
  @HandleErrors()
  async createAccountType(
    name: string,
    type: AccountTypeTypes,
  ): Promise<AccountType> {
    const newAccountType = this.accountTypeRepository.create({
      type,
    });
    return this.accountTypeRepository.save(newAccountType);
  }

  // Mendapatkan semua akun jenis
  @HandleErrors()
  async getAllAccountTypes(): Promise<AccountType[]> {
    return this.accountTypeRepository.find();
  }

  // Mendapatkan akun jenis berdasarkan ID
  @HandleErrors()
  async getAccountTypeById(id: number): Promise<AccountType> {
    return this.accountTypeRepository.findOne({ where: { id } });
  }

  // Update akun jenis berdasarkan ID
  @HandleErrors()
  async updateAccountType(
    id: number,
    name: string,
    type: AccountTypeTypes,
  ): Promise<AccountType> {
    const accountType = await this.accountTypeRepository.findOne({
      where: { id },
    });
    if (accountType) {
      accountType.type = type;
      return this.accountTypeRepository.save(accountType);
    }
    throw new Error('Account Type not found');
  }

  // Hapus akun jenis
  @HandleErrors()
  async deleteAccountType(id: number): Promise<void> {
    await this.accountTypeRepository.delete(id);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './account.entity'; // Path ke file Account
import { CreateAccountDTO } from './dto/create-account.dto';
import { UpdateAccountDTO } from './dto/update-account.dto';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
  ) {}

  // Mendapatkan semua akun
  async getAllAccounts(): Promise<Account[]> {
    return await this.accountRepository.find();
  }

  // Mendapatkan akun berdasarkan ID
  async getAccountById(id: number): Promise<Account> {
    const account = await this.accountRepository.findOne({ where: { id } });
    if (!account) {
      throw new Error(`Account with ID ${id} not found`);
    }
    return account;
  }

  // Membuat akun baru
  async createAccount(createAccountDTO: CreateAccountDTO): Promise<Account> {
    const { code, name, type, description } = createAccountDTO;

    const newAccount = this.accountRepository.create({
      code,
      name,
      type,
      description,
    });
    return await this.accountRepository.save(newAccount);
  }

  // Memperbarui akun berdasarkan ID
  async updateAccount(
    id: number,
    updateAccountDTO: UpdateAccountDTO,
  ): Promise<Account> {
    const account = await this.getAccountById(id);
    Object.assign(account, updateAccountDTO);
    return await this.accountRepository.save(account);
  }

  // Menghapus akun berdasarkan ID
  async deleteAccount(id: number): Promise<void> {
    const account = await this.getAccountById(id);
    await this.accountRepository.remove(account);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountingAccount } from './accounting-account.entity';

@Injectable()
export class AccountingAccountService {
  constructor(
    @InjectRepository(AccountingAccount)
    private readonly accountingAccountRepository: Repository<AccountingAccount>,
  ) {}

  async create(
    accountingAccount: Partial<AccountingAccount>,
  ): Promise<AccountingAccount> {
    return await this.accountingAccountRepository.save(accountingAccount);
  }

  async findAll(): Promise<AccountingAccount[]> {
    return await this.accountingAccountRepository.find({
      relations: ['account'],
    });
  }

  async findOne(id: number): Promise<AccountingAccount> {
    return await this.accountingAccountRepository.findOne({
      where: { id },
      relations: ['account'],
    });
  }

  async update(
    id: number,
    updateData: Partial<AccountingAccount>,
  ): Promise<AccountingAccount> {
    await this.accountingAccountRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.accountingAccountRepository.delete(id);
  }
}

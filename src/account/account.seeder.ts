import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './account.entity'; // Path sesuai
import { AccountingAccount } from 'src/accounting-account/accounting-account.entity';
import {
  AccountType,
  AccountTypeTypes,
} from 'src/account-types/account-type.entity';

@Injectable()
export class AccountSeeder {
  constructor(
    @InjectRepository(AccountType)
    private accountTypeRepository: Repository<AccountType>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    @InjectRepository(AccountingAccount)
    private accountingAccountRepository: Repository<AccountingAccount>,
  ) {}

  async seed() {
    // Menambahkan data Account Types
    const accountTypes = [
      { type: 'Assets' as AccountTypeTypes },
      { type: 'Liabilities' as AccountTypeTypes },
      { type: 'Revenue' as AccountTypeTypes },
      { type: 'Expenses' as AccountTypeTypes },
    ];

    await this.accountTypeRepository.save(accountTypes);

    // Menambahkan data Accounts
    const accounts = [
      {
        name: 'Kas di Bank Mandiri',
        code: '101',
        typeId: 1, // ID untuk 'Assets'
      },
      {
        name: 'Kas di Bank BCA',
        code: '102',
        typeId: 1, // ID untuk 'Assets'
      },
      {
        name: 'Kas Shopee Wallet',
        code: '103',
        typeId: 1, // ID untuk 'Assets'
      },
      {
        name: 'Pendapatan Penjualan',
        code: '301',
        typeId: 3, // ID untuk 'Revenue'
      },
      {
        name: 'Biaya Produksi',
        code: '401',
        typeId: 4, // ID untuk 'Expenses'
      },
    ];

    await this.accountRepository.save(accounts);

    // Menambahkan data Accounting Accounts
    const accountingAccounts = [
      {
        name: 'Kas di Bank Mandiri',
        accountId: 1,
        balance: 1000000,
        nomor_account: '101',
      },
      {
        name: 'Kas di Bank BCA',
        accountId: 2,
        balance: 2000000,
        nomor_account: '102',
      },
      {
        name: 'Kas Shopee Wallet',
        accountId: 3,
        balance: 500000,
        nomor_account: null,
      },
      {
        name: 'Pendapatan Penjualan',
        accountId: 4,
        balance: 5000000,
        nomor_account: null,
      },
      {
        name: 'Biaya Produksi',
        accountId: 5,
        balance: 2000000,
        nomor_account: null,
      },
    ];

    await this.accountingAccountRepository.save(accountingAccounts);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './account.entity';
import { AccountingAccount } from 'src/accounting-account/accounting-account.entity';
import { AccountType } from 'src/account-types/account-type.entity';

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
    // Mengambil data AccountType yang sudah ada di database
    const savedAccountTypes = await this.accountTypeRepository.find();

    if (!savedAccountTypes.length) {
      console.log('Tidak ada AccountType yang ditemukan di database!');
      return;
    }

    // Menambahkan data Accounts
    const accounts = [
      {
        name: 'Kas di Bank Mandiri',
        code: '101',
        typeId: savedAccountTypes.find((type) => type.type === 'Assets').id,
      },
      {
        name: 'Kas di Bank BCA',
        code: '102',
        typeId: savedAccountTypes.find((type) => type.type === 'Assets').id,
      },
      {
        name: 'Kas Shopee Wallet',
        code: '103',
        typeId: savedAccountTypes.find((type) => type.type === 'Assets').id,
      },
      {
        name: 'Pendapatan Penjualan',
        code: '301',
        typeId: savedAccountTypes.find((type) => type.type === 'Revenue').id,
      },
      {
        name: 'Biaya Produksi',
        code: '401',
        typeId: savedAccountTypes.find((type) => type.type === 'Expenses').id,
      },
    ];
    await this.accountRepository.save(accounts);

    console.log('Seeding selesai.');
  }
}

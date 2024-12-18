import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AccountType, AccountTypeTypes } from './account-type.entity'; // Pastikan enum juga diimpor
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AccountTypeSeeder {
  constructor(
    @InjectRepository(AccountType)
    private accountingAccountRepository: Repository<AccountType>,
  ) {}

  async seed() {
    const accountTypes: AccountTypeTypes[] = [
      'Assets',
      'Liabilities',
      'Revenue',
      'Expenses',
      'Equity',
    ];

    // Tambahkan data baru
    const accountTypeEntities = accountTypes.map((type) => {
      const accountType = new AccountType();
      accountType.type = type; // Pastikan type sesuai dengan tipe enum AccountTypeTypes
      return accountType;
    });
    console.log(accountTypeEntities);

    // Simpan semua data sekaligus untuk efisiensi
    await this.accountingAccountRepository.save(accountTypeEntities);

    console.log('Seeding AccountType selesai.');
  }
}

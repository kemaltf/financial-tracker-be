import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { AccountType, AccountTypeTypes } from './account-type.entity'; // Pastikan enum juga diimpor

@Injectable()
export class AccountTypeSeeder {
  constructor(private readonly connection: Connection) {}

  async seed() {
    const accountTypes: AccountTypeTypes[] = [
      'Assets',
      'Liabilities',
      'Revenue',
      'Expenses',
      'Equity',
    ];

    const accountTypeRepository = this.connection.getRepository(AccountType);

    // Periksa apakah data sudah ada, jika belum, tambahkan
    for (const type of accountTypes) {
      const existingAccountType = await accountTypeRepository.findOne({
        where: { type },
      });

      if (!existingAccountType) {
        const accountType = new AccountType();
        accountType.type = type; // Pastikan type sesuai dengan tipe enum AccountTypeTypes
        await accountTypeRepository.save(accountType);
      }
    }
  }
}

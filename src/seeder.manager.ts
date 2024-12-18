import { Injectable } from '@nestjs/common';
import { AccountSeeder } from './account/account.seeder';
import { AccountTypeSeeder } from './account-types/account-type.seeder';
import { AccountType } from './account-types/account-type.entity';
import { Account } from './account/account.entity';
import { AccountingAccount } from './accounting-account/accounting-account.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class SeederService {
  constructor(
    private readonly accountTypeSeeder: AccountTypeSeeder,
    private readonly accountSeeder: AccountSeeder,
    @InjectRepository(AccountType)
    private accountTypeRepository: Repository<AccountType>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    @InjectRepository(AccountingAccount)
    private accountingAccountRepository: Repository<AccountingAccount>,
  ) {}

  async resetData() {
    // Menonaktifkan pemeriksaan foreign key
    await this.accountTypeRepository.query('SET FOREIGN_KEY_CHECKS = 0');
    await this.accountRepository.query('SET FOREIGN_KEY_CHECKS = 0');
    await this.accountingAccountRepository.query('SET FOREIGN_KEY_CHECKS = 0');

    // Menghapus semua data dari tabel yang terkait
    await this.accountTypeRepository.clear();
    await this.accountRepository.clear();
    await this.accountingAccountRepository.clear();

    // Mengaktifkan kembali pemeriksaan foreign key
    await this.accountTypeRepository.query('SET FOREIGN_KEY_CHECKS = 1');
    await this.accountRepository.query('SET FOREIGN_KEY_CHECKS = 1');
    await this.accountingAccountRepository.query('SET FOREIGN_KEY_CHECKS = 1');
  }

  async seed() {
    console.log('Mulai menjalankan seeders...');

    // Reset data terlebih dahulu sebelum seeding
    await this.resetData();

    // Eksekusi seeders secara berurutan

    await this.accountTypeSeeder.seed();
    console.log('AccountTypeSeeder selesai.');
    await this.accountSeeder.seed();
    console.log('AccountSeeder selesai.');

    console.log('Semua seeders selesai.');
  }
}

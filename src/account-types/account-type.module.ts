import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountType } from './account-type.entity';
import { AccountTypeService } from './account-type.service';
import { AccountTypeController } from './account-type.controller';
import { AccountTypeSeeder } from './account-type.seeder';

@Module({
  imports: [TypeOrmModule.forFeature([AccountType])],
  providers: [AccountTypeService, AccountTypeSeeder],
  controllers: [AccountTypeController],
  exports: [AccountTypeSeeder, TypeOrmModule],
})
export class AccountTypeModule implements OnModuleInit {
  constructor(private readonly accountTypeSeeder: AccountTypeSeeder) {}

  async onModuleInit() {
    await this.accountTypeSeeder.seed(); // Jalankan seeder saat module diinisialisasi
  }
}

// src/user/user.module.ts
import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubAccount } from '@app/account/sub-account.entity';
import { Account } from '@app/account/account.entity';
import { AccountModule } from '@app/account/account.module';

@Module({
  imports: [
    AccountModule,
    TypeOrmModule.forFeature([User, SubAccount, Account]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}

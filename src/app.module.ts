import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { AccountTypeModule } from './account-types/account-type.module';
import { AccountModule } from './account/account.module';
import { AccountingAccountModule } from './accounting-account/accounting-account.module';
import { SeederModule } from './seeder.module';

@Module({
  imports: [
    DatabaseModule,
    UserModule,
    AccountModule,
    AuthModule,
    AccountingAccountModule,
    SeederModule,
    AccountTypeModule,
    ConfigModule.forRoot({
      envFilePath: '.env.development.local',
      isGlobal: true,
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}

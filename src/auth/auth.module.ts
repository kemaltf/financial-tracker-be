import { Module } from '@nestjs/common';
// import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
// import { SellerModule } from 'src/seller/seller.module';
// import { CommonModule } from 'src/common/common.module';
import { setupJwtModule } from './jwt.config';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
import { PasswordModule } from 'src/common/password/password.module';
import { UserModule } from 'src/user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/user.entity';
// import { StoreModule } from 'src/store/store.module';

@Module({
  imports: [
    PasswordModule,
    UserModule,
    setupJwtModule(),
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}

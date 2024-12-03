import { Module } from '@nestjs/common';
import { PasswordService } from './password.service';

@Module({
  providers: [PasswordService],
  exports: [PasswordService], // Export PasswordService for use in other modules
})
export class PasswordModule {}

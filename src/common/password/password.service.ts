import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';

@Injectable()
export class PasswordService {
  constructor(private configService: ConfigService) {}
  async hashPassword(password: string): Promise<string> {
    const memoryCost =
      parseInt(this.configService.get<string>('HASH_MEMORY_COST'), 10) || 65536;
    const timeCost =
      parseInt(this.configService.get<string>('HASH_TIME_COST'), 10) || 3;
    const parallelism =
      parseInt(this.configService.get<string>('HASH_PARALLELISM'), 10) || 1;

    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost,
      timeCost,
      parallelism,
    });
  }

  async verifyPassword(hash: string, password: string): Promise<boolean> {
    return await argon2.verify(hash, password);
  }
}

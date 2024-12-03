/**
 * jwt.strategy.ts to handle JWT authentication and verify roles based on payload.
 */

import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';
import { User } from 'src/user/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  // we didn't use private access modifier for config because if we use,
  // it means we call this.config before initiate super() and its prohibited in js
  constructor(
    config: ConfigService, // using environment variable
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly userService: UserService,
  ) {
    super({
      // AUTORISASI BERDASARKAN BEARER TOKEN
      // jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          let token = null;
          if (req && req.cookies) {
            token = req.cookies['accessToken']; // The cookie name should match what you set in the server
          }
          return token;
        },
      ]),
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; username: string }): Promise<User> {
    console.log(payload);
    const seller = await this.userService.findUniqueExcPass(payload.sub);

    if (!seller) {
      throw new UnauthorizedException('User not found');
    }

    return seller;
  }
}

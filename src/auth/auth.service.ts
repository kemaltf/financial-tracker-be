import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
// import { CreateUserDto } from './dto/create-user.dto';
import { HandleErrors } from 'src/common/decorators';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { UserService } from 'src/user/user.service';
import { LoginUserDto } from './dto/login-service.dto';
import { PasswordService } from 'src/common/password/password.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private readonly passwordService: PasswordService,
  ) {}

  @HandleErrors()
  async signUp(dto: CreateUserDto) {
    const hashedPassword = await this.passwordService.hashPassword(
      dto.password,
    );
    return await this.userService.create({
      ...dto,
      password: hashedPassword,
    });
  }

  @HandleErrors()
  async signIn(dto: LoginUserDto) {
    const user = await this.userService.findOneByUsername(dto.username);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.passwordService.verifyPassword(
      user.password,
      dto.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, username: user.username };
    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });

    const atExp = this.jwtService.decode(accessToken).exp;
    const rtExp = this.jwtService.decode(refreshToken).exp;

    return {
      access: { token: accessToken, expired: new Date(atExp * 1000) },
      refresh: { token: refreshToken, expired: new Date(rtExp * 1000) },
    };
  }

  @HandleErrors()
  async refreshToken(oldRefreshToken: string) {
    try {
      const decoded = await this.jwtService.verifyAsync(oldRefreshToken);

      const payload = { sub: decoded.sub, username: decoded.username };
      const newAccessToken = await this.jwtService.signAsync(payload, {
        expiresIn: '15m',
      });

      const atExp = this.jwtService.decode(newAccessToken).exp;

      return {
        access: { token: newAccessToken, expired: new Date(atExp * 1000) },
      };
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}

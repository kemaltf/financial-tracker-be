import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from 'src/common/decorators';
import { Request, Response } from 'express';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { LoginUserDto } from './dto/login-service.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Sign up a new user' })
  @ApiResponse({ status: 201, description: 'User successfully signed up' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @HttpCode(HttpStatus.CREATED)
  @Public()
  @Post('signup')
  signUp(@Body() signUpDto: CreateUserDto) {
    return this.authService.signUp(signUpDto);
  }

  @ApiOperation({ summary: 'Sign in a user' })
  @ApiResponse({ status: 200, description: 'User successfully signed in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @HttpCode(HttpStatus.OK)
  @Public()
  @Post('signin')
  async signIn(
    @Body() signInDto: LoginUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const signIn = await this.authService.signIn(signInDto);
    const isProduction = false;

    // const signInDummy = {
    //   access: {
    //     token: 'yourAccessToken',
    //     expired: Date.now() - 10000, // Set expired to 10 seconds in the past
    //   },
    // };
    response.cookie('accessToken', signIn.access.token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      // expires: new Date(signInDummy.access.expired),
      expires: new Date(signIn.access.expired),
    });

    response.cookie('refreshToken', signIn.refresh.token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      expires: new Date(signIn.refresh.expired),
    });
  }

  @ApiOperation({ summary: 'Refresh the access token' })
  @ApiResponse({
    status: 200,
    description: 'Access token successfully refreshed',
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token not found or expired',
  })
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refreshToken(
    @Req() req: Request, // Use Request to access cookies
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = req.cookies?.['refreshToken']; // Get refresh token from cookies

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const accessToken = await this.authService.refreshToken(refreshToken);
    const isProduction = false;

    response.cookie('accessToken', accessToken.access.token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      expires: new Date(accessToken.access.expired),
    });
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    const isProduction = false;

    // Clear cookies
    response.clearCookie('accessToken', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
    });

    response.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
    });
  }
}

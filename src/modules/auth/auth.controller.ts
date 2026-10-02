import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { Public } from '@decorators/public.decorator';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { Cookies } from '@decorators/cookie.decorator';
import { AuthGuard } from '@nestjs/passport';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
};

@Controller('auth')
@Public()
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 6000 } })
  @Post('/login')
  async login(
    @Body() userDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.login(userDto);

    this.setCookies(accessToken, refreshToken, res);

    return { message: 'Logged in successfully' };
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 6000 } })
  @Post('/registration')
  async registration(
    @Body() userDto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } =
      await this.authService.registration(userDto);

    this.setCookies(accessToken, refreshToken, res);

    return { message: 'User successfully registered' };
  }

  @Post('/refresh')
  async refreshToken(
    @Res({ passthrough: true }) res: Response,
    @Cookies('refreshToken') token: string,
  ) {
    const { accessToken, refreshToken } =
      await this.authService.refreshToken(token);

    this.setCookies(accessToken, refreshToken, res);

    return { message: 'Tokens successfully refreshed' };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const googleUser = req.user as { email: string; userName: string };

    const { accessToken, refreshToken } =
      await this.authService.validateOAuthUser(googleUser);

    await this.setCookies(accessToken, refreshToken, res);

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    return res.redirect(`${clientUrl}/`);
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refreshToken', { path: '/' });
    res.clearCookie('accessToken', { path: '/' });
    return { message: 'Logged out successfully' };
  }

  private setCookies(accessToken: string, refreshToken: string, res: Response) {
    res.cookie('refreshToken', refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.cookie('accessToken', accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 30 * 60 * 1000,
      path: '/',
    });
  }
}

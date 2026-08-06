import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Request, Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import type { AuthenticatedUser } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SessionAuthGuard } from './session-auth.guard';
import { SessionService } from './session.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60 * 60 * 1000 } })
  async register(
    @Body() input: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ user: AuthenticatedUser }> {
    const result = await this.auth.register(input);
    this.setSessionCookie(response, result.token);
    return { user: result.user };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60 * 1000 } })
  async login(
    @Body() input: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ user: AuthenticatedUser }> {
    const result = await this.auth.login(input);
    this.setSessionCookie(response, result.token);
    return { user: result.user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(SessionAuthGuard)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    if (request.sessionToken) await this.sessions.revoke(request.sessionToken);
    response.clearCookie(this.cookieName(), this.cookieOptions());
  }

  @Get('me')
  @UseGuards(SessionAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser): { user: AuthenticatedUser } {
    return { user };
  }

  private setSessionCookie(response: Response, token: string): void {
    const days = this.config.get<number>('SESSION_DAYS', 30);
    response.cookie(this.cookieName(), token, {
      ...this.cookieOptions(),
      maxAge: days * 24 * 60 * 60 * 1000,
    });
  }

  private cookieName(): string {
    return this.config.get<string>('SESSION_COOKIE_NAME', 'todorist_session');
  }

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      signed: true,
      path: '/',
    };
  }
}

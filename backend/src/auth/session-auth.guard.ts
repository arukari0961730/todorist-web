import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { ApiException } from '../common/api-exception';
import { SessionService } from './session.service';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly sessions: SessionService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const cookieName = this.config.get<string>(
      'SESSION_COOKIE_NAME',
      'todorist_session',
    );
    const cookies = request.signedCookies as
      Record<string, unknown> | undefined;
    const token = cookies?.[cookieName];

    if (typeof token !== 'string' || token.length === 0) {
      throw new ApiException(401, 'UNAUTHORIZED', 'ログインが必要です');
    }

    const user = await this.sessions.validate(token);
    if (!user) {
      throw new ApiException(
        401,
        'SESSION_EXPIRED',
        'ログインの有効期限が切れています',
      );
    }

    request.currentUser = user;
    request.sessionToken = token;
    return true;
  }
}

import { Injectable } from '@nestjs/common';
import { argon2id, hash, verify } from 'argon2';
import { ApiException } from '../common/api-exception';
import { normalizeEmail } from '../common/utils/normalize';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthResult, AuthenticatedUser } from './auth.types';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import { SessionService } from './session.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionService,
  ) {}

  async register(input: RegisterDto): Promise<AuthResult> {
    if (input.password !== input.passwordConfirmation) {
      throw new ApiException(
        400,
        'PASSWORD_CONFIRMATION_MISMATCH',
        'パスワード確認が一致しません',
        [
          {
            field: 'passwordConfirmation',
            code: 'PASSWORD_CONFIRMATION_MISMATCH',
            message: 'パスワード確認が一致しません',
          },
        ],
      );
    }

    const email = normalizeEmail(input.email);
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ApiException(
        409,
        'EMAIL_ALREADY_EXISTS',
        'このメールアドレスはすでに登録されています',
      );
    }

    const passwordHash = await hash(input.password, {
      type: argon2id,
      memoryCost: 19_456,
      timeCost: 2,
      parallelism: 1,
    });

    const user = await this.prisma.user.create({
      data: {
        name: input.name.trim(),
        email,
        passwordHash,
      },
    });
    const token = await this.sessions.create(user.id);
    return { user: this.presentUser(user), token };
  }

  async login(input: LoginDto): Promise<AuthResult> {
    const email = normalizeEmail(input.email);
    const user = await this.prisma.user.findUnique({ where: { email } });
    const valid = user
      ? await verify(user.passwordHash, input.password)
      : false;

    if (!user || !valid) {
      throw new ApiException(
        401,
        'INVALID_CREDENTIALS',
        'メールアドレスまたはパスワードが正しくありません',
      );
    }

    const token = await this.sessions.create(user.id);
    return { user: this.presentUser(user), token };
  }

  private presentUser(user: {
    id: string;
    name: string;
    email: string;
  }): AuthenticatedUser {
    return { id: user.id, name: user.name, email: user.email };
  }
}

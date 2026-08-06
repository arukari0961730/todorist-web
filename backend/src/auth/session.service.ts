import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from './auth.types';

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async create(userId: string): Promise<string> {
    const token = randomBytes(32).toString('base64url');
    const days = this.config.get<number>('SESSION_DAYS', 30);
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    await this.prisma.session.create({
      data: {
        userId,
        tokenHash: this.hashToken(token),
        expiresAt,
      },
    });

    return token;
  }

  async validate(token: string): Promise<AuthenticatedUser | null> {
    const tokenHash = this.hashToken(token);
    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!session) return null;
    if (session.expiresAt.getTime() <= Date.now()) {
      await this.prisma.session.delete({ where: { id: session.id } });
      return null;
    }

    if (Date.now() - session.lastUsedAt.getTime() > 15 * 60 * 1000) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { lastUsedAt: new Date() },
      });
    }

    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
    };
  }

  async revoke(token: string): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { tokenHash: this.hashToken(token) },
    });
  }

  async revokeAll(userId: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { userId } });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}

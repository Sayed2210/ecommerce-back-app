import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { RedisService } from '@infrastructure/cache/redis.service';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  // TTL matches reset token expiry (1 hour)
  private readonly RESET_TOKEN_REVOKED_TTL = 3600;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async generateTokens(userId: string) {
    const payload = { sub: userId, type: 'access' };
    const refreshPayload = {
      sub: userId,
      type: 'refresh',
      jti: crypto.randomUUID(),
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async generateResetToken(userId: string): Promise<string> {
    const payload = { sub: userId, type: 'reset' };
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_RESET_SECRET'),
      expiresIn: '1h',
    });
  }

  async generateVerificationToken(userId: string): Promise<string> {
    const payload = { sub: userId, type: 'verification' };
    const secret = this.configService.get('JWT_VERIFICATION_SECRET');
    if (!secret) throw new Error('JWT_VERIFICATION_SECRET is not configured');
    return this.jwtService.signAsync(payload, {
      secret,
      expiresIn: '24h',
    });
  }

  async verifyRefreshToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
      // Confirm token still exists in DB — detects use of rotated/revoked tokens
      const record = await this.refreshTokenRepository.findOne({
        where: { token },
      });
      if (!record) {
        throw new Error('Refresh token has been revoked');
      }
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async verifyResetToken(token: string) {
    try {
      const tokenHash = this.hashToken(token);
      const isRevoked = await this.redisService.exists(
        `revoked:reset:${tokenHash}`,
      );
      if (isRevoked) {
        throw new Error('Reset token has already been used');
      }
      return await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_RESET_SECRET'),
      });
    } catch {
      throw new BadRequestException('Invalid or expired reset token');
    }
  }

  async verifyVerificationToken(token: string) {
    try {
      const secret = this.configService.get('JWT_VERIFICATION_SECRET');
      if (!secret) throw new Error('JWT_VERIFICATION_SECRET is not configured');
      return await this.jwtService.verifyAsync(token, { secret });
    } catch {
      throw new BadRequestException('Invalid or expired verification token');
    }
  }

  async saveRefreshToken(userId: string, token: string): Promise<void> {
    const refreshToken = this.refreshTokenRepository.create({
      userId,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await this.refreshTokenRepository.save(refreshToken);
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await this.refreshTokenRepository.delete({ token });
  }

  async revokeResetToken(token: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    await this.redisService.set(
      `revoked:reset:${tokenHash}`,
      true,
      this.RESET_TOKEN_REVOKED_TTL,
    );
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

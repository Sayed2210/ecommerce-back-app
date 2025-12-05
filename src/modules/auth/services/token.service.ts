import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';

@Injectable()
export class TokenService {
    private readonly logger = new Logger(TokenService.name);

    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        @InjectRepository(RefreshToken)
        private readonly refreshTokenRepository: Repository<RefreshToken>,
    ) { }

    async generateTokens(userId: string) {
        const payload = { sub: userId, type: 'access' };
        const refreshPayload = { sub: userId, type: 'refresh' };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_ACCESS_SECRET'),
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

    async verifyRefreshToken(token: string) {
        try {
            return await this.jwtService.verifyAsync(token, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
            });
        } catch (error) {
            throw new Error('Invalid refresh token');
        }
    }

    async verifyResetToken(token: string) {
        try {
            return await this.jwtService.verifyAsync(token, {
                secret: this.configService.get('JWT_RESET_SECRET'),
            });
        } catch (error) {
            throw new Error('Invalid or expired reset token');
        }
    }

    async saveRefreshToken(userId: string, token: string): Promise<void> {
        await this.refreshTokenRepository.upsert(
            {
                userId,
                token,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
            ['userId'],
        );
    }

    async revokeRefreshToken(token: string): Promise<void> {
        await this.refreshTokenRepository.delete({ token });
    }

    async revokeResetToken(token: string): Promise<void> {
        // Implementation for storing reset tokens if needed
        this.logger.log(`Revoked reset token: ${token}`);
    }
}
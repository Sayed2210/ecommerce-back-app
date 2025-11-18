import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PasswordService } from '@common/services/password.service';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { v4 as uuidv4 } from 'uuid';
import { addDays } from 'date-fns';


@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(RefreshToken)
        private refreshTokenRepository: Repository<RefreshToken>,
        private jwtService: JwtService,
        private passwordService: PasswordService,
        private configService: ConfigService,
    ) { }

    async login(loginDto: LoginDto, ipAddress: string, userAgent: string) {
        const user = await this.userRepository.findOne({ where: { email: loginDto.email } });
        if (!user || !(await this.passwordService.compare(loginDto.password, user.passwordHash))) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Account is deactivated');
        }

        const tokens = await this.generateTokens(user, ipAddress, userAgent);

        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: this.sanitizeUser(user),
        };
    }

    async refreshToken(refreshTokenDto: RefreshTokenDto, ipAddress: string, userAgent: string) {
        const payload = await this.jwtService.verifyAsync(refreshTokenDto.refreshToken, {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
        });

        const tokenRecord = await this.refreshTokenRepository.findOne({
            where: { token: refreshTokenDto.refreshToken, isRevoked: false },
            relations: ['user'],
        });

        if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        // Rotation: Revoke old token
        await this.refreshTokenRepository.update(tokenRecord.id, { isRevoked: true });

        // Generate new pair
        const tokens = await this.generateTokens(tokenRecord.user, ipAddress, userAgent);

        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        };
    }

    private async generateTokens(user: User, ipAddress: string, userAgent: string) {
        const payload = { sub: user.id, email: user.email, role: user.role };

        const accessToken = await this.jwtService.signAsync(payload, {
            secret: this.configService.get('JWT_SECRET'),
            expiresIn: '15m',
        });

        const refreshToken = uuidv4();
        const refreshTokenEntity = this.refreshTokenRepository.create({
            token: refreshToken,
            user,
            ipAddress,
            userAgent,
            expiresAt: addDays(new Date(), 7),
        });

        await this.refreshTokenRepository.save(refreshTokenEntity);

        return { accessToken, refreshToken };
    }

    async logout(userId: string, refreshToken: string) {
        await this.refreshTokenRepository.update(
            { user: { id: userId }, token: refreshToken },
            { isRevoked: true },
        );
    }
}
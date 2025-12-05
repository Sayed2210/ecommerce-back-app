import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../repositories/user.repository';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { RegisterDto } from '../dtos/register.dto';
import { LoginDto } from '../dtos/login.dto';
import { ForgotPasswordDto } from '../dtos/forgot-password.dto';
import { ResetPasswordDto } from '../dtos/reset-password.dto';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly jwtService: JwtService,
        private readonly passwordService: PasswordService,
        private readonly tokenService: TokenService,
        private readonly configService: ConfigService,
    ) { }

    async register(dto: RegisterDto) {
        const existingUser = await this.userRepository.findByEmail(dto.email);
        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        const hashedPassword = await this.passwordService.hash(dto.password);
        const user = await this.userRepository.create({
            ...dto,
            passwordHash: hashedPassword,
        });

        const tokens = await this.tokenService.generateTokens(user.id);
        await this.tokenService.saveRefreshToken(user.id, tokens.refreshToken);

        return {
            user: this.sanitizeUser(user),
            tokens,
        };
    }

    async login(dto: LoginDto) {
        const user = await this.userRepository.findByEmail(dto.email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await this.passwordService.verify(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const tokens = await this.tokenService.generateTokens(user.id);
        await this.tokenService.saveRefreshToken(user.id, tokens.refreshToken);

        return {
            user: this.sanitizeUser(user),
            tokens,
        };
    }

    async refreshTokens(dto: RefreshTokenDto) {
        const payload = await this.tokenService.verifyRefreshToken(dto.refreshToken);
        const user = await this.userRepository.findOneOrFail({ id: payload.sub });

        const newTokens = await this.tokenService.generateTokens(user.id);
        await this.tokenService.revokeRefreshToken(dto.refreshToken);
        await this.tokenService.saveRefreshToken(user.id, newTokens.refreshToken);

        return newTokens;
    }

    async forgotPassword(dto: ForgotPasswordDto) {
        const user = await this.userRepository.findByEmail(dto.email);
        if (!user) {
            return { message: 'If an account exists, we will send a reset link' };
        }

        const resetToken = await this.tokenService.generateResetToken(user.id);
        // Send email with reset token via queue
        return { message: 'Password reset email sent' };
    }

    async resetPassword(dto: ResetPasswordDto) {
        const payload = await this.tokenService.verifyResetToken(dto.token);
        const hashedPassword = await this.passwordService.hash(dto.newPassword);

        await this.userRepository.update(payload.sub, { passwordHash: hashedPassword });
        await this.tokenService.revokeResetToken(dto.token);

        return { message: 'Password reset successful' };
    }

    async logout(refreshToken: string) {
        await this.tokenService.revokeRefreshToken(refreshToken);
        return { message: 'Logged out successfully' };
    }

    private sanitizeUser(user: any) {
        const { passwordHash, ...result } = user;
        return result;
    }
}
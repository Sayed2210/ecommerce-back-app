import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
    UseGuards,
    Request
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dtos/register.dto';
import { LoginDto } from '../dtos/login.dto';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { ForgotPasswordDto } from '../dtos/forgot-password.dto';
import { ResetPasswordDto } from '../dtos/reset-password.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

/**
 * Authentication Controller
 * Handles user registration, login, password reset, and token management
 */
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    /**
     * Register a new user account
     */
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    /**
     * Login with email and password
     */
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    /**
     * Refresh access token using refresh token
     */
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
        return this.authService.refreshTokens(refreshTokenDto);
    }

    /**
     * Request password reset email
     */
    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
        return this.authService.forgotPassword(forgotPasswordDto);
    }

    /**
     * Reset password with token
     */
    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
        return this.authService.resetPassword(resetPasswordDto);
    }

    /**
     * Logout user and revoke refresh token
     */
    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async logout(@Body() refreshTokenDto: RefreshTokenDto) {
        return this.authService.logout(refreshTokenDto.refreshToken);
    }
}

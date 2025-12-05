import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dtos/register.dto';
import { LoginDto } from '../dtos/login.dto';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { ForgotPasswordDto } from '../dtos/forgot-password.dto';
import { ResetPasswordDto } from '../dtos/reset-password.dto';

describe('AuthController', () => {
    let controller: AuthController;
    let authService: Partial<Record<keyof AuthService, jest.Mock>>;

    beforeEach(async () => {
        authService = {
            register: jest.fn(),
            login: jest.fn(),
            refreshTokens: jest.fn(),
            forgotPassword: jest.fn(),
            resetPassword: jest.fn(),
            logout: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                { provide: AuthService, useValue: authService },
            ],
        }).compile();

        controller = module.get<AuthController>(AuthController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('register', () => {
        it('should call authService.register', async () => {
            const dto: RegisterDto = {
                email: 'test@example.com',
                password: 'password',
                firstName: 'John',
                lastName: 'Doe'
            };
            await controller.register(dto);
            expect(authService.register).toHaveBeenCalledWith(dto);
        });
    });

    describe('login', () => {
        it('should call authService.login', async () => {
            const dto: LoginDto = { email: 'test@example.com', password: 'password' };
            await controller.login(dto);
            expect(authService.login).toHaveBeenCalledWith(dto);
        });
    });

    describe('refreshTokens', () => {
        it('should call authService.refreshTokens', async () => {
            const dto: RefreshTokenDto = { refreshToken: 'refresh-token' };
            await controller.refreshTokens(dto);
            expect(authService.refreshTokens).toHaveBeenCalledWith(dto);
        });
    });

    describe('forgotPassword', () => {
        it('should call authService.forgotPassword', async () => {
            const dto: ForgotPasswordDto = { email: 'test@example.com' };
            await controller.forgotPassword(dto);
            expect(authService.forgotPassword).toHaveBeenCalledWith(dto);
        });
    });

    describe('resetPassword', () => {
        it('should call authService.resetPassword', async () => {
            const dto: ResetPasswordDto = { token: 'token', newPassword: 'new-password' };
            await controller.resetPassword(dto);
            expect(authService.resetPassword).toHaveBeenCalledWith(dto);
        });
    });

    describe('logout', () => {
        it('should call authService.logout', async () => {
            const dto: RefreshTokenDto = { refreshToken: 'refresh-token' };
            await controller.logout(dto);
            expect(authService.logout).toHaveBeenCalledWith(dto.refreshToken);
        });
    });
});

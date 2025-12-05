import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { UserRepository } from '../repositories/user.repository';
import { PasswordService } from '../services/password.service';
import { TokenService } from '../services/token.service';
import { RegisterDto } from '../dtos/register.dto';
import { LoginDto } from '../dtos/login.dto';
import { User } from '../entities/user.entity';

describe('AuthService', () => {
    let service: AuthService;
    let userRepository: Partial<Record<keyof UserRepository, jest.Mock>>;
    let passwordService: Partial<Record<keyof PasswordService, jest.Mock>>;
    let tokenService: Partial<Record<keyof TokenService, jest.Mock>>;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let jwtService: Partial<Record<keyof JwtService, jest.Mock>>;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let configService: Partial<Record<keyof ConfigService, jest.Mock>>;

    beforeEach(async () => {
        userRepository = {
            findByEmail: jest.fn(),
            create: jest.fn(),
        };
        passwordService = {
            hash: jest.fn(),
            verify: jest.fn(),
        };
        tokenService = {
            generateTokens: jest.fn(),
            saveRefreshToken: jest.fn(),
        };
        jwtService = {};
        configService = {};

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: UserRepository, useValue: userRepository },
                { provide: PasswordService, useValue: passwordService },
                { provide: TokenService, useValue: tokenService },
                { provide: JwtService, useValue: jwtService },
                { provide: ConfigService, useValue: configService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('register', () => {
        it('should register a new user successfully', async () => {
            const registerDto: RegisterDto = {
                email: 'test@example.com',
                password: 'password123',
                firstName: 'John',
                lastName: 'Doe',
            };
            const hashedPassword = 'hashedPassword';
            const user = { id: 'uuid', ...registerDto, passwordHash: hashedPassword };
            const tokens = { accessToken: 'access', refreshToken: 'refresh' };

            userRepository.findByEmail.mockResolvedValue(null);
            passwordService.hash.mockResolvedValue(hashedPassword);
            userRepository.create.mockResolvedValue(user);
            tokenService.generateTokens.mockResolvedValue(tokens);
            tokenService.saveRefreshToken.mockResolvedValue(undefined);

            const result = await service.register(registerDto);

            expect(userRepository.findByEmail).toHaveBeenCalledWith(registerDto.email);
            expect(passwordService.hash).toHaveBeenCalledWith(registerDto.password);
            expect(userRepository.create).toHaveBeenCalledWith({
                ...registerDto,
                passwordHash: hashedPassword,
            });
            expect(tokenService.generateTokens).toHaveBeenCalledWith(user.id);
            expect(tokenService.saveRefreshToken).toHaveBeenCalledWith(user.id, tokens.refreshToken);
            expect(result).toEqual({
                user: {
                    id: 'uuid',
                    email: registerDto.email,
                    firstName: registerDto.firstName,
                    lastName: registerDto.lastName,
                    password: registerDto.password, // Original DTO prop, but sanitized user shouldn't have passwordHash
                },
                tokens,
            });
            // Manual verification of sanitize: remove passwordHash
            expect(result.user).not.toHaveProperty('passwordHash');
        });

        it('should throw ConflictException if email exists', async () => {
            const registerDto: RegisterDto = {
                email: 'test@example.com',
                password: 'password123',
                firstName: 'John',
                lastName: 'Doe',
            };
            userRepository.findByEmail.mockResolvedValue({ id: 'existing' });

            await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
        });
    });

    describe('login', () => {
        it('should login successfully with valid credentials', async () => {
            const loginDto: LoginDto = { email: 'test@example.com', password: 'password123' };
            const user = { id: 'uuid', email: loginDto.email, passwordHash: 'hashed' };
            const tokens = { accessToken: 'access', refreshToken: 'refresh' };

            userRepository.findByEmail.mockResolvedValue(user);
            passwordService.verify.mockResolvedValue(true);
            tokenService.generateTokens.mockResolvedValue(tokens);
            tokenService.saveRefreshToken.mockResolvedValue(undefined);

            const result = await service.login(loginDto);

            expect(userRepository.findByEmail).toHaveBeenCalledWith(loginDto.email);
            expect(passwordService.verify).toHaveBeenCalledWith(loginDto.password, user.passwordHash);
            expect(tokenService.generateTokens).toHaveBeenCalledWith(user.id);
            expect(result).toEqual({
                user: { id: 'uuid', email: loginDto.email }, // sanitized
                tokens,
            });
        });

        it('should throw UnauthorizedException for invalid user', async () => {
            userRepository.findByEmail.mockResolvedValue(null);
            await expect(service.login({ email: 'test@test.com', password: 'p' })).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException for invalid password', async () => {
            userRepository.findByEmail.mockResolvedValue({ id: 'u', passwordHash: 'h' });
            passwordService.verify.mockResolvedValue(false);
            await expect(service.login({ email: 'test@test.com', password: 'p' })).rejects.toThrow(UnauthorizedException);
        });
    });
});

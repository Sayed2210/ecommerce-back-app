import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { OAuthProvider } from './entities/oauth-provider.entity';
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';
import { PasswordService } from './services/password.service';
import { OAuthService } from './services/oauth.service';
import { AuthController } from './controllers/auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { UsersModule } from '../users/users.module';
import { UserRepository } from './repositories/user.repository';
import { HttpModule } from '@nestjs/axios';
import { MailerService } from '@/infrastructure/email/mailer.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, RefreshToken, OAuthProvider]),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: {
                    expiresIn: configService.get<string>('JWT_EXPIRES_IN'),
                },
            }),
        }),
        UsersModule,
        HttpModule,
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        TokenService,
        PasswordService,
        OAuthService,
        JwtStrategy,
        JwtRefreshStrategy,
        UserRepository,
        MailerService
    ],
    exports: [AuthService, TokenService, TypeOrmModule, JwtModule, PassportModule],
})
export class AuthModule { }
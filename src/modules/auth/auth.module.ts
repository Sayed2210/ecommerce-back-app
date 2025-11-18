import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { OAuthProvider } from './entities/oauth-provider.entity';


@Module({
    imports: [TypeOrmModule.forFeature([User, RefreshToken, OAuthProvider])],
    providers: [],
    exports: [TypeOrmModule],
})
export class AuthModule { }
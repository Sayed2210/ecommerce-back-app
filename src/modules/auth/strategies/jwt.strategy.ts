import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/services/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET'),
        });
    }

    async validate(payload: any) {
        console.log('JwtStrategy validating payload:', payload);
        try {
            const user = await this.usersService.findOne(payload.sub);
            console.log('JwtStrategy found user:', user ? user.id : 'null');
            if (!user) {
                console.log('JwtStrategy: User not found');
                throw new UnauthorizedException();
            }
            return user;
        } catch (error) {
            console.log('JwtStrategy error:', error);
            throw new UnauthorizedException();
        }
    }
}

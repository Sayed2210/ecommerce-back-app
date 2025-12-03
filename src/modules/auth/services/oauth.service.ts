import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { UserRepository } from '../repositories/user.repository';
import { TokenService } from './token.service';
import { OAuthProviderType } from '../entities';

@Injectable()
export class OAuthService {
    private readonly logger = new Logger(OAuthService.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
        private readonly userRepository: UserRepository,
        private readonly tokenService: TokenService,
    ) { }

    async validateGoogleToken(token: string) {
        try {
            const response = await firstValueFrom(
                this.httpService.get('https://oauth2.googleapis.com/tokeninfo', {
                    params: { id_token: token },
                }),
            );
            return response.data;
        } catch (error) {
            throw new Error('Invalid Google token');
        }
    }

    async validateFacebookToken(token: string) {
        try {
            const appId = this.configService.get('FACEBOOK_APP_ID');
            const response = await firstValueFrom(
                this.httpService.get(`https://graph.facebook.com/debug_token`, {
                    params: {
                        input_token: token,
                        access_token: `${appId}|${this.configService.get('FACEBOOK_APP_SECRET')}`,
                    },
                }),
            );
            return response.data;
        } catch (error) {
            throw new Error('Invalid Facebook token');
        }
    }

    async findOrCreateOAuthUser(profile: any, provider: string) {
        const email = profile.email;
        let user = await this.userRepository.findByEmail(email);
        if (!user) {
            user = await this.userRepository.create({
                email,
                firstName: profile.given_name || profile.first_name,
                lastName: profile.family_name || profile.last_name,
                avatar: profile.picture?.data?.url || profile.picture,
                isEmailVerified: true,
                oauthProviders: [{ provider: provider as OAuthProviderType, providerId: profile.sub || profile.id }],
            });
        }


        const tokens = await this.tokenService.generateTokens(user.id);
        await this.tokenService.saveRefreshToken(user.id, tokens.refreshToken);

        return { user, tokens };
    }
}
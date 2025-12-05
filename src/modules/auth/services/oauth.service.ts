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

    async getAuthorizationUrl(provider: string): Promise<string> {
        let authUrl = '';
        const redirectUri = `${this.configService.get('APP_URL')}/api/auth/oauth/${provider}/callback`;

        if (provider === 'google') {
            const clientId = this.configService.get('GOOGLE_CLIENT_ID');
            const scope = 'email profile';
            authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
        } else if (provider === 'facebook') {
            const clientId = this.configService.get('FACEBOOK_APP_ID');
            const scope = 'email';
            authUrl = `https://www.facebook.com/v12.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
        } else {
            throw new Error(`Unsupported provider: ${provider}`);
        }

        return authUrl;
    }

    async handleCallback(provider: string, code: string, state?: string) {
        const redirectUri = `${this.configService.get('APP_URL')}/api/auth/oauth/${provider}/callback`;
        let profile: any;

        if (provider === 'google') {
            const tokenResponse = await firstValueFrom(
                this.httpService.post('https://oauth2.googleapis.com/token', null, {
                    params: {
                        code,
                        client_id: this.configService.get('GOOGLE_CLIENT_ID'),
                        client_secret: this.configService.get('GOOGLE_CLIENT_SECRET'),
                        redirect_uri: redirectUri,
                        grant_type: 'authorization_code',
                    },
                }),
            );

            const { id_token, access_token } = tokenResponse.data;
            // Optionally verify id_token or use access_token to get profile
            const profileResponse = await firstValueFrom(
                this.httpService.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${access_token}` },
                }),
            );
            profile = profileResponse.data;

        } else if (provider === 'facebook') {
            const tokenResponse = await firstValueFrom(
                this.httpService.get('https://graph.facebook.com/v12.0/oauth/access_token', {
                    params: {
                        client_id: this.configService.get('FACEBOOK_APP_ID'),
                        client_secret: this.configService.get('FACEBOOK_APP_SECRET'),
                        redirect_uri: redirectUri,
                        code,
                    },
                }),
            );

            const { access_token } = tokenResponse.data;
            const profileResponse = await firstValueFrom(
                this.httpService.get('https://graph.facebook.com/me', {
                    params: {
                        fields: 'id,name,email,first_name,last_name,picture',
                        access_token,
                    },
                }),
            );
            profile = profileResponse.data;
        } else {
            throw new Error(`Unsupported provider: ${provider}`);
        }

        return this.findOrCreateOAuthUser(profile, provider); // Reuse existing logic
    }

    async validateGoogleToken(token: string) {
        // ... (skip unchanged)
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
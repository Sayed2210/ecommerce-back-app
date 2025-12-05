import {
    Controller,
    Get,
    Param,
    Query,
    Res,
    UseGuards
} from '@nestjs/common';
import { Response } from 'express';
import { OAuthService } from '../services/oauth.service';
import { OAuthGuard } from '../guards/oauth.guard';

/**
 * OAuth Authentication Controller
 * Handles OAuth flows for third-party authentication providers
 */
@Controller('oauth')
export class OAuthController {
    constructor(private readonly oauthService: OAuthService) { }

    /**
     * Initiate OAuth authentication flow
     */
    @Get(':provider')
    async initiateOAuth(
        @Param('provider') provider: string,
        @Res() res: Response
    ) {
        const authUrl = await this.oauthService.getAuthorizationUrl(provider);
        return res.redirect(authUrl);
    }

    /**
     * Handle OAuth callback from provider
     */
    @Get(':provider/callback')
    @UseGuards(OAuthGuard)
    async handleCallback(
        @Param('provider') provider: string,
        @Query('code') code: string,
        @Query('state') state: string,
        @Res() res: Response
    ) {
        const result = await this.oauthService.handleCallback(provider, code, state);

        // Redirect to frontend with tokens
        const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${result.tokens.accessToken}`;
        return res.redirect(redirectUrl);
    }
}

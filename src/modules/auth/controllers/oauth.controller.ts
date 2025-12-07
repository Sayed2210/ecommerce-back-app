import {
    Controller,
    Get,
    Param,
    Query,
    Res,
    UseGuards
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { OAuthService } from '../services/oauth.service';
import { OAuthGuard } from '../guards/oauth.guard';

/**
 * OAuth Authentication Controller
 * Handles OAuth flows for third-party authentication providers
 */
@ApiTags('OAuth Authentication')
@Controller('oauth')
export class OAuthController {
    constructor(private readonly oauthService: OAuthService) { }

    /**
     * Initiate OAuth authentication flow
     */
    @Get(':provider')
    @ApiOperation({
        summary: 'Initiate OAuth flow',
        description: 'Redirect to OAuth provider for authentication (supports: google, facebook, github)'
    })
    @ApiParam({
        name: 'provider',
        description: 'OAuth provider name',
        example: 'google',
        enum: ['google', 'facebook', 'github']
    })
    @ApiResponse({ status: 302, description: 'Redirect to OAuth provider' })
    @ApiResponse({ status: 400, description: 'Invalid provider' })
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
    @ApiOperation({
        summary: 'OAuth callback',
        description: 'Handle OAuth provider callback and exchange code for tokens'
    })
    @ApiParam({
        name: 'provider',
        description: 'OAuth provider name',
        example: 'google'
    })
    @ApiQuery({
        name: 'code',
        description: 'Authorization code from OAuth provider',
        required: true
    })
    @ApiQuery({
        name: 'state',
        description: 'State parameter for CSRF protection',
        required: true
    })
    @ApiResponse({ status: 302, description: 'Redirect to frontend with access token' })
    @ApiResponse({ status: 400, description: 'Invalid authorization code or state' })
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

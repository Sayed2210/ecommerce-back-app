import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { NewsletterService } from '../services/newsletter.service';
import { SendCampaignDto, SubscribeDto } from '../dtos/subscribe.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@modules/auth/entities/user.entity';

@ApiTags('Newsletter')
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe to newsletter' })
  subscribe(@Body() dto: SubscribeDto) {
    return this.newsletterService.subscribe(dto);
  }

  @Post('unsubscribe')
  @ApiOperation({ summary: 'Unsubscribe from newsletter' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { email: { type: 'string', example: 'user@example.com' } },
      required: ['email'],
    },
  })
  unsubscribe(@Body('email') email: string) {
    return this.newsletterService.unsubscribeByEmail(email);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get subscriber count (Admin)' })
  async stats() {
    const count = await this.newsletterService.getSubscriberCount();
    return { activeSubscribers: count };
  }

  @Post('send')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Send newsletter campaign to all subscribers (Admin)',
  })
  sendCampaign(@Body() dto: SendCampaignDto) {
    return this.newsletterService.sendCampaign(dto);
  }
}

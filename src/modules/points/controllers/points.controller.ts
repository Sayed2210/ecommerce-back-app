import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PointsService } from '../services/points.service';
import { RedeemPointsDto } from '../dtos/redeem-points.dto';

@ApiTags('Points')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('points')
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get current points balance' })
  getBalance(@Request() req) {
    return this.pointsService.getBalance(req.user.id);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get points transaction history' })
  getTransactions(@Request() req) {
    return this.pointsService.getTransactions(req.user.id);
  }

  @Post('redeem')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redeem points' })
  redeem(@Request() req, @Body() dto: RedeemPointsDto) {
    return this.pointsService.redeemPoints(req.user.id, dto);
  }
}

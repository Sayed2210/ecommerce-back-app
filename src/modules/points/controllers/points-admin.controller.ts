import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';
import { PointsAdminService } from '../services/points-admin.service';
import { CreatePointRuleDto } from '../dtos/create-point-rule.dto';
import { UpdatePointRuleDto } from '../dtos/update-point-rule.dto';
import { CreateRedemptionDto } from '../dtos/create-redemption.dto';
import { UpdateRedemptionDto } from '../dtos/update-redemption.dto';
import { PaginationDto } from '@common/dtos/pagination.dto';

@ApiTags('Points Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/points')
export class PointsAdminController {
  constructor(private readonly pointsAdminService: PointsAdminService) {}

  // Rules
  @Post('rules')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create point rule (Admin)' })
  createRule(@Body() dto: CreatePointRuleDto) {
    return this.pointsAdminService.createRule(dto);
  }

  @Get('rules')
  @ApiOperation({ summary: 'List all point rules' })
  findAllRules(@Query() pagination: PaginationDto) {
    return this.pointsAdminService.findAllRules(pagination);
  }

  @Get('rules/:id')
  @ApiOperation({ summary: 'Get point rule by ID' })
  findRule(@Param('id', ParseUUIDPipe) id: string) {
    return this.pointsAdminService.findRuleById(id);
  }

  @Patch('rules/:id')
  @ApiOperation({ summary: 'Update point rule (Admin)' })
  updateRule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePointRuleDto,
  ) {
    return this.pointsAdminService.updateRule(id, dto);
  }

  @Delete('rules/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete point rule (Admin)' })
  removeRule(@Param('id', ParseUUIDPipe) id: string) {
    return this.pointsAdminService.removeRule(id);
  }

  // Redemptions
  @Post('redemptions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create redemption (Admin)' })
  createRedemption(@Body() dto: CreateRedemptionDto) {
    return this.pointsAdminService.createRedemption(dto);
  }

  @Get('redemptions')
  @ApiOperation({ summary: 'List all redemptions' })
  findAllRedemptions(@Query() pagination: PaginationDto) {
    return this.pointsAdminService.findAllRedemptions(pagination);
  }

  @Get('redemptions/:id')
  @ApiOperation({ summary: 'Get redemption by ID' })
  findRedemption(@Param('id', ParseUUIDPipe) id: string) {
    return this.pointsAdminService.findRedemptionById(id);
  }

  @Patch('redemptions/:id')
  @ApiOperation({ summary: 'Update redemption (Admin)' })
  updateRedemption(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRedemptionDto,
  ) {
    return this.pointsAdminService.updateRedemption(id, dto);
  }

  @Delete('redemptions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete redemption (Admin)' })
  removeRedemption(@Param('id', ParseUUIDPipe) id: string) {
    return this.pointsAdminService.removeRedemption(id);
  }
}

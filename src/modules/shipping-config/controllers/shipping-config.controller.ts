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
import { ShippingConfigService } from '../services/shipping-config.service';
import { CreateShippingZoneDto } from '../dtos/create-shipping-zone.dto';
import { UpdateShippingZoneDto } from '../dtos/update-shipping-zone.dto';
import { CreateShippingRateDto } from '../dtos/create-shipping-rate.dto';
import { UpdateShippingRateDto } from '../dtos/update-shipping-rate.dto';
import { PaginationDto } from '@common/dtos/pagination.dto';

@ApiTags('Shipping Config')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('shipping-config')
export class ShippingConfigController {
  constructor(private readonly shippingConfigService: ShippingConfigService) {}

  // Zones
  @Post('zones')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create shipping zone (Admin)' })
  createZone(@Body() dto: CreateShippingZoneDto) {
    return this.shippingConfigService.createZone(dto);
  }

  @Get('zones')
  @ApiOperation({ summary: 'List all shipping zones' })
  findAllZones(@Query() pagination: PaginationDto) {
    return this.shippingConfigService.findAllZones(pagination);
  }

  @Get('zones/:id')
  @ApiOperation({ summary: 'Get shipping zone by ID' })
  findZone(@Param('id', ParseUUIDPipe) id: string) {
    return this.shippingConfigService.findZoneById(id);
  }

  @Patch('zones/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update shipping zone (Admin)' })
  updateZone(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShippingZoneDto,
  ) {
    return this.shippingConfigService.updateZone(id, dto);
  }

  @Delete('zones/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete shipping zone (Admin)' })
  removeZone(@Param('id', ParseUUIDPipe) id: string) {
    return this.shippingConfigService.removeZone(id);
  }

  // Rates
  @Post('rates')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create shipping rate (Admin)' })
  createRate(@Body() dto: CreateShippingRateDto) {
    return this.shippingConfigService.createRate(dto);
  }

  @Patch('rates/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update shipping rate (Admin)' })
  updateRate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShippingRateDto,
  ) {
    return this.shippingConfigService.updateRate(id, dto);
  }

  @Delete('rates/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete shipping rate (Admin)' })
  removeRate(@Param('id', ParseUUIDPipe) id: string) {
    return this.shippingConfigService.removeRate(id);
  }
}

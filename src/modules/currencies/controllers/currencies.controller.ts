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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';
import { CurrenciesService } from '../services/currencies.service';
import { CreateCurrencyDto } from '../dtos/create-currency.dto';
import { UpdateCurrencyDto } from '../dtos/update-currency.dto';
import { PaginationDto } from '@common/dtos/pagination.dto';

@ApiTags('Currencies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('currencies')
export class CurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create currency (Admin)' })
  create(@Body() dto: CreateCurrencyDto) {
    return this.currenciesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all currencies' })
  findAll(@Query() pagination: PaginationDto) {
    return this.currenciesService.findAll(pagination);
  }

  @Get('active')
  @ApiOperation({ summary: 'List active currencies' })
  findActive() {
    return this.currenciesService.findActive();
  }

  @Get('default')
  @ApiOperation({ summary: 'Get default currency' })
  findDefault() {
    return this.currenciesService.findDefault();
  }

  @Get(':code')
  @ApiOperation({ summary: 'Get currency by code' })
  findOne(@Param('code') code: string) {
    return this.currenciesService.findOne(code.toUpperCase());
  }

  @Patch(':code')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update currency (Admin)' })
  update(@Param('code') code: string, @Body() dto: UpdateCurrencyDto) {
    return this.currenciesService.update(code.toUpperCase(), dto);
  }

  @Delete(':code')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete currency (Admin)' })
  remove(@Param('code') code: string) {
    return this.currenciesService.remove(code.toUpperCase());
  }
}

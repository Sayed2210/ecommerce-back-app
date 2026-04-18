import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReturnsService } from '../services/returns.service';
import { CreateReturnDto } from '../dtos/create-return.dto';
import { ProcessReturnDto } from '../dtos/process-return.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@modules/auth/entities/user.entity';
import { EmailVerifiedGuard } from '@common/guards/email-verified.guard';
import { PaginationDto } from '@common/dtos/pagination.dto';

@ApiTags('Returns')
@ApiBearerAuth()
@Controller('returns')
@UseGuards(JwtAuthGuard, EmailVerifiedGuard)
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit return request' })
  create(@Request() req, @Body() dto: CreateReturnDto) {
    return this.returnsService.create(req.user.id, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'List own return requests' })
  findMy(@Request() req, @Query() pagination: PaginationDto) {
    return this.returnsService.findAllForUser(req.user.id, pagination);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all return requests (Admin)' })
  findAll(@Query() pagination: PaginationDto) {
    return this.returnsService.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get return request details' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.returnsService.findOne(id, req.user.id);
  }

  @Patch(':id/process')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve or reject return (Admin)' })
  process(@Param('id') id: string, @Body() dto: ProcessReturnDto) {
    return this.returnsService.process(id, dto);
  }
}

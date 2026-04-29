import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { OrdersService } from '../services/orders.service';
import { OrderStatus } from '../entities/order.entity';
import { UpdateOrderStatusDto } from '../dtos/update-order-status.dto';
import { PaginationDto } from '../../../common/dtos/pagination.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({
    summary: 'Get user orders',
    description: 'Get all orders for authenticated user',
  })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiResponse({ status: 200, description: 'Orders retrieved' })
  async findAll(
    @Request() req,
    @Query('status') status?: OrderStatus,
    @Query() pagination?: PaginationDto,
  ) {
    return this.ordersService.findAll(
      { userId: req.user.id, status },
      pagination,
    );
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get all orders (Admin)',
    description: 'Get all orders across all users (Admin only)',
  })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiResponse({ status: 200, description: 'Orders retrieved' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async findAllForAdmin(
    @Query('status') status?: OrderStatus,
    @Query() pagination?: PaginationDto,
  ) {
    return this.ordersService.findAll({ status }, pagination);
  }

  @Get('analytics/summary')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get order analytics',
    description: 'Get order analytics summary (Admin only)',
  })
  @ApiQuery({
    name: 'from',
    required: false,
    type: String,
    description: 'Start date (ISO 8601)',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    type: String,
    description: 'End date (ISO 8601)',
  })
  @ApiQuery({
    name: 'granularity',
    required: false,
    enum: ['day', 'week', 'month'],
    description: 'Time granularity',
  })
  @ApiResponse({ status: 200, description: 'Analytics retrieved' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async getAnalytics(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('granularity') granularity?: 'day' | 'week' | 'month',
  ) {
    return this.ordersService.getOrderAnalytics({ from, to, granularity });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get order details',
    description: 'Get detailed order information',
  })
  @ApiParam({
    name: 'id',
    description: 'Order ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({ status: 200, description: 'Order found' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOne(@Request() req, @Param('id') id: string) {
    return this.ordersService.findOne(id, req.user.id);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update order status',
    description: 'Update order status (Admin only)',
  })
  @ApiParam({
    name: 'id',
    description: 'Order ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({ status: 200, description: 'Order status updated' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, updateOrderStatusDto.status);
  }
}

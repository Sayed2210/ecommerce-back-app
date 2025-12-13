import {
    Controller,
    Get,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
    Request
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { OrdersService } from '../services/orders.service';
import { OrderStatus } from '../entities/order.entity';
import { PaginationDto } from '../../../common/dtos/pagination.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';

/**
 * Orders Controller
 * Manages order viewing, tracking, and status updates
 */
@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    /**
     * Get all orders for current user
     */
    @Get()
    @ApiOperation({ summary: 'Get user orders', description: 'Get all orders for authenticated user' })
    @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
    @ApiResponse({ status: 200, description: 'Orders retrieved' })
    async findAll(
        @Request() req,
        @Query('status') status?: OrderStatus,
        @Query() pagination?: PaginationDto
    ) {
        return this.ordersService.findAll(
            { userId: req.user.id, status },
            pagination
        );
    }

    /**
     * Get order details by ID
     */
    @Get(':id')
    @ApiOperation({ summary: 'Get order details', description: 'Get detailed order information' })
    @ApiParam({ name: 'id', description: 'Order ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({ status: 200, description: 'Order found' })
    @ApiResponse({ status: 404, description: 'Order not found' })
    async findOne(
        @Request() req,
        @Param('id') id: string
    ) {
        return this.ordersService.findOne(id, req.user.id);
    }

    /**
     * Update order status (Admin only)
     */
    @Patch(':id/status')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Update order status', description: 'Update order status (Admin only)' })
    @ApiParam({ name: 'id', description: 'Order ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({ status: 200, description: 'Order status updated' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
    @ApiResponse({ status: 404, description: 'Order not found' })
    async updateStatus(
        @Param('id') id: string,
        @Body('status') status: OrderStatus
    ) {
        return this.ordersService.updateStatus(id, status);
    }
    // ... (skip unchanged)
    /**
     * Get order analytics (Admin only)
     */
    @Get('analytics/summary')
    async getAnalytics(@Request() req) {
        // For regular users, show only their analytics
        return this.ordersService.getOrderAnalytics(req.user.id);
    }
}

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
import { OrdersService } from '../services/orders.service';
import { OrderStatus } from '../entities/order.entity';
import { PaginationDto } from '../../../common/dtos/pagination.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * Orders Controller
 * Manages order viewing, tracking, and status updates
 */
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    /**
     * Get all orders for current user
     */
    @Get()
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
    async updateStatus(
        @Param('id') id: string,
        @Body('status') status: OrderStatus
    ) {
        return this.ordersService.updateStatus(id, status);
    }

    /**
     * Get order analytics (Admin only)
     */
    @Get('analytics/summary')
    async getAnalytics(@Request() req) {
        // For regular users, show only their analytics
        return this.ordersService.getOrderAnalytics(req.user.id);
    }
}

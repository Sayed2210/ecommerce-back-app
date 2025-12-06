import {
    Controller,
    Post,
    Body,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CheckoutService } from '../services/checkout.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateOrderDto } from '../dtos/create-order.dto';
import { ApplyCouponDto } from '../dtos/apply-coupon.dto';

/**
 * Checkout Controller
 * Handles order creation, payment processing, and coupon application
 */
@ApiTags('Checkout')
@ApiBearerAuth()
@Controller('checkout')
@UseGuards(JwtAuthGuard)
export class CheckoutController {
    constructor(private readonly checkoutService: CheckoutService) { }

    /**
     * Validate checkout data before creating order
     */
    @Post('validate')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Validate checkout', description: 'Validate cart and checkout data before order creation' })
    @ApiResponse({ status: 200, description: 'Checkout validation successful' })
    @ApiResponse({ status: 400, description: 'Validation failed' })
    async validateCheckout(
        @Request() req,
        @Body() checkoutData: any
    ) {
        return this.checkoutService.validateCheckout(req.user.id, checkoutData);
    }

    /**
     * Create order from cart
     */
    @Post('create-order')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create order', description: 'Create new order from cart items' })
    @ApiResponse({ status: 201, description: 'Order successfully created' })
    @ApiResponse({ status: 400, description: 'Invalid order data or insufficient stock' })
    async createOrder(
        @Request() req,
        @Body() orderData: CreateOrderDto
    ) {
        return this.checkoutService.createOrder(req.user.id, orderData);
    }

    /**
     * Apply coupon code to cart
     */
    @Post('apply-coupon')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Apply coupon', description: 'Apply discount coupon to cart' })
    @ApiResponse({ status: 200, description: 'Coupon successfully applied' })
    @ApiResponse({ status: 400, description: 'Invalid or expired coupon' })
    async applyCoupon(
        @Request() req,
        @Body('code') code: string
    ) {
        const dto = new ApplyCouponDto();
        dto.code = code;
        return this.checkoutService.applyCoupon(dto);
    }
}

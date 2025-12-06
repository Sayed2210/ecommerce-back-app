import {
    Controller,
    Post,
    Body,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus
} from '@nestjs/common';
import { CheckoutService } from '../services/checkout.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateOrderDto } from '../dtos/create-order.dto';
import { ApplyCouponDto } from '../dtos/apply-coupon.dto';

/**
 * Checkout Controller
 * Handles order creation, payment processing, and coupon application
 */
@Controller('checkout')
@UseGuards(JwtAuthGuard)
export class CheckoutController {
    constructor(private readonly checkoutService: CheckoutService) { }

    /**
     * Validate checkout data before creating order
     */
    @Post('validate')
    @HttpCode(HttpStatus.OK)
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
    async applyCoupon(
        @Request() req,
        @Body('code') code: string
    ) {
        const dto = new ApplyCouponDto();
        dto.code = code;
        return this.checkoutService.applyCoupon(dto);
    }
}

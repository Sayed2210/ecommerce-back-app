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
        return this.checkoutService.validate(req.user.id, checkoutData);
    }

    /**
     * Create order from cart
     */
    @Post('create-order')
    @HttpCode(HttpStatus.CREATED)
    async createOrder(
        @Request() req,
        @Body() orderData: any
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
        return this.checkoutService.applyCoupon(req.user.id, code);
    }
}

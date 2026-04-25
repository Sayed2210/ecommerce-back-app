import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Headers,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RawBodyRequest } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { CheckoutService } from '../services/checkout.service';
import { PaymentService } from '../services/payment.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { EmailVerifiedGuard } from '../../../common/guards/email-verified.guard';
import { CreateOrderDto } from '../dtos/create-order.dto';

/**
 * Checkout Controller
 * Handles order creation, payment processing, and coupon application.
 * The Stripe webhook endpoint is public (no JWT) and requires the raw body.
 */
@ApiTags('Checkout')
@Controller('checkout')
export class CheckoutController {
  constructor(
    private readonly checkoutService: CheckoutService,
    private readonly paymentService: PaymentService,
  ) {}

  /**
   * Stripe webhook — must be public and receive raw body for signature verification.
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook receiver' })
  async stripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.paymentService.handleWebhook(signature, req.rawBody);
  }

  /**
   * Validate checkout data before creating order
   */
  @Post('validate')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate checkout',
    description: 'Validate cart and checkout data before order creation',
  })
  @ApiResponse({ status: 200, description: 'Checkout validation successful' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async validateCheckout(@Request() req, @Body() checkoutData: any) {
    return this.checkoutService.validateCheckout(req.user.id, checkoutData);
  }

  /**
   * Create order from cart
   */
  @Post('create-order')
  @UseGuards(ThrottlerGuard, JwtAuthGuard, EmailVerifiedGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create order',
    description: 'Create new order from cart items',
  })
  @ApiResponse({ status: 201, description: 'Order successfully created' })
  @ApiResponse({
    status: 400,
    description: 'Invalid order data or insufficient stock',
  })
  async createOrder(@Request() req, @Body() orderData: CreateOrderDto) {
    return this.checkoutService.createOrder(req.user.id, orderData);
  }

  /**
   * Apply coupon code to cart
   */
  @Post('apply-coupon')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Apply coupon',
    description: 'Apply discount coupon to cart',
  })
  @ApiResponse({ status: 200, description: 'Coupon successfully applied' })
  @ApiResponse({ status: 400, description: 'Invalid or expired coupon' })
  async applyCoupon(@Request() req, @Body('code') code: string) {
    return this.checkoutService.applyCoupon({ code, userId: req.user.id } as any);
  }
}

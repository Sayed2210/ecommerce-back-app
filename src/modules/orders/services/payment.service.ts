import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentGateway } from '../entities/payment.entity';
import { Order, OrderStatus, PaymentStatus } from '../entities/order.entity';
import { WebhookEvent } from '../entities/webhook-event.entity';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(WebhookEvent)
    private readonly webhookEventRepository: Repository<WebhookEvent>,
  ) {
    this.stripe = new Stripe(configService.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2023-10-16' as any,
    });
  }

  async createPaymentIntent(
    orderId: string,
    amount: number,
    paymentToken?: string,
  ) {
    try {
      const order = await this.orderRepository.findOne({
        where: { id: orderId },
      });
      if (!order) {
        throw new BadRequestException('Order not found');
      }

      // Create Stripe payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        metadata: { orderId },
        payment_method: paymentToken,
        confirm: !!paymentToken,
      });

      // Save payment record
      const payment = this.paymentRepository.create({
        order: { id: orderId },
        amount,
        currency: 'usd',
        gateway: PaymentGateway.STRIPE,
        paymentIntentId: paymentIntent.id,
        // status: paymentIntent.status, // Payment entity doesn't seem to have status column based on view_file output!
        metadata: paymentIntent,
      });
      // Wait, Payment entity DOES NOT have status column in the view_file output.
      // It has paymentIntentId, amount, currency, gateway, metadata.
      // I should remove status from here.

      await this.paymentRepository.save(payment);

      // Update order status based on payment
      if (paymentIntent.status === 'succeeded') {
        await this.orderRepository.update(orderId, {
          status: OrderStatus.PROCESSING,
        });
      }

      this.logger.log(
        `Payment intent created for order ${orderId}: ${paymentIntent.id}`,
      );

      return {
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status,
      };
    } catch (error) {
      this.logger.error('Payment creation failed:', error);
      throw new BadRequestException('Payment failed: ' + error.message);
    }
  }

  async handleWebhook(signature: string, payload: Buffer) {
    const endpointSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');

    // Step 1: Verify signature — return 400 on failure so Stripe knows it's invalid
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        endpointSecret,
      );
    } catch (error) {
      this.logger.error(
        'Webhook signature verification failed:',
        error.message,
      );
      throw new BadRequestException(
        `Webhook signature invalid: ${error.message}`,
      );
    }

    // Step 2: Check for duplicate event (idempotency)
    const existingEvent = await this.webhookEventRepository.findOne({
      where: { eventId: event.id },
    });
    if (existingEvent) {
      this.logger.log(`Duplicate webhook event: ${event.id}`);
      return { received: true, duplicate: true };
    }

    // Save event before processing
    await this.webhookEventRepository.save({
      eventId: event.id,
      eventType: event.type,
      payload: event.data.object as any,
    });

    // Step 3: Process event — log errors but always return 200 to prevent Stripe retries
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handleSuccessfulPayment(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handleFailedPayment(event.data.object);
          break;
        case 'payment_intent.canceled':
          await this.handleCanceledPayment(event.data.object);
          break;
        default:
          this.logger.log(`Unhandled webhook event type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(`Error processing webhook event ${event.type}:`, error);
      // Still return 200 — processing bugs should not trigger Stripe retries
    }

    return { received: true };
  }

  private async handleSuccessfulPayment(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata?.orderId;
    if (!orderId) {
      this.logger.warn(
        `payment_intent.succeeded missing orderId in metadata: ${paymentIntent.id}`,
      );
      return;
    }

    await this.orderRepository.update(orderId, {
      status: OrderStatus.PROCESSING,
      paymentStatus: PaymentStatus.PAID,
      paymentIntentId: paymentIntent.id,
    });

    this.logger.log(`Payment succeeded for order ${orderId}`);
  }

  private async handleFailedPayment(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata?.orderId;
    if (!orderId) {
      this.logger.warn(
        `payment_intent.payment_failed missing orderId in metadata: ${paymentIntent.id}`,
      );
      return;
    }

    await this.orderRepository.update(orderId, {
      paymentStatus: PaymentStatus.FAILED,
    });

    this.logger.warn(`Payment failed for order ${orderId}`);
  }

  private async handleCanceledPayment(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata?.orderId;
    if (!orderId) {
      this.logger.warn(
        `payment_intent.canceled missing orderId in metadata: ${paymentIntent.id}`,
      );
      return;
    }

    await this.orderRepository.update(orderId, {
      status: OrderStatus.CANCELLED,
      paymentStatus: PaymentStatus.FAILED,
    });

    this.logger.log(`Payment canceled for order ${orderId}`);
  }
}

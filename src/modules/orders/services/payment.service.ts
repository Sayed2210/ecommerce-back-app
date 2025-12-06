import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentGateway } from '../entities/payment.entity';
import { Order, OrderStatus, PaymentStatus } from '../entities/order.entity';

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
    ) {
        this.stripe = new Stripe(configService.get('STRIPE_SECRET_KEY'), {
            apiVersion: '2023-10-16' as any,
        });
    }

    async createPaymentIntent(orderId: string, amount: number, paymentToken?: string) {
        try {
            const order = await this.orderRepository.findOne({ where: { id: orderId } });
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

            this.logger.log(`Payment intent created for order ${orderId}: ${paymentIntent.id}`);

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

        try {
            const event = this.stripe.webhooks.constructEvent(
                payload,
                signature,
                endpointSecret
            );

            switch (event.type) {
                case 'payment_intent.succeeded':
                    await this.handleSuccessfulPayment(event.data.object);
                    break;
                case 'payment_intent.payment_failed':
                    await this.handleFailedPayment(event.data.object);
                    break;
                default:
                    this.logger.log(`Unhandled event type: ${event.type}`);
            }

            return { received: true };
        } catch (error) {
            this.logger.error('Webhook error:', error);
            throw new BadRequestException(`Webhook error: ${error.message}`);
        }
    }

    private async handleSuccessfulPayment(paymentIntent: Stripe.PaymentIntent) {
        const orderId = paymentIntent.metadata.orderId;

        // Payment entity has no status column, so we skip updating it.
        // Or if I missed it in view_file, let me double check. 
        // Logic: The view_file output for Payment entity definitely did NOT show a status column.
        // It showed paymentIntentId, amount, currency, gateway, metadata.
        // So I will remove the paymentRepository.update calls that try to update status.
        // Just update order status.

        await this.orderRepository.update(orderId, {
            status: OrderStatus.PROCESSING,
            paymentStatus: PaymentStatus.PAID,
        });

        this.logger.log(`Payment succeeded for order ${orderId}`);
    }

    private async handleFailedPayment(paymentIntent: Stripe.PaymentIntent) {
        const orderId = paymentIntent.metadata.orderId;

        // No payment status to update
        // await this.paymentRepository.update(
        //     { paymentIntentId: paymentIntent.id },
        //     { status: 'failed' }
        // );

        await this.orderRepository.update(orderId, {
            status: OrderStatus.CANCELLED,
            paymentStatus: PaymentStatus.FAILED,
        });

        this.logger.error(`Payment failed for order ${orderId}`);
    }
}
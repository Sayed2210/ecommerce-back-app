import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailerService } from '@infrastructure/email/mailer.service';
import { CartRepository } from '../repositories/cart.repository';
import { differenceInHours, subHours } from 'date-fns';
import { MoreThan } from 'typeorm';
import { OrderRepository } from '@modules/orders/repositories/order.repository';

@Processor('abandoned-cart')
export class AbandonedCartProcessor extends WorkerHost {
    constructor(
        private mailerService: MailerService,
        private cartRepository: CartRepository,
        private orderRepository: OrderRepository,
    ) {
        super();
    }

    async process(job: Job<{ cartId: string }, any, string>): Promise<any> {
        // Handle different job types
        switch (job.name) {
            case 'send-reminder':
                return this.handleAbandonedCart(job);
            case 'abandoned-cart-followup':
                return this.handleFollowUp(job);
            default:
                throw new Error(`Unknown job type: ${job.name}`);
        }
    }

    async handleAbandonedCart(job: Job<{ cartId: string }>) {
        const cart = await this.cartRepository.findOneWithOptions({
            where: { id: job.data.cartId },
            relations: ['user', 'items', 'items.product'],
        });

        if (!cart || cart.items.length === 0) return;

        // Check if cart was modified in last 24 hours
        const hoursSinceUpdate = differenceInHours(new Date(), cart.updatedAt);
        if (hoursSinceUpdate < 24) return;

        // Check if user has completed an order since
        const recentOrder = await this.orderRepository.findOneWithOptions({
            where: {
                user: { id: cart.user.id },
                createdAt: MoreThan(subHours(new Date(), 24)),
            },
        });

        if (recentOrder) return;

        // Send reminder email
        await this.mailerService.sendAbandonedCartReminder(cart.user.email, {
            name: cart.user.firstName,
            cartItems: cart.items,
            cartTotal: cart.subtotal,
            recoveryUrl: `${process.env.FRONTEND_URL}/cart?recovery=${cart.id}`,
        });

        return { status: 'sent', cartId: cart.id };
    }

    async handleFollowUp(job: Job<{ cartId: string }>) {
        // Implementation for follow-up email
        const cart = await this.cartRepository.findOneWithOptions({
            where: { id: job.data.cartId },
            relations: ['user', 'items', 'items.product'],
        });

        if (!cart || cart.items.length === 0) return;

        // Check if user completed order
        const recentOrder = await this.orderRepository.findOneWithOptions({
            where: {
                user: { id: cart.user.id },
                createdAt: MoreThan(subHours(new Date(), 48)),
            },
        });

        if (recentOrder) return;

        // Send follow-up email with discount
        await this.mailerService.sendAbandonedCartFollowUp(cart.user.email, {
            userName: cart.user.firstName,
            cartItems: cart.items,
            cartTotal: cart.subtotal,
            discountCode: 'COMEBACK10', // 10% discount
            recoveryLink: `${process.env.FRONTEND_URL}/cart?recovery=${cart.id}`,
        });

        return { status: 'follow-up-sent', cartId: cart.id };
    }
}
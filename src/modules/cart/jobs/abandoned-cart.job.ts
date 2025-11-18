import { Processor, Process } from '@nestjs/bullmq';
// import { Job } from 'bull';
// import { MailerService } from '../../mailer/mailer.service';

@Processor('abandoned-cart')
export class AbandonedCartProcessor {
    constructor(
        private mailerService: MailerService,
        private cartRepository: CartRepository,
    ) { }

    @Process('send-reminder')
    async handleAbandonedCart(job: Job<{ cartId: string }>) {
        const cart = await this.cartRepository.findOne({
            where: { id: job.data.cartId },
            relations: ['user', 'items', 'items.product'],
        });

        if (!cart || cart.items.length === 0) return;

        // Check if cart was modified in last 24 hours
        const hoursSinceUpdate = differenceInHours(new Date(), cart.updatedAt);
        if (hoursSinceUpdate < 24) return;

        // Check if user has completed an order since
        const recentOrder = await this.orderRepository.findOne({
            where: {
                user: { id: cart.user.id },
                createdAt: MoreThan(subHours(new Date(), 24)),
            },
        });

        if (recentOrder) return;

        // Send reminder email
        await this.mailerService.sendAbandonedCartEmail(cart.user.email, {
            userName: cart.user.firstName,
            cartItems: cart.items,
            cartTotal: cart.subtotal,
            recoveryLink: `${process.env.FRONTEND_URL}/cart?recovery=${cart.id}`,
        });

        // Schedule follow-up in 48 hours if still abandoned
        await this.mailerService.addJob('abandoned-cart-followup', {
            cartId: cart.id,
            delay: 48 * 60 * 60 * 1000,
        });
    }
}
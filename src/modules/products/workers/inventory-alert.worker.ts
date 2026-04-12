import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BullmqService } from '@infrastructure/queue/bullmq.service';
import { MailerService } from '@infrastructure/email/mailer.service';
import { ProductVariant } from '../entities/product-variant.entity';

@Injectable()
export class InventoryAlertWorker implements OnModuleInit {
    private readonly logger = new Logger(InventoryAlertWorker.name);

    constructor(
        private readonly bullmqService: BullmqService,
        private readonly mailerService: MailerService,
        @InjectRepository(ProductVariant)
        private readonly variantRepository: Repository<ProductVariant>,
    ) {}

    onModuleInit() {
        this.bullmqService.createNotificationWorker(async (job) => {
            if (job.name !== 'low-stock-alert') return;

            const { variantId, currentStock, threshold } = job.data;

            const variant = await this.variantRepository.findOne({
                where: { id: variantId },
                relations: ['product'],
            });

            if (!variant) return;

            const adminEmail = process.env.ADMIN_EMAIL;
            if (!adminEmail) {
                this.logger.warn('ADMIN_EMAIL not set — skipping low-stock alert');
                return;
            }

            const productName =
                (variant.product?.name as any)?.en ??
                JSON.stringify(variant.product?.name) ??
                'Unknown product';

            await this.mailerService.sendEmail({
                to: adminEmail,
                subject: `Low Stock Alert: ${variant.sku ?? productName}`,
                template: 'low-stock-alert',
                data: {
                    productName,
                    sku: variant.sku ?? 'N/A',
                    currentStock,
                    threshold,
                    variantId,
                },
            });

            this.logger.warn(
                `Low-stock alert sent for variant ${variantId} (stock: ${currentStock}/${threshold})`,
            );
        });
    }
}

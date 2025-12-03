import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ProductVariant } from '../entities/product-variant.entity';
import { InventoryLog } from '../entities/inventory-log.entity';
import { QueueService } from '../../../infrastructure/queue/bullmq.service';

@Injectable()
export class InventoryService {
    private readonly logger = new Logger(InventoryService.name);

    constructor(
        @InjectRepository(ProductVariant)
        private readonly variantRepository: Repository<ProductVariant>,
        @InjectRepository(InventoryLog)
        private readonly inventoryLogRepository: Repository<InventoryLog>,
        private readonly dataSource: DataSource,
        private readonly queueService: QueueService,
    ) { }

    async getInventory(variantId: string) {
        return this.variantRepository.findOne({
            where: { id: variantId },
            select: ['id', 'sku', 'quantity', 'reservedQuantity', 'lowStockThreshold'],
        });
    }

    async adjustInventory(variantId: string, quantity: number, reason: string, userId?: string) {
        return this.dataSource.transaction(async (manager) => {
            const variant = await manager.findOne(ProductVariant, {
                where: { id: variantId },
                lock: { mode: 'pessimistic_write' },
            });

            if (!variant) {
                throw new BadRequestException('Product variant not found');
            }

            const oldQuantity = variant.quantity;
            variant.quantity += quantity;

            if (variant.quantity < 0) {
                throw new BadRequestException('Insufficient inventory');
            }

            await manager.save(variant);

            // Create log entry
            const log = this.inventoryLogRepository.create({
                variant: { id: variantId },
                oldQuantity,
                newQuantity: variant.quantity,
                quantityChange: quantity,
                reason,
                user: userId ? { id: userId } : null,
            });
            await manager.save(log);

            // Check low stock
            if (variant.quantity <= variant.lowStockThreshold) {
                await this.queueService.addJob('low-stock-alert', {
                    variantId,
                    currentStock: variant.quantity,
                    threshold: variant.lowStockThreshold,
                });
            }

            return variant;
        });
    }

    async reserveInventory(variantId: string, quantity: number) {
        return this.dataSource.transaction(async (manager) => {
            const variant = await manager.findOne(ProductVariant, {
                where: { id: variantId },
                lock: { mode: 'pessimistic_write' },
            });

            if (!variant || variant.quantity - variant.reservedQuantity < quantity) {
                throw new BadRequestException('Insufficient available inventory');
            }

            variant.reservedQuantity += quantity;
            return manager.save(variant);
        });
    }

    async releaseReservedInventory(variantId: string, quantity: number) {
        const variant = await this.variantRepository.findOne({ where: { id: variantId } });
        if (!variant) {
            throw new BadRequestException('Variant not found');
        }

        variant.reservedQuantity = Math.max(0, variant.reservedQuantity - quantity);
        return this.variantRepository.save(variant);
    }
}
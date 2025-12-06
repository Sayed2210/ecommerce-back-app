import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ProductVariant } from '../entities/product-variant.entity';
import { InventoryLog, InventoryReason } from '../entities/inventory-log.entity';
import { BullmqService } from '../../../infrastructure/queue/bullmq.service';

@Injectable()
export class InventoryService {
    private readonly logger = new Logger(InventoryService.name);

    constructor(
        @InjectRepository(ProductVariant)
        private readonly variantRepository: Repository<ProductVariant>,
        @InjectRepository(InventoryLog)
        private readonly inventoryLogRepository: Repository<InventoryLog>,
        private readonly dataSource: DataSource,
        private readonly queueService: BullmqService,
    ) { }

    async getInventory(variantId: string) {
        return this.variantRepository.findOne({
            where: { id: variantId },
            select: ['id', 'sku', 'inventoryQuantity', 'reservedQuantity', 'lowStockThreshold'],
        });
    }

    async adjustInventory(variantId: string, quantity: number, reason: InventoryReason, userId?: string) {
        return this.dataSource.transaction(async (manager) => {
            const variant = await manager.findOne(ProductVariant, {
                where: { id: variantId },
                relations: ['product'],
                lock: { mode: 'pessimistic_write' },
            });

            if (!variant) {
                throw new BadRequestException('Product variant not found');
            }

            const oldQuantity = variant.inventoryQuantity;
            variant.inventoryQuantity += quantity;

            if (variant.inventoryQuantity < 0) {
                throw new BadRequestException('Insufficient inventory');
            }

            await manager.save(variant);

            // Create log entry
            const log = this.inventoryLogRepository.create({
                variant: { id: variantId },
                product: variant.product,
                oldQuantity,
                newQuantity: variant.inventoryQuantity,
                reason,
                createdBy: userId ? { id: userId } : undefined,
            });
            await manager.save(log);

            // Check low stock
            if (variant.inventoryQuantity <= variant.lowStockThreshold) {
                await this.queueService.addNotificationJob('low-stock-alert', {
                    variantId,
                    currentStock: variant.inventoryQuantity,
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

            if (!variant) {
                throw new BadRequestException('Product variant not found');
            }

            if (variant.inventoryQuantity - variant.reservedQuantity < quantity) {
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
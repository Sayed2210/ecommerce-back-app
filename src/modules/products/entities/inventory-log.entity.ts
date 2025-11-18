// src/modules/products/entities/inventory-log.entity.ts
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { Product } from './product.entity';
import { ProductVariant } from './product-variant.entity';
import { User } from '@modules/auth/entities/user.entity';

export enum InventoryReason {
    SALE = 'sale',
    RETURN = 'return',
    MANUAL_ADJUSTMENT = 'manual_adjustment',
    RESTOCK = 'restock',
}

@Entity('inventory_logs')
export class InventoryLog extends BaseEntity {
    @Column({ name: 'old_quantity' })
    oldQuantity: number;

    @Column({ name: 'new_quantity' })
    newQuantity: number;

    @Column({ type: 'enum', enum: InventoryReason })
    reason: InventoryReason;

    @Column({ name: 'reference_id', nullable: true })
    referenceId?: string;

    @ManyToOne(() => Product, product => product.inventoryLogs, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @ManyToOne(() => ProductVariant, variant => variant.inventoryLogs, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'variant_id' })
    variant?: ProductVariant;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'created_by' })
    createdBy?: User;
}

// Add to Product entity
// In product.entity.ts:
// @OneToMany(() => InventoryLog, log => log.product)
// inventoryLogs: InventoryLog[];
// Add to ProductVariant entity
// In product-variant.entity.ts:
// @OneToMany(() => InventoryLog, log => log.variant)
// inventoryLogs: InventoryLog[];
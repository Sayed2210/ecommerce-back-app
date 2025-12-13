// src/modules/products/entities/product-variant.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { Product } from './product.entity';
import { ProductImage } from './product-image.entity';
import { CartItem } from '@modules/cart/entities/cart-item.entity';
import { OrderItem } from '@modules/orders/entities/order-item.entity';
import { InventoryLog } from './inventory-log.entity';

@Entity('product_variants')
export class ProductVariant extends BaseEntity {
    @Column({ name: 'variant_name', type: 'jsonb' })
    variantName: Record<string, any>;

    @Column({ name: 'price_modifier', type: 'decimal', precision: 12, scale: 2, default: 0 })
    priceModifier: number;

    @Column({ nullable: true, length: 100 })
    sku?: string;

    @Column({ nullable: true, length: 100 })
    barcode?: string;

    @Column({ name: 'inventory_quantity', default: 0 })
    inventoryQuantity: number;

    @Column({ name: 'reserved_quantity', default: 0 })
    reservedQuantity: number;

    @Column({ name: 'low_stock_threshold', default: 5 })
    lowStockThreshold: number;

    @Column({ type: 'jsonb', default: {} })
    optionValues: Record<string, any>;

    @Column({ name: 'image_url', nullable: true })
    imageUrl?: string;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @ManyToOne(() => Product, product => product.variants, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @OneToMany(() => ProductImage, image => image.variant)
    images: ProductImage[];

    @OneToMany(() => CartItem, item => item.variant)
    cartItems: CartItem[];

    @OneToMany(() => OrderItem, item => item.variant)
    orderItems: OrderItem[];

    @OneToMany(() => InventoryLog, log => log.product)
    inventoryLogs: InventoryLog[];
}
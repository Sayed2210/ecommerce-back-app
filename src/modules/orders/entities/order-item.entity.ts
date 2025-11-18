// src/modules/orders/entities/order-item.entity.ts
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { Order } from './order.entity';
import { Product } from '@modules/products/entities/product.entity';
import { ProductVariant } from '@modules/products/entities/product-variant.entity';

@Entity('order_items')
export class OrderItem extends BaseEntity {
    @Column({ name: 'product_name', length: 500 })
    productName: string;

    @Column({ name: 'variant_name', nullable: true })
    variantName?: string;

    @Column({ name: 'sku', nullable: true })
    sku?: string;

    @Column({ name: 'unit_price', type: 'decimal', precision: 12, scale: 2 })
    unitPrice: number;

    @Column()
    quantity: number;

    @Column({ name: 'total_price', type: 'decimal', precision: 12, scale: 2 })
    totalPrice: number;

    @ManyToOne(() => Order, order => order.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @ManyToOne(() => Product, product => product.orderItems, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @ManyToOne(() => ProductVariant, variant => variant.orderItems, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'variant_id' })
    variant?: ProductVariant;
}
// src/modules/orders/entities/shipping.entity.ts
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { Order } from './order.entity';

export enum ShippingStatus {
    PENDING = 'pending',
    SHIPPED = 'shipped',
    IN_TRANSIT = 'in_transit',
    OUT_FOR_DELIVERY = 'out_for_delivery',
    DELIVERED = 'delivered',
    FAILED = 'failed',
}

@Entity('shippings')
export class Shipping extends BaseEntity {
    @Column({ name: 'status' })
    status: ShippingStatus;

    @Column({ name: 'tracking_number', nullable: true })
    trackingNumber?: string;

    @Column({ name: 'carrier', nullable: true })
    carrier?: string;

    @Column({ name: 'shipped_at', type: 'timestamptz', nullable: true })
    shippedAt?: Date;

    @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true })
    deliveredAt?: Date;

    @Column({ type: 'jsonb', default: {} })
    metadata: Record<string, any>;

    @ManyToOne(() => Order, order => order.shippings, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_id' })
    order: Order;
}
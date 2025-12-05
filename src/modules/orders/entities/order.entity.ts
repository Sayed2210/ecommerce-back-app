// src/modules/orders/entities/order.entity.ts
import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { User } from '@modules/auth/entities/user.entity';
import { Coupon } from './coupon.entity';
import { Address } from '@modules/users/entities/address.entity';
import { OrderItem } from './order-item.entity';
import { Payment } from './payment.entity';
import { Shipping } from './shipping.entity';

export enum OrderStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    SHIPPED = 'shipped',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled',
    REFUNDED = 'refunded',
}

export enum PaymentStatus {
    PENDING = 'pending',
    PAID = 'paid',
    FAILED = 'failed',
    REFUNDED = 'refunded',
}

export enum PaymentMethod {
    STRIPE = 'stripe',
    COD = 'cod',
}

@Entity('orders')
export class Order extends BaseEntity {
    @Column({ name: 'order_number', unique: true })
    orderNumber: string;

    @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
    status: OrderStatus;

    @ManyToOne(() => User, user => user.orders, { nullable: true })
    @JoinColumn({ name: 'user_id' })
    user?: User;

    @Column({ name: 'subtotal', type: 'decimal', precision: 12, scale: 2 })
    subtotal: number;

    @Column({ name: 'tax_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
    taxAmount: number;

    @Column({ name: 'shipping_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
    shippingAmount: number;

    @Column({ name: 'discount_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
    discountAmount: number;

    @Column({ name: 'total_amount', type: 'decimal', precision: 12, scale: 2 })
    totalAmount: number;

    @Column({ default: 'USD', length: 3 })
    currency: string;

    @ManyToOne(() => Coupon, coupon => coupon.orders, { nullable: true })
    @JoinColumn({ name: 'coupon_id' })
    coupon?: Coupon;

    @Column({ name: 'payment_status', type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
    paymentStatus: PaymentStatus;

    @Column({ name: 'payment_method', type: 'enum', enum: PaymentMethod, nullable: true })
    paymentMethod?: PaymentMethod;

    @Column({ name: 'payment_intent_id', nullable: true })
    paymentIntentId?: string;

    @ManyToOne(() => Address, { nullable: true })
    @JoinColumn({ name: 'shipping_address_id' })
    shippingAddress?: Address;

    @ManyToOne(() => Address, { nullable: true })
    @JoinColumn({ name: 'billing_address_id' })
    billingAddress?: Address;

    @Column({ name: 'shipping_method', nullable: true })
    shippingMethod?: string;

    @Column({ name: 'tracking_number', nullable: true })
    trackingNumber?: string;

    @Column({ nullable: true, type: 'text' })
    notes?: string;

    @OneToMany(() => OrderItem, item => item.order, { cascade: true })
    items: OrderItem[];

    // @OneToMany(() => Payment, payment => payment.order, { cascade: true })
    // payments: Payment[];

    // @OneToMany(() => Shipping, shipping => shipping.order, { cascade: true })
    // shippings: Shipping[];
}
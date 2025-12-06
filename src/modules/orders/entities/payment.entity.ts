// src/modules/orders/entities/payment.entity.ts
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { Order } from './order.entity';

export enum PaymentGateway {
    STRIPE = 'stripe',
    PAYPAL = 'paypal',
    CASH_ON_DELIVERY = 'cash_on_delivery',
}

@Entity('payments')
export class Payment extends BaseEntity {
    @Column({ name: 'payment_intent_id' })
    paymentIntentId: string;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    amount: number;

    @Column()
    currency: string;

    @Column({ type: 'enum', enum: PaymentGateway })
    gateway: PaymentGateway;

    @Column({ type: 'jsonb', default: {} })
    metadata: Record<string, any>;

    @ManyToOne(() => Order, order => order.payments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_id' })
    order: Order;
}
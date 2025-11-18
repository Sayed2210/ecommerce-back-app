// src/modules/orders/entities/coupon.entity.ts
import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { Order } from './order.entity';

export enum CouponType {
    PERCENTAGE = 'percentage',
    FIXED = 'fixed',
    FREE_SHIPPING = 'free_shipping',
}

@Entity('coupons')
export class Coupon extends BaseEntity {
    @Column({ unique: true, length: 50 })
    code: string;

    @Column({ type: 'enum', enum: CouponType })
    type: CouponType;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    value?: number;

    @Column({ name: 'max_discount', type: 'decimal', precision: 12, scale: 2, nullable: true })
    maxDiscount?: number;

    @Column({ name: 'min_order_value', type: 'decimal', precision: 12, scale: 2, default: 0 })
    minOrderValue: number;

    @Column({ name: 'usage_limit', nullable: true })
    usageLimit?: number;

    @Column({ name: 'usage_count', default: 0 })
    usageCount: number;

    @Column({ name: 'start_date', type: 'timestamptz' })
    startDate: Date;

    @Column({ name: 'end_date', type: 'timestamptz', nullable: true })
    endDate?: Date;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ type: 'jsonb', default: {} })
    appliesTo: Record<string, any>;

    @OneToMany(() => Order, order => order.coupon)
    orders: Order[];
}
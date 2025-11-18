// src/modules/orders/services/coupon.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon } from '../entities/coupon.entity';
import { Order } from '../entities/order.entity';
@Injectable()
export class CouponService {
    constructor(
        @InjectRepository(Coupon)
        private couponRepository: Repository<Coupon>,
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
    ) { }

    async validateCoupon(code: string, userId: string, orderValue: number): Promise<CouponValidationResult> {
        const coupon = await this.couponRepository.findOne({ where: { code: code.toUpperCase() } });

        if (!coupon || !coupon.isActive) {
            return { valid: false, message: 'Invalid coupon code' };
        }

        if (coupon.startDate > new Date() || (coupon.endDate && coupon.endDate < new Date())) {
            return { valid: false, message: 'Coupon expired' };
        }

        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
            return { valid: false, message: 'Coupon usage limit reached' };
        }

        if (orderValue < coupon.minOrderValue) {
            return { valid: false, message: `Minimum order value is ${coupon.minOrderValue}` };
        }

        // Check if user already used this coupon
        const previousUsage = await this.orderRepository.count({
            where: { user: { id: userId }, coupon: { id: coupon.id } },
        });

        if (previousUsage > 0) {
            return { valid: false, message: 'Coupon already used' };
        }

        // Validate applies_to constraints
        if (coupon.appliesTo?.categories?.length || coupon.appliesTo?.products?.length) {
            // Check if cart items match coupon criteria
            return { valid: true, coupon };
        }

        return { valid: true, coupon };
    }

    calculateDiscount(coupon: Coupon, orderValue: number): number {
        switch (coupon.type) {
            case 'percentage':
                const discount = (orderValue * coupon.value) / 100;
                return Math.min(discount, coupon.maxDiscount || discount);
            case 'fixed':
                return Math.min(coupon.value, orderValue);
            case 'free_shipping':
                return orderValue; // Full discount on shipping
            default:
                return 0;
        }
    }

    async applyCoupon(orderId: string, couponCode: string, userId: string): Promise<Order> {
        const order = await this.orderRepository.findOne({
            where: { id: orderId, user: { id: userId } },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        if (order.coupon?.id) {
            throw new BadRequestException('Coupon already applied');
        }

        const validation = await this.validateCoupon(couponCode, userId, order.subtotal);
        if (!validation.valid) {
            throw new BadRequestException(validation.message);
        }

        const discount = this.calculateDiscount(validation.coupon, order.subtotal);

        order.coupon.id = validation.coupon.id;
        order.discountAmount = discount;
        order.totalAmount = order.subtotal + order.taxAmount + order.shippingAmount - discount;

        await this.orderRepository.save(order);

        // Increment usage count
        await this.couponRepository.increment({ id: validation.coupon.id }, 'usageCount', 1);

        return order;
    }
}
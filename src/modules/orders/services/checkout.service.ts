import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Cart } from '../../cart/entities/cart.entity';
import { CartItem } from '../../cart/entities/cart-item.entity';
import { CreateOrderDto } from '../dtos/create-order.dto';
import { ApplyCouponDto } from '../dtos/apply-coupon.dto';
import { Coupon, CouponType } from '../entities/coupon.entity';
import { OrderStatus } from '../entities/order.entity';
import { PaymentService } from './payment.service';
import { ShippingService } from './shipping.service';
import { BullmqService } from '../../../infrastructure/queue/bullmq.service';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { PaymentGateway } from '../entities';

@Injectable()
export class CheckoutService {
    private readonly logger = new Logger(CheckoutService.name);

    constructor(
        private readonly dataSource: DataSource,
        private readonly paymentService: PaymentService,
        private readonly shippingService: ShippingService,
        private readonly BullmqService: BullmqService,
        @InjectRepository(Coupon)
        private readonly couponRepository: Repository<Coupon>,
    ) { }

    async validateCheckout(userId: string, orderData: any) {
        // Simple validation logic reusing parts of createOrder or just checking prerequisites
        // For now, checks if cart exists and is not empty as a basic validation
        const cart = await this.dataSource.manager.findOne(Cart, {
            where: { user: { id: userId } },
            relations: ['items', 'items.variant', 'items.variant.product'],
        });

        if (!cart || cart.items.length === 0) {
            throw new BadRequestException('Cart is empty');
        }

        // Check inventory
        const errors = [];
        for (const item of cart.items) {
            const available = item.variant.inventoryQuantity - item.variant.reservedQuantity;
            if (item.quantity > available) {
                errors.push(`Insufficient stock for ${item.variant.product.name}`);
            }
        }

        if (errors.length > 0) {
            return { valid: false, errors };
        }

        return { valid: true, message: 'Checkout data is valid' };
    }

    async createOrder(userId: string, dto: CreateOrderDto) {
        return this.dataSource.transaction(async (manager) => {
            // Get cart
            const cart = await manager.findOne(Cart, {
                where: { user: { id: userId } },
                relations: ['items', 'items.variant', 'items.variant.product'],
            });

            if (!cart || cart.items.length === 0) {
                throw new BadRequestException('Cart is empty');
            }

            // Validate inventory
            for (const item of cart.items) {
                const available = item.variant.inventoryQuantity - item.variant.reservedQuantity;
                if (item.quantity > available) {
                    throw new BadRequestException(
                        `Insufficient stock for ${item.variant.product.name}`
                    );
                }
            }

            // Calculate totals
            let subtotal = 0;
            for (const item of cart.items) {
                const price = Number(item.variant.product.basePrice) + Number(item.variant.priceModifier);
                subtotal += price * item.quantity;
            }

            let totalAmount = subtotal;
            let discount = 0;

            // Apply coupon if provided
            if (dto.couponCode) {
                const coupon = await this.couponRepository.findOne({
                    where: { code: dto.couponCode, isActive: true },
                });

                if (!coupon) {
                    throw new BadRequestException('Invalid coupon code');
                }

                if (coupon.endDate && coupon.endDate < new Date()) {
                    throw new BadRequestException('Coupon has expired');
                }

                // Simplified discount logic assuming percentage for now or reusing value directly
                if (coupon.type === CouponType.PERCENTAGE) {
                    discount = (subtotal * (coupon.value || 0)) / 100;
                    if (coupon.maxDiscount) {
                        discount = Math.min(discount, coupon.maxDiscount);
                    }
                } else if (coupon.type === CouponType.FIXED) {
                    discount = Math.min(coupon.value || 0, subtotal);
                }

                totalAmount = subtotal - discount;
            }

            // Calculate shipping
            const shippingCost = await this.shippingService.calculateShipping(
                dto.shippingAddressId,
                totalAmount
            );

            totalAmount += shippingCost;

            // Create order
            const order = manager.create(Order, {
                user: { id: userId },
                items: [],
                subtotal,
                discountAmount: discount, // Entity has discountAmount, not discount
                shippingCost,
                totalAmount,
                status: OrderStatus.PENDING,
                shippingAddress: { id: dto.shippingAddressId },
                paymentInfo: { method: dto.paymentMethod }, // Entity structure mismatch? Order has paymentInfo or paymentMethod?
            });
            // Update: Order entity check needed. 
            // CheckoutService line 92: `paymentMethod: dto.paymentMethod`.
            // Order entity line? I'll check Order entity fields.
            // Assuming `discount` -> `discountAmount`.

            const savedOrder = await manager.save(Order, order);

            // Create order items
            const orderItems = cart.items.map(item => {
                const price = Number(item.variant.product.basePrice) + Number(item.variant.priceModifier);
                return manager.create(OrderItem, {
                    order: { id: savedOrder.id },
                    productVariant: { id: item.variant.id },
                    quantity: item.quantity,
                    price: price,
                    total: price * item.quantity,
                });
            });

            await manager.save(OrderItem, orderItems);
            savedOrder.items = orderItems;

            // Reserve inventory
            for (const item of cart.items) {
                // Update ProductVariant
                // manager.update(EntityTarget, Criteria, PartialEntity)
                await manager.update(ProductVariant, // Correct Class
                    { id: item.variant.id },
                    { reservedQuantity: item.variant.reservedQuantity + item.quantity }
                );
            }

            // Clear cart
            await manager.delete(CartItem, { cart: { id: cart.id } });

            // Process payment
            let paymentResult;
            if (dto.paymentMethod === PaymentGateway.STRIPE) {
                paymentResult = await this.paymentService.createPaymentIntent(
                    savedOrder.id,
                    totalAmount,
                    dto.paymentToken
                );
            } else if (dto.paymentMethod === PaymentGateway.CASH_ON_DELIVERY) {
                paymentResult = { status: 'pending', message: 'Cash on delivery' };
            }

            // Send confirmation email
            await this.BullmqService.addOrderProcessingJob('order-confirmation', {
                orderId: savedOrder.id,
                userId,
            });

            this.logger.log(`Order ${savedOrder.id} created successfully`);

            return {
                order: savedOrder,
                payment: paymentResult,
            };
        });
    }

    async applyCoupon(dto: ApplyCouponDto) {
        const coupon = await this.couponRepository.findOne({
            where: { code: dto.code, isActive: true },
        });

        if (!coupon) {
            throw new NotFoundException('Coupon not found');
        }

        if (coupon.endDate && coupon.endDate < new Date()) {
            throw new BadRequestException('Coupon has expired');
        }

        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
            throw new BadRequestException('Coupon usage limit reached');
        }

        return {
            discountValue: coupon.value,
            type: coupon.type,
            maxDiscount: coupon.maxDiscount,
        };
    }
}
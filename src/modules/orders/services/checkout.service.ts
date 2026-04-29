import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus, PaymentMethod } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Cart } from '../../cart/entities/cart.entity';
import { CartItem } from '../../cart/entities/cart-item.entity';
import { CreateOrderDto } from '../dtos/create-order.dto';
import { ApplyCouponDto } from '../dtos/apply-coupon.dto';
import { Coupon, CouponType } from '../entities/coupon.entity';
import { PaymentService } from './payment.service';
import { ShippingService } from './shipping.service';
import { TaxService } from './tax.service';
import { BullmqService } from '../../../infrastructure/queue/bullmq.service';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { Product } from '../../products/entities/product.entity';
import { Address } from '../../users/entities/address.entity';

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly paymentService: PaymentService,
    private readonly shippingService: ShippingService,
    private readonly taxService: TaxService,
    private readonly BullmqService: BullmqService,
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
  ) {}

  async validateCheckout(userId: string, _orderData: any) {
    // Simple validation logic reusing parts of createOrder or just checking prerequisites
    // For now, checks if cart exists and is not empty as a basic validation
    const cart = await this.dataSource.manager.findOne(Cart, {
      where: { user: { id: userId } },
      relations: [
        'items',
        'items.product',
        'items.variant',
        'items.variant.product',
      ],
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Check inventory
    const errors = [];
    for (const item of cart.items) {
      const hasVariant = !!item.variant;
      const available = hasVariant
        ? item.variant.inventoryQuantity - item.variant.reservedQuantity
        : (item.product?.inventoryQuantity ?? 0);
      const itemName =
        (hasVariant
          ? item.variant?.product?.name?.['en']
          : item.product?.name?.['en']) ??
        (hasVariant
          ? JSON.stringify(item.variant?.product?.name)
          : JSON.stringify(item.product?.name)) ??
        item.product?.slug ??
        'this item';

      if (!hasVariant && !item.product) {
        errors.push('Cart contains an invalid item with missing product data');
        continue;
      }

      if (item.quantity > available) {
        errors.push(`Insufficient stock for ${itemName}`);
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
        relations: [
          'items',
          'items.product',
          'items.variant',
          'items.variant.product',
        ],
      });

      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('Cart is empty');
      }

      // Validate inventory with pessimistic lock to prevent race conditions
      for (const item of cart.items) {
        if (item.variant?.id) {
          const variantWithLock = await manager
            .createQueryBuilder(ProductVariant, 'v')
            .setLock('pessimistic_write')
            .leftJoinAndSelect('v.product', 'product')
            .where('v.id = :id', { id: item.variant.id })
            .getOne();

          if (!variantWithLock) {
            throw new BadRequestException('Product variant not found');
          }

          const available =
            variantWithLock.inventoryQuantity -
            variantWithLock.reservedQuantity;
          if (item.quantity > available) {
            throw new BadRequestException(
              `Insufficient stock for ${variantWithLock.product?.name?.['en'] ?? JSON.stringify(variantWithLock.product?.name)}`,
            );
          }
          continue;
        }

        const productWithLock = await manager
          .createQueryBuilder(Product, 'p')
          .setLock('pessimistic_write')
          .where('p.id = :id', { id: item.product?.id })
          .getOne();

        if (!productWithLock) {
          throw new BadRequestException('Product not found');
        }

        if (item.quantity > productWithLock.inventoryQuantity) {
          throw new BadRequestException(
            `Insufficient stock for ${productWithLock.name?.['en'] ?? JSON.stringify(productWithLock.name)}`,
          );
        }
      }

      // Calculate totals
      let subtotal = 0;
      for (const item of cart.items) {
        const price =
          Number(item.product.basePrice) +
          Number(item.variant?.priceModifier ?? 0);
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
        totalAmount,
      );

      totalAmount += shippingCost;

      // Calculate tax based on shipping destination
      const shippingAddress = await manager.findOne(Address, {
        where: { id: dto.shippingAddressId },
      });
      const { taxAmount } = this.taxService.calculate(
        subtotal - discount,
        shippingAddress?.country,
      );
      totalAmount += taxAmount;

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Create order
      const order = manager.create(Order, {
        user: { id: userId },
        orderNumber,
        items: [],
        subtotal,
        taxAmount,
        discountAmount: discount,
        shippingAmount: shippingCost,
        totalAmount,
        currency: 'USD',
        status: OrderStatus.PENDING,
        shippingAddress: { id: dto.shippingAddressId },
        paymentMethod: dto.paymentMethod,
      });

      const savedOrder = await manager.save(Order, order);

      // Create order items
      const orderItems = cart.items.map((item) => {
        const price =
          Number(item.product.basePrice) +
          Number(item.variant?.priceModifier ?? 0);
        return manager.create(OrderItem, {
          order: { id: savedOrder.id },
          product: { id: item.product.id },
          variant: item.variant ? { id: item.variant.id } : undefined,
          productName:
            item.product.name?.['en'] ?? JSON.stringify(item.product.name),
          variantName: item.variant
            ? (item.variant.variantName?.['en'] ??
              JSON.stringify(item.variant.variantName))
            : undefined,
          sku: item.variant?.sku ?? item.product.sku,
          quantity: item.quantity,
          unitPrice: price,
          totalPrice: price * item.quantity,
        });
      });

      await manager.save(OrderItem, orderItems);
      savedOrder.items = orderItems;

      // Update coupon usage count
      if (dto.couponCode) {
        await manager.increment(
          Coupon,
          { code: dto.couponCode },
          'usageCount',
          1,
        );
      }

      // Reserve inventory
      for (const item of cart.items) {
        if (item.variant?.id) {
          await manager.update(
            ProductVariant,
            { id: item.variant.id },
            { reservedQuantity: item.variant.reservedQuantity + item.quantity },
          );
          continue;
        }

        await manager.decrement(
          Product,
          { id: item.product.id },
          'inventoryQuantity',
          item.quantity,
        );
      }

      // Clear cart
      await manager.delete(CartItem, { cart: { id: cart.id } });

      // Process payment
      let paymentResult;
      if (dto.paymentMethod === PaymentMethod.STRIPE) {
        paymentResult = await this.paymentService.createPaymentIntent(
          savedOrder.id,
          totalAmount,
          dto.paymentToken,
        );
      } else if (dto.paymentMethod === PaymentMethod.COD) {
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

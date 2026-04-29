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
import { CurrenciesService } from '../../currencies/services/currencies.service';
import { PointsService } from '../../points/services/points.service';

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly paymentService: PaymentService,
    private readonly shippingService: ShippingService,
    private readonly taxService: TaxService,
    private readonly bullmqService: BullmqService,
    private readonly currenciesService: CurrenciesService,
    private readonly pointsService: PointsService,
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
  ) {}

  async validateCheckout(userId: string, _orderData: any) {
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

      let subtotal = 0;
      let totalWeight = 0;
      for (const item of cart.items) {
        const price =
          Number(item.product.basePrice) +
          Number(item.variant?.priceModifier ?? 0);
        subtotal += price * item.quantity;
        totalWeight += Number(item.product.weight || 0) * item.quantity;
      }

      let totalAmount = subtotal;
      let discount = 0;
      let shippingCost = 0;

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

        if (coupon.type === CouponType.PERCENTAGE) {
          discount = (subtotal * (coupon.value || 0)) / 100;
          if (coupon.maxDiscount) {
            discount = Math.min(discount, coupon.maxDiscount);
          }
        } else if (coupon.type === CouponType.FIXED) {
          discount = Math.min(coupon.value || 0, subtotal);
        } else if (coupon.type === CouponType.FREE_SHIPPING) {
          shippingCost = 0;
        }

        totalAmount = subtotal - discount;
      }

      // Apply points redemption before shipping/tax if requested
      if (dto.redeemPoints && dto.redemptionType) {
        const redemptionResult = await this.pointsService.redeemPoints(userId, {
          points: dto.redeemPoints,
          type: dto.redemptionType,
        });

        if (redemptionResult.discountAmount > 0) {
          discount += redemptionResult.discountAmount;
          totalAmount = Math.max(0, subtotal - discount);
        }
        if (redemptionResult.shippingFree) {
          shippingCost = 0;
        }
        if (redemptionResult.orderFree) {
          totalAmount = 0;
          discount = subtotal;
          shippingCost = 0;
        }
      }

      // Calculate shipping if not already free
      if (shippingCost !== 0) {
        shippingCost = await this.shippingService.calculateShipping(
          dto.shippingAddressId,
          totalAmount,
          totalWeight,
        );
      }

      totalAmount += shippingCost;

      const shippingAddress = await manager.findOne(Address, {
        where: { id: dto.shippingAddressId },
      });
      const { taxAmount } = this.taxService.calculate(
        subtotal - discount,
        shippingAddress?.country,
      );
      totalAmount += taxAmount;

      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const currencyCode = dto.currencyCode?.toUpperCase() || 'USD';

      const order = manager.create(Order, {
        user: { id: userId },
        orderNumber,
        items: [],
        subtotal,
        taxAmount,
        discountAmount: discount,
        shippingAmount: shippingCost,
        totalAmount,
        currency: currencyCode,
        status: OrderStatus.PENDING,
        shippingAddress: { id: dto.shippingAddressId },
        paymentMethod: dto.paymentMethod,
      });

      const savedOrder = await manager.save(Order, order);

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

      if (dto.couponCode) {
        await manager.increment(
          Coupon,
          { code: dto.couponCode },
          'usageCount',
          1,
        );
      }

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

      await manager.delete(CartItem, { cart: { id: cart.id } });

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

      await this.bullmqService.addOrderProcessingJob('order-confirmation', {
        orderId: savedOrder.id,
        userId,
      });

      await this.bullmqService.addOrderProcessingJob('send-invoice', {
        orderId: savedOrder.id,
        userId,
      });

      this.logger.log(`Order ${savedOrder.id} created successfully`);

      const result: any = {
        order: savedOrder,
        payment: paymentResult,
      };

      if (dto.currencyCode && dto.currencyCode !== 'USD') {
        try {
          result.convertedTotal = await this.currenciesService.convert(
            totalAmount,
            'USD',
            dto.currencyCode,
          );
        } catch {
          // ignore conversion errors, return base currency
        }
      }

      return result;
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

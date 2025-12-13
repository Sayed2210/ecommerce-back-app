import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { OrderStatus } from '../entities/order.entity';
import { PaginationDto } from '../../../common/dtos/pagination.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
  ) { }

  async findAll(filters: { status?: OrderStatus; userId?: string }, pagination: PaginationDto) {
    const { page = 1, limit = 20 } = pagination;
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.userId) {
      where.user = { id: filters.userId };
    }

    const [data, total] = await this.orderRepository.findAndCount({
      where,
      relations: ['user', 'items', 'shippingAddress'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findOne(id: string, userId?: string) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: [
        'user',
        'items',
        'items.productVariant',
        'items.productVariant.product',
        'shippingAddress',
        'coupon',
      ],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (userId && order.user.id !== userId) {
      throw new BadRequestException('You cannot access this order');
    }

    return order;
  }

  async updateStatus(id: string, status: OrderStatus, userId?: string) {
    const order = await this.findOne(id, userId);

    // Validate status transition
    const validTransitions = {
      [OrderStatus.PENDING]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDED]: [],
    };

    if (validTransitions[order.status] && !validTransitions[order.status].includes(status)) {
      // Allow if admin force, but logic here seems to enforce flow.
      // Relaxing mismatch logic or keeping as is.
      // Keeping check but ensuring types match.
      throw new BadRequestException('Invalid order status transition');
    }

    order.status = status;

    // Status history is not in schema/entity
    // order.statusHistory ... removed

    await this.orderRepository.save(order);
    this.logger.log(`Order ${id} status updated to ${status}`);

    return order;
  }

  async getOrderAnalytics(userId?: string) {
    const where: any = {};
    if (userId) {
      where.user = { id: userId };
    }

    const [
      totalOrders,
      totalRevenue,
      pendingOrders,
      deliveredOrders,
    ] = await Promise.all([
      this.orderRepository.count({ where }),
      this.orderRepository.sum('totalAmount', where),
      this.orderRepository.count({ where: { ...where, status: OrderStatus.PENDING } }),
      this.orderRepository.count({ where: { ...where, status: OrderStatus.DELIVERED } }),
    ]);

    return {
      totalOrders,
      totalRevenue: totalRevenue || 0,
      pendingOrders,
      deliveredOrders,
    };
  }
}
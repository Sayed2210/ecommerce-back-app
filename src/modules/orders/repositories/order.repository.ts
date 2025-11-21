import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractRepository } from '../../../common/database/abstract.repository';
import { Order, OrderStatus } from '../entities/order.entity';

@Injectable()
export class OrderRepository extends AbstractRepository<Order> {
    constructor(
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
    ) {
        super(orderRepository);
    }

    // Custom methods specific to Order
    async findByUserId(userId: string): Promise<Order[]> {
        return this.repository.find({
            where: { user: { id: userId } },
            relations: ['items', 'items.productVariant', 'shippingAddress'],
        });
    }

    async findByStatus(status: OrderStatus): Promise<Order[]> {
        return this.repository.find({
            where: { status },
            relations: ['user', 'items', 'shippingAddress'],
        });
    }

    async getFrequentlyBoughtTogether(productId: string, limit = 5) {
        return this.createQueryBuilder('order')
            .innerJoin('order.items', 'item')
            .innerJoin('order.items', 'relatedItem')
            .where('item.productId = :productId', { productId })
            .andWhere('relatedItem.productId != :productId', { productId })
            .select('relatedItem.productId', 'productId')
            .addSelect('COUNT(*)', 'frequency')
            .groupBy('relatedItem.productId')
            .orderBy('frequency', 'DESC')
            .limit(limit)
            .getRawMany();
    }
}

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
}

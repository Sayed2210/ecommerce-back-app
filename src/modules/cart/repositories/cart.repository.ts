import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractRepository } from '../../../common/database/abstract.repository';
import { Cart } from '../entities/cart.entity';

@Injectable()
export class CartRepository extends AbstractRepository<Cart> {
    constructor(
        @InjectRepository(Cart)
        private readonly cartRepository: Repository<Cart>,
    ) {
        super(cartRepository);
    }

    async findByUserId(userId: string): Promise<Cart | null> {
        return this.repository.findOne({
            where: { user: { id: userId } },
            relations: ['items', 'items.productVariant'],
        });
    }
}
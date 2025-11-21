import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractRepository } from '../../../common/database/abstract.repository';
import { Review } from '../entities/review.entity';

@Injectable()
export class ReviewRepository extends AbstractRepository<Review> {
    constructor(
        @InjectRepository(Review)
        private readonly reviewRepository: Repository<Review>,
    ) {
        super(reviewRepository);
    }

    // Custom methods specific to Review
    async findByProductId(productId: string): Promise<Review[]> {
        return this.repository.find({
            where: { product: { id: productId } },
            relations: ['user', 'product'],
        });
    }
}
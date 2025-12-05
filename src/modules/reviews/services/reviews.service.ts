import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../entities/review.entity';
import { CreateReviewDto } from '../dtos/create-review.dto';
import { UpdateReviewDto } from '../dtos/update-review.dto';
import { PaginationDto } from '../../../common/dtos/pagination.dto';

@Injectable()
export class ReviewsService {
    constructor(
        @InjectRepository(Review)
        private readonly reviewRepository: Repository<Review>,
    ) { }

    async create(userId: string, createReviewDto: CreateReviewDto): Promise<Review> {
        const review = this.reviewRepository.create({
            ...createReviewDto,
            user: { id: userId },
            product: { id: createReviewDto.productId },
            order: createReviewDto.orderId ? { id: createReviewDto.orderId } : undefined,
        });
        return this.reviewRepository.save(review);
    }

    async findAll(productId: string, pagination: PaginationDto) {
        const { page = 1, limit = 10 } = pagination;
        const [data, total] = await this.reviewRepository.findAndCount({
            where: { product: { id: productId }, isActive: true },
            order: { createdAt: 'DESC' },
            relations: ['user'],
            skip: (page - 1) * limit,
            take: limit,
        });

        return { data, total, page, limit };
    }

    async findOne(id: string): Promise<Review> {
        const review = await this.reviewRepository.findOne({
            where: { id },
            relations: ['user', 'product'],
        });
        if (!review) {
            throw new NotFoundException(`Review with ID ${id} not found`);
        }
        return review;
    }

    async update(id: string, userId: string, updateReviewDto: UpdateReviewDto): Promise<Review> {
        const review = await this.findOne(id);

        if (review.user.id !== userId) {
            throw new ForbiddenException('You can only update your own reviews');
        }

        Object.assign(review, updateReviewDto);
        return this.reviewRepository.save(review);
    }

    async remove(id: string, userId: string): Promise<void> {
        const review = await this.findOne(id);

        if (review.user.id !== userId) {
            throw new ForbiddenException('You can only delete your own reviews');
        }

        await this.reviewRepository.remove(review);
    }
}

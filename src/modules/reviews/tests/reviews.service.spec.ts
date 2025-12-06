import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ReviewsService } from '../services/reviews.service';
import { Review } from '../entities/review.entity';
import { CreateReviewDto } from '../dtos/create-review.dto';

describe('ReviewsService', () => {
    let service: ReviewsService;
    let reviewRepository: Record<string, jest.Mock>;

    beforeEach(async () => {
        reviewRepository = {
            create: jest.fn(),
            save: jest.fn(),
            findAndCount: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ReviewsService,
                { provide: getRepositoryToken(Review), useValue: reviewRepository },
            ],
        }).compile();

        service = module.get<ReviewsService>(ReviewsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a review', async () => {
            const dto: CreateReviewDto = { productId: 'p1', rating: 5, comment: 'Great' };
            const review = { id: 'r1', ...dto };
            reviewRepository.create.mockReturnValue(review);
            reviewRepository.save.mockResolvedValue(review);

            const result = await service.create('u1', dto);
            expect(result).toBe(review);
            expect(reviewRepository.create).toHaveBeenCalled();
        });
    });

    describe('findAll', () => {
        it('should return paginated reviews', async () => {
            reviewRepository.findAndCount.mockResolvedValue([[], 0]);
            const result = await service.findAll('p1', { page: 1, limit: 10 });
            expect(result.data).toEqual([]);
        });
    });

    describe('update', () => {
        it('should update review if owner', async () => {
            const review = { id: 'r1', user: { id: 'u1' } };
            reviewRepository.findOne.mockResolvedValue(review);
            reviewRepository.save.mockResolvedValue({ ...review, comment: 'Updated' });

            const result = await service.update('r1', 'u1', { comment: 'Updated' });
            expect(result.comment).toBe('Updated');
        });

        it('should throw ForbiddenException if not owner', async () => {
            const review = { id: 'r1', user: { id: 'u1' } };
            reviewRepository.findOne.mockResolvedValue(review);
            await expect(service.update('r1', 'u2', {})).rejects.toThrow(ForbiddenException);
        });
    });

    describe('remove', () => {
        it('should soft delete review (isActive: false) if owner', async () => {
            const review = { id: 'r1', user: { id: 'u1' }, isActive: true };
            reviewRepository.findOne.mockResolvedValue(review);
            reviewRepository.save.mockResolvedValue(review);

            await service.remove('r1', 'u1');
            expect(review.isActive).toBe(false);
            expect(reviewRepository.save).toHaveBeenCalledWith(review);
        });
    });
});

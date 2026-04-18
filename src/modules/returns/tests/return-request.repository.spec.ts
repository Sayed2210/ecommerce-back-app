import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ReturnRequestRepository } from '../repositories/return-request.repository';
import { ReturnRequest, ReturnStatus, ReturnReason } from '../entities/return-request.entity';

const mockRepo = {
    findAndCount: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    softDelete: jest.fn(),
    restore: jest.fn(),
    metadata: { name: 'ReturnRequest' },
    createQueryBuilder: jest.fn(),
};

const mockDataSource = { getRepository: jest.fn().mockReturnValue(mockRepo) };

describe('ReturnRequestRepository', () => {
    let repository: ReturnRequestRepository;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ReturnRequestRepository,
                { provide: getRepositoryToken(ReturnRequest), useValue: mockRepo },
                { provide: DataSource, useValue: mockDataSource },
            ],
        }).compile();

        repository = module.get<ReturnRequestRepository>(ReturnRequestRepository);
    });

    afterEach(() => jest.clearAllMocks());

    it('should be defined', () => {
        expect(repository).toBeDefined();
    });

    describe('save', () => {
        it('delegates to the underlying TypeORM repository', async () => {
            const entity = { id: 'r1', status: ReturnStatus.PENDING } as ReturnRequest;
            mockRepo.save.mockResolvedValue(entity);

            const result = await repository.save(entity);

            expect(mockRepo.save).toHaveBeenCalledWith(entity);
            expect(result).toBe(entity);
        });
    });

    describe('findAndCount', () => {
        it('passes options through to TypeORM findAndCount', async () => {
            mockRepo.findAndCount.mockResolvedValue([[], 0]);
            const options = { where: { user: { id: 'u1' } }, take: 10, skip: 0 };

            const result = await repository.findAndCount(options);

            expect(mockRepo.findAndCount).toHaveBeenCalledWith(options);
            expect(result).toEqual([[], 0]);
        });
    });
});

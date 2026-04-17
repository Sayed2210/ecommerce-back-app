import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NotificationRepository } from '../repositories/notification.repository';
import { Notification, NotificationType } from '../entities/notification.entity';

const queryBuilder = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue(undefined),
};

const mockRepo = {
    findAndCount: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    softDelete: jest.fn(),
    restore: jest.fn(),
    metadata: { name: 'Notification' },
    createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
};

const mockDataSource = { getRepository: jest.fn().mockReturnValue(mockRepo) };

describe('NotificationRepository', () => {
    let repository: NotificationRepository;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationRepository,
                { provide: getRepositoryToken(Notification), useValue: mockRepo },
                { provide: DataSource, useValue: mockDataSource },
            ],
        }).compile();

        repository = module.get<NotificationRepository>(NotificationRepository);
    });

    afterEach(() => jest.clearAllMocks());

    it('should be defined', () => {
        expect(repository).toBeDefined();
    });

    describe('save', () => {
        it('delegates to underlying TypeORM save', async () => {
            const entity = { id: 'n1' } as Notification;
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

    describe('remove', () => {
        it('delegates to underlying TypeORM remove', async () => {
            const entity = { id: 'n1' } as Notification;
            mockRepo.remove.mockResolvedValue(entity);

            await repository.remove(entity);

            expect(mockRepo.remove).toHaveBeenCalledWith(entity);
        });
    });

    describe('markAllReadByUser', () => {
        it('executes an UPDATE via query builder with correct conditions', async () => {
            await repository.markAllReadByUser('u1');

            expect(mockRepo.createQueryBuilder).toHaveBeenCalled();
            expect(queryBuilder.update).toHaveBeenCalledWith(Notification);
            expect(queryBuilder.set).toHaveBeenCalledWith(expect.objectContaining({ readAt: expect.any(Date) }));
            expect(queryBuilder.where).toHaveBeenCalledWith('user_id = :userId', { userId: 'u1' });
            expect(queryBuilder.andWhere).toHaveBeenCalledWith('read_at IS NULL');
            expect(queryBuilder.execute).toHaveBeenCalled();
        });
    });
});

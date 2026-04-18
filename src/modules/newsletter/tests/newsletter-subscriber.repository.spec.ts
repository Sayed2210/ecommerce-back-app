import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NewsletterSubscriberRepository } from '../repositories/newsletter-subscriber.repository';
import { NewsletterSubscriber } from '../entities/newsletter-subscriber.entity';

const mockRepo = {
  find: jest.fn(),
  count: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  softDelete: jest.fn(),
  restore: jest.fn(),
  metadata: { name: 'NewsletterSubscriber' },
  createQueryBuilder: jest.fn(),
};

const mockDataSource = { getRepository: jest.fn().mockReturnValue(mockRepo) };

describe('NewsletterSubscriberRepository', () => {
  let repository: NewsletterSubscriberRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewsletterSubscriberRepository,
        {
          provide: getRepositoryToken(NewsletterSubscriber),
          useValue: mockRepo,
        },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    repository = module.get<NewsletterSubscriberRepository>(
      NewsletterSubscriberRepository,
    );
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('save', () => {
    it('delegates to the underlying TypeORM repository', async () => {
      const entity = {
        id: 's1',
        email: 'test@example.com',
      } as NewsletterSubscriber;
      mockRepo.save.mockResolvedValue(entity);

      const result = await repository.save(entity);

      expect(mockRepo.save).toHaveBeenCalledWith(entity);
      expect(result).toBe(entity);
    });
  });

  describe('find', () => {
    it('returns all active subscribers', async () => {
      const subscribers = [{ id: 's1', isActive: true }];
      mockRepo.find.mockResolvedValue(subscribers);

      const result = await repository.find({ where: { isActive: true } });

      expect(mockRepo.find).toHaveBeenCalledWith({ where: { isActive: true } });
      expect(result).toEqual(subscribers);
    });
  });

  describe('count', () => {
    it('returns count of active subscribers', async () => {
      mockRepo.count.mockResolvedValue(42);

      const result = await repository.count({ where: { isActive: true } });

      expect(mockRepo.count).toHaveBeenCalledWith({
        where: { isActive: true },
      });
      expect(result).toBe(42);
    });
  });
});

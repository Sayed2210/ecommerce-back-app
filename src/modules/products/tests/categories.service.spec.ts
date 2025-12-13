import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from '../services/categories.service';
import { Category } from '../entities/category.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

const mockCategoryRepository = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    merge: jest.fn(),
    delete: jest.fn(),
});

describe('CategoriesService', () => {
    let service: CategoriesService;
    let repository: jest.Mocked<Repository<Category>>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CategoriesService,
                { provide: getRepositoryToken(Category), useFactory: mockCategoryRepository },
            ],
        }).compile();

        service = module.get<CategoriesService>(CategoriesService);
        repository = module.get(getRepositoryToken(Category));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return all categories', async () => {
            const result = [];
            repository.find.mockResolvedValue(result);
            expect(await service.findAll()).toBe(result);
        });
    });

    describe('create', () => {
        it('should create category', async () => {
            const dto = { name: { en: 'Cat', ar: 'Cat' } };
            const result = { id: 'c1', ...dto };
            repository.create.mockReturnValue(result as any);
            repository.save.mockResolvedValue(result as any);

            expect(await service.create(dto as any)).toBe(result);
        });
    });

    describe('update', () => {
        it('should update category', async () => {
            const existing = { id: 'c1', name: { en: 'Old', ar: 'Old' } };
            const updated = { id: 'c1', name: { en: 'New', ar: 'New' } };
            repository.findOne.mockResolvedValue(existing as any);
            repository.merge.mockReturnValue(updated as any);
            repository.save.mockResolvedValue(updated as any);

            expect(await service.update('c1', { name: { en: 'New', ar: 'New' } } as any)).toBe(updated);
        });

        it('should throw if not found', async () => {
            repository.findOne.mockResolvedValue(null);
            await expect(service.update('c1', { name: { en: 'New', ar: 'New' } })).rejects.toThrow(NotFoundException);
        });
    });
});

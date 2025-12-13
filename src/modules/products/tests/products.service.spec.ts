import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from '../services/products.service';
import { ProductRepository } from '../repositories/product.repository';
import { RedisService } from '../../../infrastructure/cache/redis.service';
import { Product } from '../entities/product.entity';
import { CreateProductDto } from '../dtos/create-product.dto';

describe('ProductsService', () => {
    let service: ProductsService;
    let productRepository: Partial<Record<keyof ProductRepository, jest.Mock>>;
    let redisService: Partial<Record<keyof RedisService, jest.Mock>>;
    let productRepo: {
        createQueryBuilder: jest.Mock,
        findOne: jest.Mock,
        count: jest.Mock,
        update: jest.Mock
    };

    beforeEach(async () => {
        productRepository = {
            create: jest.fn(),
            update: jest.fn(),
            findOne: jest.fn(),
        };

        redisService = {
            get: jest.fn(),
            set: jest.fn(),
            delete: jest.fn(),
        };

        const mockQueryBuilder = {
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            take: jest.fn().mockReturnThis(),
            getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
        };

        productRepo = {
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
            findOne: jest.fn(),
            count: jest.fn(),
            update: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProductsService,
                { provide: ProductRepository, useValue: productRepository },
                { provide: RedisService, useValue: redisService },
                { provide: getRepositoryToken(Product), useValue: productRepo },
            ],
        }).compile();

        service = module.get<ProductsService>(ProductsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a product and invalidate cache', async () => {
            const dto: CreateProductDto = { name: { en: 'Test Product', ar: 'Test Product' }, description: { en: 'Desc', ar: 'Desc' }, basePrice: 100, categoryId: '1', brandId: '1', images: [], inventoryQuantity: 10 };
            const product = { id: '1', ...dto, slug: 'test-product' };

            // Mock duplicate check in SlugUtil using productRepo.count
            productRepo.count.mockResolvedValue(0);
            productRepository.create.mockResolvedValue(product);

            const result = await service.create(dto);

            expect(productRepository.create).toHaveBeenCalled();
            expect(redisService.delete).toHaveBeenCalledWith('products:all');
            expect(result).toEqual(product);
        });
    });

    describe('findAll', () => {
        it('should return cached result if available', async () => {
            const cachedResult = { data: [], total: 0, page: 1, limit: 10 };
            redisService.get.mockResolvedValue(cachedResult);

            const result = await service.findAll({}, {});
            expect(result).toBe(cachedResult);
            expect(productRepo.createQueryBuilder).not.toHaveBeenCalled();
        });

        it('should query database if no cache', async () => {
            redisService.get.mockResolvedValue(null);

            const result = await service.findAll({}, {});
            expect(productRepo.createQueryBuilder).toHaveBeenCalled();
            expect(redisService.set).toHaveBeenCalled();
            expect(result).toHaveProperty('data');
        });
    });

    describe('findOne', () => {
        it('should return product and increment view count', async () => {
            const product = { id: '1', metadata: { viewCount: 0 } };
            redisService.get.mockResolvedValue(null);
            productRepo.findOne.mockResolvedValue(product);

            const result = await service.findOne('1');
            expect(result).toBe(product);
            expect(productRepo.update).toHaveBeenCalled();
            expect(redisService.set).toHaveBeenCalled();
        });

        it('should throw NotFoundException if product does not exist', async () => {
            redisService.get.mockResolvedValue(null);
            productRepo.findOne.mockResolvedValue(null);
            await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('should update product and invalidate caches', async () => {
            const product = { id: '1', name: { en: 'Old', ar: 'Old' } };
            const updated = { id: '1', name: { en: 'New', ar: 'New' } };

            // service.update calls findOne first
            redisService.get.mockResolvedValue(null); // findOne cache miss
            productRepo.findOne.mockResolvedValue(product);
            // then update
            productRepository.update.mockResolvedValue(updated);

            await service.update('1', { name: { en: 'New', ar: 'New' } });

            expect(productRepository.update).toHaveBeenCalled();
            expect(redisService.delete).toHaveBeenCalledWith('product:1');
            expect(redisService.delete).toHaveBeenCalledWith('products:all');
        });
    });

    describe('remove', () => {
        it('should soft delete product and invalidate caches', async () => {
            const product = { id: '1' };
            redisService.get.mockResolvedValue(null);
            productRepo.findOne.mockResolvedValue(product);

            await service.remove('1');

            expect(productRepository.update).toHaveBeenCalledWith('1', { isActive: false });
            expect(redisService.delete).toHaveBeenCalledWith('product:1');
            expect(redisService.delete).toHaveBeenCalledWith('products:all');
        });
    });
});

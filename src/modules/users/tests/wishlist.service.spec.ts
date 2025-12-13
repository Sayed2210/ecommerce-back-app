import { Test, TestingModule } from '@nestjs/testing';
import { WishlistService } from '../services/wishlist.service';
import { Wishlist } from '../entities/wishlist.entity';
import { Product } from '../../products/entities/product.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';

const mockWishlistRepository = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
});

const mockProductRepository = () => ({
    findOne: jest.fn(),
});

describe('WishlistService', () => {
    let service: WishlistService;
    let wishlistRepository: jest.Mocked<Repository<Wishlist>>;
    let productRepository: jest.Mocked<Repository<Product>>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WishlistService,
                { provide: getRepositoryToken(Wishlist), useFactory: mockWishlistRepository },
                { provide: getRepositoryToken(Product), useFactory: mockProductRepository },
            ],
        }).compile();

        service = module.get<WishlistService>(WishlistService);
        wishlistRepository = module.get(getRepositoryToken(Wishlist));
        productRepository = module.get(getRepositoryToken(Product));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return all wishlist items for a user', async () => {
            const result = [{ id: '1' }] as Wishlist[];
            wishlistRepository.find.mockResolvedValue(result);

            expect(await service.findAll('user1')).toBe(result);
            expect(wishlistRepository.find).toHaveBeenCalledWith({
                where: { user: { id: 'user1' } },
                relations: ['product', 'product.images', 'product.brand'],
                order: { createdAt: 'DESC' },
            });
        });
    });

    describe('addItem', () => {
        it('should add item if not exists', async () => {
            wishlistRepository.findOne.mockResolvedValue(null);
            productRepository.findOne.mockResolvedValue({ id: 'prod1' } as Product);
            wishlistRepository.save.mockResolvedValue({ id: 'wish1' } as Wishlist);

            const result = await service.addItem('user1', 'prod1');
            expect(result).toEqual({ id: 'wish1' });
            expect(wishlistRepository.save).toHaveBeenCalled();
        });

        it('should throw ConflictException if item already in wishlist', async () => {
            wishlistRepository.findOne.mockResolvedValue({ id: 'wish1' } as Wishlist);
            await expect(service.addItem('user1', 'prod1')).rejects.toThrow(ConflictException);
        });

        it('should throw NotFoundException if product does not exist', async () => {
            wishlistRepository.findOne.mockResolvedValue(null);
            productRepository.findOne.mockResolvedValue(null);
            await expect(service.addItem('user1', 'prod1')).rejects.toThrow(NotFoundException);
        });
    });

    describe('removeItem', () => {
        it('should remove item', async () => {
            const item = { id: 'wish1' } as Wishlist;
            wishlistRepository.findOne.mockResolvedValue(item);
            wishlistRepository.remove.mockResolvedValue(item);

            await service.removeItem('user1', 'prod1');
            expect(wishlistRepository.remove).toHaveBeenCalledWith(item);
        });

        it('should throw NotFoundException if item not found', async () => {
            wishlistRepository.findOne.mockResolvedValue(null);
            await expect(service.removeItem('user1', 'prod1')).rejects.toThrow(NotFoundException);
        });
    });

    describe('clearWishlist', () => {
        it('should delete all items for user', async () => {
            await service.clearWishlist('user1');
            expect(wishlistRepository.delete).toHaveBeenCalledWith({ user: { id: 'user1' } });
        });
    });
});

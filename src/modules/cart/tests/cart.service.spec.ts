import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { CartService } from '../services/cart.service';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { ProductRepository } from '../../products/repositories/product.repository';
import { RedisService } from '../../../infrastructure/cache/redis.service';
import { AddCartItemDto } from '../dtos/add-cart-item.dto';

import { NotificationsGateway } from '../../notifications/services/websocket.gateway';

describe('CartService', () => {
    let service: CartService;
    let cartRepository: Record<string, jest.Mock>;
    let cartItemRepository: Record<string, jest.Mock>;
    let productVariantRepository: Record<string, jest.Mock>;
    let productRepository: Partial<Record<keyof ProductRepository, jest.Mock>>;
    let redisService: Partial<Record<keyof RedisService, jest.Mock>>;
    let notificationsGateway: Record<string, jest.Mock>;

    beforeEach(async () => {
        cartRepository = {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
        };
        cartItemRepository = {
            save: jest.fn(),
            create: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
        };
        productVariantRepository = {
            findOne: jest.fn(),
        };
        productRepository = {
            findOne: jest.fn(),
        };
        redisService = {
            get: jest.fn(),
            set: jest.fn(),
        };
        notificationsGateway = {
            sendCartUpdate: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CartService,
                { provide: getRepositoryToken(Cart), useValue: cartRepository },
                { provide: getRepositoryToken(CartItem), useValue: cartItemRepository },
                { provide: getRepositoryToken(ProductVariant), useValue: productVariantRepository },
                { provide: ProductRepository, useValue: productRepository },
                { provide: RedisService, useValue: redisService },
                { provide: NotificationsGateway, useValue: notificationsGateway },
            ],
        }).compile();

        service = module.get<CartService>(CartService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getOrCreateCart', () => {
        it('should return existing cart for user', async () => {
            const cart = { id: '1', items: [] };
            cartRepository.findOne.mockResolvedValue(cart);

            const result = await service.getOrCreateCart('u1');
            expect(result).toBe(cart);
            expect(cartRepository.findOne).toHaveBeenCalledWith(expect.objectContaining({
                where: { user: { id: 'u1' } }
            }));
        });
    });

    describe('addItem', () => {
        it('should add new item to cart', async () => {
            const dto: AddCartItemDto = { productId: 'p1', quantity: 1 };
            const cart = { id: '1', items: [] };
            cartRepository.findOne.mockResolvedValue(cart);
            cartItemRepository.create.mockReturnValue({});
            cartItemRepository.save.mockResolvedValue({});

            // Mock getCartWithTotals return (called at end of addItem)
            // But wait, getCartWithTotals calls repository again.
            // We must mock repository response for getCartWithTotals.
            // It calls findOne
            cartRepository.findOne
                .mockResolvedValueOnce(cart) // for addItem initial check
                .mockResolvedValueOnce({ ...cart, items: [{ product: { basePrice: 100 }, quantity: 1, totalPrice: 100 }] }); // for getCartWithTotals

            const result = await service.addItem('1', dto);
            expect(cartItemRepository.save).toHaveBeenCalled();
            expect(result).toBeDefined();
        });
    });

    describe('updateItem', () => {
        it('should update item quantity', async () => {
            const item = { id: 'i1', cart: { id: 'c1' }, quantity: 1 };
            cartItemRepository.findOne.mockResolvedValue(item);
            cartItemRepository.save.mockResolvedValue({ ...item, quantity: 2 });

            // Mock getCartWithTotals
            const cart = { id: 'c1', items: [] };
            cartRepository.findOne.mockResolvedValue(cart);

            await service.updateItem('i1', { quantity: 2 });
            expect(cartItemRepository.save).toHaveBeenCalled();
        });
    });

    describe('removeItem', () => {
        it('should delete item', async () => {
            const item = { id: 'i1', cart: { id: 'c1' }, product: { id: 'p1', basePrice: 100 }, quantity: 1 };
            cartItemRepository.findOne.mockResolvedValue(item);
            cartItemRepository.delete.mockResolvedValue({});
            // Mock getCartWithTotals
            const cart = { id: 'c1', items: [] };
            cartRepository.findOne.mockResolvedValue(cart);

            await service.removeItem('i1');
            expect(cartItemRepository.delete).toHaveBeenCalledWith('i1');
        });
    });
});

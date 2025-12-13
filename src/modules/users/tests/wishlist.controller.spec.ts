import { Test, TestingModule } from '@nestjs/testing';
import { WishlistController } from '../controllers/wishlist.controller';
import { WishlistService } from '../services/wishlist.service';

const mockWishlistService = () => ({
    findAll: jest.fn(),
    addItem: jest.fn(),
    removeItem: jest.fn(),
    clearWishlist: jest.fn(),
});

describe('WishlistController', () => {
    let controller: WishlistController;
    let service: any;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [WishlistController],
            providers: [
                { provide: WishlistService, useFactory: mockWishlistService },
            ],
        }).compile();

        controller = module.get<WishlistController>(WishlistController);
        service = module.get<WishlistService>(WishlistService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getWishlist', () => {
        it('should return wishlist', async () => {
            const result = [];
            service.findAll.mockResolvedValue(result);
            expect(await controller.getWishlist({ user: { id: '1' } })).toBe(result);
            expect(service.findAll).toHaveBeenCalledWith('1');
        });
    });

    describe('addItem', () => {
        it('should add item', async () => {
            const dto = { productId: 'prod1' };
            const result = { id: 'w1' };
            service.addItem.mockResolvedValue(result);

            expect(await controller.addItem({ user: { id: '1' } }, dto)).toBe(result);
            expect(service.addItem).toHaveBeenCalledWith('1', 'prod1');
        });
    });

    describe('removeItem', () => {
        it('should remove item', async () => {
            await controller.removeItem({ user: { id: '1' } }, 'prod1');
            expect(service.removeItem).toHaveBeenCalledWith('1', 'prod1');
        });
    });

    describe('clearWishlist', () => {
        it('should clear wishlist', async () => {
            await controller.clearWishlist({ user: { id: '1' } });
            expect(service.clearWishlist).toHaveBeenCalledWith('1');
        });
    });
});

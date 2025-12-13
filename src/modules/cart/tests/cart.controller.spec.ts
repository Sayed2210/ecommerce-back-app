import { Test, TestingModule } from '@nestjs/testing';
import { CartController } from '../controllers/cart.controller';
import { CartService } from '../services/cart.service';
import { AddCartItemDto } from '../dtos/add-cart-item.dto';

const mockCartService = () => ({
    getOrCreateCart: jest.fn(),
    addItem: jest.fn(),
    updateItem: jest.fn(),
    removeItem: jest.fn(),
    clearCart: jest.fn(),
});

describe('CartController', () => {
    let controller: CartController;
    let service: any;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CartController],
            providers: [
                { provide: CartService, useFactory: mockCartService },
            ],
        }).compile();

        controller = module.get<CartController>(CartController);
        service = module.get<CartService>(CartService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getCart', () => {
        it('should return cart', async () => {
            const cart = { id: 'cart1' };
            service.getOrCreateCart.mockResolvedValue(cart);

            const req = { user: { id: 'u1' } };
            // Controller might handle guest carts too, assume user for now or mock headers
            expect(await controller.getCart(req)).toBe(cart);
            expect(service.getOrCreateCart).toHaveBeenCalledWith('u1');
        });
    });

    describe('addItem', () => {
        it('should add item', async () => {
            const dto = { productId: 'p1', quantity: 1 };
            const cart = { id: 'cart1' };
            service.getOrCreateCart.mockResolvedValue(cart);
            service.addItem.mockResolvedValue(cart);

            const req = { user: { id: 'u1' } };
            expect(await controller.addItem(req, dto as AddCartItemDto)).toBe(cart);
            expect(service.addItem).toHaveBeenCalledWith('cart1', dto);
        });
    });
});

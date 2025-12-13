import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from '../controllers/orders.controller';
import { OrdersService } from '../services/orders.service';

const mockOrdersService = () => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    updateStatus: jest.fn(),
});

describe('OrdersController', () => {
    let controller: OrdersController;
    let service: any;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [OrdersController],
            providers: [
                { provide: OrdersService, useFactory: mockOrdersService },
            ],
        }).compile();

        controller = module.get<OrdersController>(OrdersController);
        service = module.get<OrdersService>(OrdersService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('findAll', () => {
        it('should return orders', async () => {
            const result = [];
            service.findAll.mockResolvedValue(result);
            const req = { user: { id: 'user-id' } } as any;
            expect(await controller.findAll(req, {} as any)).toBe(result);
        });
    });

    describe('findOne', () => {
        it('should return order', async () => {
            const result = { id: 'o1' };
            service.findOne.mockResolvedValue(result);
            const req = { user: { id: 'user-id' } } as any;
            expect(await controller.findOne(req, 'o1')).toBe(result);
            expect(service.findOne).toHaveBeenCalledWith('o1', 'user-id');
        });
    });
});

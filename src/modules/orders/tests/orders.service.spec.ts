import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OrdersService } from '../services/orders.service';
import { Order, OrderStatus } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { PaginationDto } from '../../../common/dtos/pagination.dto';

describe('OrdersService', () => {
    let service: OrdersService;
    let orderRepository: Record<string, jest.Mock>;
    let orderItemRepository: Record<string, jest.Mock>;

    beforeEach(async () => {
        orderRepository = {
            findAndCount: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
            sum: jest.fn(),
        };

        orderItemRepository = {
            // Mock methods if needed, though they seem unused in tested methods
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OrdersService,
                { provide: getRepositoryToken(Order), useValue: orderRepository },
                { provide: getRepositoryToken(OrderItem), useValue: orderItemRepository },
            ],
        }).compile();

        service = module.get<OrdersService>(OrdersService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return paginated orders', async () => {
            const pagination: PaginationDto = { page: 1, limit: 10 };
            const result = [[], 0];
            orderRepository.findAndCount.mockResolvedValue(result);

            const response = await service.findAll({}, pagination);
            expect(response.total).toBe(0);
        });
    });

    describe('findOne', () => {
        it('should return order if found and accessible', async () => {
            const order = { id: '1', user: { id: 'u1' } };
            orderRepository.findOne.mockResolvedValue(order);

            expect(await service.findOne('1', 'u1')).toBe(order);
        });

        it('should throw NotFoundException if not found', async () => {
            orderRepository.findOne.mockResolvedValue(null);
            await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if user does not own order', async () => {
            const order = { id: '1', user: { id: 'u1' } };
            orderRepository.findOne.mockResolvedValue(order);
            await expect(service.findOne('1', 'u2')).rejects.toThrow(BadRequestException);
        });
    });

    describe('updateStatus', () => {
        it('should update status and save', async () => {
            const order = { id: '1', status: OrderStatus.PENDING, user: { id: 'u1' } };
            const savedOrder = { ...order, status: OrderStatus.PROCESSING };
            orderRepository.findOne.mockResolvedValue(order);
            orderRepository.save.mockResolvedValue(savedOrder);

            const result = await service.updateStatus('1', OrderStatus.PROCESSING);
            expect(result.status).toBe(OrderStatus.PROCESSING);
            expect(orderRepository.save).toHaveBeenCalled();
        });
    });

    describe('getOrderAnalytics', () => {
        it('should return analytics data', async () => {
            orderRepository.count.mockResolvedValue(10);
            orderRepository.sum.mockResolvedValue(1000);

            const result = await service.getOrderAnalytics('u1');
            expect(result).toEqual({
                totalOrders: 10,
                totalRevenue: 1000,
                pendingOrders: 10,
                deliveredOrders: 10,
            });
        });
    });
});

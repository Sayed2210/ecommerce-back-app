import { Test, TestingModule } from '@nestjs/testing';
import { CouponService } from '../services/coupon.service';
import { Coupon, CouponType } from '../entities/coupon.entity';
import { Order } from '../entities/order.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const mockCouponRepository = () => ({
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
    increment: jest.fn(),
});

const mockOrderRepository = () => ({
    count: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
});

describe('CouponService', () => {
    let service: CouponService;
    let couponRepository: jest.Mocked<Repository<Coupon>>;
    let orderRepository: jest.Mocked<Repository<Order>>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CouponService,
                { provide: getRepositoryToken(Coupon), useFactory: mockCouponRepository },
                { provide: getRepositoryToken(Order), useFactory: mockOrderRepository },
            ],
        }).compile();

        service = module.get<CouponService>(CouponService);
        couponRepository = module.get(getRepositoryToken(Coupon));
        orderRepository = module.get(getRepositoryToken(Order));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a coupon', async () => {
            const dto = { code: 'TEST', startDate: new Date(), type: CouponType.FIXED, value: 10 };
            couponRepository.findOne.mockResolvedValue(null);
            couponRepository.create.mockReturnValue(dto as any);
            couponRepository.save.mockResolvedValue(dto as any);

            const result = await service.create(dto as any);
            expect(result).toBeDefined();
            expect(couponRepository.save).toHaveBeenCalled();
        });
    });

    describe('validateCoupon', () => {
        it('should validate valid coupon', async () => {
            const coupon = {
                id: '1', code: 'TEST', isActive: true, startDate: new Date('2020-01-01'),
                minOrderValue: 0, usageCount: 0,
            };
            couponRepository.findOne.mockResolvedValue(coupon as any);
            orderRepository.count.mockResolvedValue(0);

            const result = await service.validateCoupon('TEST', 'user1', 100);
            expect(result.valid).toBe(true);
        });

        it('should invalidate expired coupon', async () => {
            const coupon = {
                id: '1', code: 'TEST', isActive: true,
                startDate: new Date('2020-01-01'), endDate: new Date('2020-01-02'),
            };
            couponRepository.findOne.mockResolvedValue(coupon as any);

            const result = await service.validateCoupon('TEST', 'user1', 100);
            expect(result.valid).toBe(false);
            expect(result.message).toContain('expired');
        });
    });
});

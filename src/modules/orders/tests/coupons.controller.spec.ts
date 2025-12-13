import { Test, TestingModule } from '@nestjs/testing';
import { CouponsController } from '../controllers/coupons.controller';
import { CouponService } from '../services/coupon.service';

const mockCouponService = () => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
});

describe('CouponsController', () => {
    let controller: CouponsController;
    let service: any;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CouponsController],
            providers: [
                { provide: CouponService, useFactory: mockCouponService },
            ],
        }).compile();

        controller = module.get<CouponsController>(CouponsController);
        service = module.get<CouponService>(CouponService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create coupon', async () => {
            const dto = { code: 'TEST' };
            await controller.create(dto as any);
            expect(service.create).toHaveBeenCalledWith(dto);
        });
    });

    describe('findAll', () => {
        it('should return all coupons', async () => {
            await controller.findAll();
            expect(service.findAll).toHaveBeenCalled();
        });
    });
});

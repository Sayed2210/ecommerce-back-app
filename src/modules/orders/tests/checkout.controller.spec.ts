import { Test, TestingModule } from '@nestjs/testing';
import { CheckoutController } from '../controllers/checkout.controller';
import { CheckoutService } from '../services/checkout.service';
import { PaymentService } from '../services/payment.service';
import { CreateOrderDto } from '../dtos/create-order.dto';
import { PaymentGateway } from '../entities';

describe('CheckoutController', () => {
    let controller: CheckoutController;
    let service: CheckoutService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CheckoutController],
            providers: [
                {
                    provide: CheckoutService,
                    useValue: {
                        validateCheckout: jest.fn(),
                        createOrder: jest.fn(),
                        applyCoupon: jest.fn(),
                    },
                },
                {
                    provide: PaymentService,
                    useValue: { createPaymentIntent: jest.fn() },
                },
            ],
        }).compile();

        controller = module.get<CheckoutController>(CheckoutController);
        service = module.get<CheckoutService>(CheckoutService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('validateCheckout', () => {
        it('should call service.validateCheckout', async () => {
            const req = { user: { id: 'user-1' } };
            const checkoutData = { some: 'data' };
            await controller.validateCheckout(req, checkoutData);
            expect(service.validateCheckout).toHaveBeenCalledWith('user-1', checkoutData);
        });
    });

    describe('createOrder', () => {
        it('should call service.createOrder', async () => {
            const req = { user: { id: 'user-1' } };
            const orderData: CreateOrderDto = {
                shippingAddressId: 'addr-1',
                paymentMethod: PaymentGateway.STRIPE,
                paymentToken: 'tok_123'
            };
            await controller.createOrder(req, orderData);
            expect(service.createOrder).toHaveBeenCalledWith('user-1', orderData);
        });
    });

    describe('applyCoupon', () => {
        it('should transform code to dto and call service.applyCoupon', async () => {
            const code = 'SAVE10';
            await controller.applyCoupon(code);

            expect(service.applyCoupon).toHaveBeenCalledWith({ code });
        });
    });
});

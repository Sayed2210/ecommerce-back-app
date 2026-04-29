import { Test, TestingModule } from '@nestjs/testing';
import { CheckoutController } from '../controllers/checkout.controller';
import { CheckoutService } from '../services/checkout.service';
import { PaymentService } from '../services/payment.service';
import { CreateOrderDto } from '../dtos/create-order.dto';
import { ValidateCheckoutDto } from '../dtos/validate-checkout.dto';
import { ApplyCouponDto } from '../dtos/apply-coupon.dto';
import { PaymentMethod } from '../entities';
import { ThrottlerGuard } from '@nestjs/throttler';

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
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<CheckoutController>(CheckoutController);
    service = module.get<CheckoutService>(CheckoutService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('validateCheckout', () => {
    it('should call service.validateCheckout', async () => {
      const req = { user: { id: 'user-1' } };
      const checkoutData = new ValidateCheckoutDto();
      checkoutData.shippingAddressId = 'addr-1';
      await controller.validateCheckout(req, checkoutData);
      expect(service.validateCheckout).toHaveBeenCalledWith(
        'user-1',
        checkoutData,
      );
    });
  });

  describe('createOrder', () => {
    it('should call service.createOrder', async () => {
      const req = { user: { id: 'user-1' } };
      const orderData: CreateOrderDto = {
        shippingAddressId: 'addr-1',
        paymentMethod: PaymentMethod.STRIPE,
        paymentToken: 'tok_123',
      };
      await controller.createOrder(req, orderData);
      expect(service.createOrder).toHaveBeenCalledWith('user-1', orderData);
    });
  });

  describe('applyCoupon', () => {
    it('should transform code to dto and call service.applyCoupon', async () => {
      const req = { user: { id: 'user-1' } };
      const dto: ApplyCouponDto = { code: 'SAVE10' };
      await controller.applyCoupon(req, dto);

      expect(service.applyCoupon).toHaveBeenCalledWith(dto);
    });
  });
});

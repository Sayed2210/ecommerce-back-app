import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ReturnsService } from '../services/returns.service';
import { ReturnRequestRepository } from '../repositories/return-request.repository';
import { ReturnRequest, ReturnStatus } from '../entities/return-request.entity';
import {
  Order,
  OrderStatus,
  PaymentStatus,
} from '../../orders/entities/order.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';
import { MailerService } from '@infrastructure/email/mailer.service';

const makeOrder = (overrides: Partial<Order> = {}): Order =>
  ({
    id: 'order-1',
    user: { id: 'user-1' } as any,
    status: OrderStatus.DELIVERED,
    paymentIntentId: null,
    updatedAt: new Date(),
    orderNumber: 'ORD-001',
    ...overrides,
  }) as any;

const makeReturn = (overrides: Partial<ReturnRequest> = {}): ReturnRequest =>
  ({
    id: 'ret-1',
    status: ReturnStatus.PENDING,
    refundAmount: 50,
    order: { id: 'order-1', orderNumber: 'ORD-001' } as any,
    orderItem: { id: 'item-1' } as any,
    user: { id: 'user-1', email: 'user@example.com' } as any,
    ...overrides,
  }) as any;

describe('ReturnsService', () => {
  let service: ReturnsService;
  let returnRepository: Record<string, jest.Mock>;
  let orderRepository: Record<string, jest.Mock>;
  let orderItemRepository: Record<string, jest.Mock>;
  let mailerService: Record<string, jest.Mock>;
  let mockStripe: { refunds: { create: jest.Mock } };

  beforeEach(async () => {
    returnRepository = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      findOneWithOptions: jest.fn(),
    };

    orderRepository = {
      findOne: jest.fn(),
      update: jest.fn(),
    };

    orderItemRepository = {
      findOne: jest.fn(),
    };

    mailerService = {
      sendReturnStatusUpdate: jest.fn().mockResolvedValue(undefined),
    };

    mockStripe = {
      refunds: { create: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReturnsService,
        { provide: ReturnRequestRepository, useValue: returnRepository },
        { provide: getRepositoryToken(Order), useValue: orderRepository },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: orderItemRepository,
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('sk_test_fake') },
        },
        { provide: MailerService, useValue: mailerService },
      ],
    }).compile();

    service = module.get<ReturnsService>(ReturnsService);
    (service as any).stripe = mockStripe;
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = {
      orderId: 'order-1',
      orderItemId: 'item-1',
      reason: 'Damaged',
    };

    it('throws NotFoundException when order does not exist', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(service.create('user-1', dto as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when order belongs to another user', async () => {
      orderRepository.findOne.mockResolvedValue(
        makeOrder({ user: { id: 'other-user' } as any }),
      );

      await expect(service.create('user-1', dto as any)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws BadRequestException when order is not delivered', async () => {
      orderRepository.findOne.mockResolvedValue(
        makeOrder({ status: OrderStatus.PENDING }),
      );

      await expect(service.create('user-1', dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when return window has expired', async () => {
      const old = new Date();
      old.setDate(old.getDate() - 31);
      orderRepository.findOne.mockResolvedValue(makeOrder({ updatedAt: old }));

      await expect(service.create('user-1', dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException when order item is not found', async () => {
      orderRepository.findOne.mockResolvedValue(makeOrder());
      orderItemRepository.findOne.mockResolvedValue(null);

      await expect(service.create('user-1', dto as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException when return already exists for item', async () => {
      orderRepository.findOne.mockResolvedValue(makeOrder());
      orderItemRepository.findOne.mockResolvedValue({
        id: 'item-1',
        unitPrice: '25',
        quantity: 2,
      });
      returnRepository.findOne.mockResolvedValue({ id: 'existing-return' });

      await expect(service.create('user-1', dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('creates return request with computed refund amount', async () => {
      orderRepository.findOne.mockResolvedValue(makeOrder());
      orderItemRepository.findOne.mockResolvedValue({
        id: 'item-1',
        unitPrice: '25',
        quantity: 2,
      });
      returnRepository.findOne.mockResolvedValue(null);
      const createdReturn = makeReturn();
      returnRepository.create.mockResolvedValue(createdReturn);

      const result = await service.create('user-1', dto as any);

      expect(returnRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ refundAmount: 50 }),
      );
      expect(result).toBe(createdReturn);
    });
  });

  describe('findOne', () => {
    it('returns return request when found', async () => {
      returnRepository.findOneWithOptions.mockResolvedValue(makeReturn());

      const result = await service.findOne('ret-1');

      expect(result.id).toBe('ret-1');
    });

    it('throws NotFoundException when not found', async () => {
      returnRepository.findOneWithOptions.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when userId does not match', async () => {
      returnRepository.findOneWithOptions.mockResolvedValue(
        makeReturn({ user: { id: 'other' } as any }),
      );

      await expect(service.findOne('ret-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('process', () => {
    it('throws BadRequestException when return is already processed', async () => {
      returnRepository.findOneWithOptions.mockResolvedValue(
        makeReturn({ status: ReturnStatus.APPROVED }),
      );

      await expect(
        service.process('ret-1', { status: ReturnStatus.APPROVED } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects return and sends email notification', async () => {
      returnRepository.findOneWithOptions.mockResolvedValue(makeReturn());
      const saved = makeReturn({ status: ReturnStatus.REJECTED });
      returnRepository.save.mockResolvedValue(saved);

      await service.process('ret-1', { status: ReturnStatus.REJECTED } as any);

      expect(returnRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: ReturnStatus.REJECTED }),
      );
      // Email is fire-and-forget; just verify it was called
      await new Promise((resolve) => setImmediate(resolve));
      expect(mailerService.sendReturnStatusUpdate).toHaveBeenCalled();
    });

    it('calls Stripe refund and marks order as REFUNDED on approval with paymentIntentId', async () => {
      returnRepository.findOneWithOptions.mockResolvedValue(makeReturn());
      orderRepository.findOne.mockResolvedValue(
        makeOrder({ paymentIntentId: 'pi_test_123' }),
      );
      mockStripe.refunds.create.mockResolvedValue({ id: 'ref_123' });
      const saved = makeReturn({
        status: ReturnStatus.REFUNDED,
        refundId: 'ref_123',
      });
      returnRepository.save.mockResolvedValue(saved);

      await service.process('ret-1', { status: ReturnStatus.APPROVED } as any);

      expect(mockStripe.refunds.create).toHaveBeenCalledWith(
        expect.objectContaining({ payment_intent: 'pi_test_123' }),
      );
      expect(orderRepository.update).toHaveBeenCalledWith(
        'order-1',
        expect.objectContaining({
          status: OrderStatus.REFUNDED,
          paymentStatus: PaymentStatus.REFUNDED,
        }),
      );
    });

    it('approves without refund when no paymentIntentId', async () => {
      returnRepository.findOneWithOptions.mockResolvedValue(makeReturn());
      orderRepository.findOne.mockResolvedValue(
        makeOrder({ paymentIntentId: null }),
      );
      const saved = makeReturn({ status: ReturnStatus.APPROVED });
      returnRepository.save.mockResolvedValue(saved);

      await service.process('ret-1', { status: ReturnStatus.APPROVED } as any);

      expect(mockStripe.refunds.create).not.toHaveBeenCalled();
      expect(returnRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: ReturnStatus.APPROVED }),
      );
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { PaymentService } from '../services/payment.service';
import { Payment } from '../entities/payment.entity';
import { Order, OrderStatus, PaymentStatus } from '../entities/order.entity';

const mockOrderRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
};

const mockPaymentRepository = {
    create: jest.fn(),
    save: jest.fn(),
};

const mockStripeEvent = (type: string, metadata: Record<string, string> = { orderId: 'order-123' }) => ({
    type,
    data: {
        object: {
            id: 'pi_test_123',
            metadata,
        },
    },
});

describe('PaymentService — handleWebhook', () => {
    let service: PaymentService;
    let mockStripeInstance: any;

    beforeEach(async () => {
        mockStripeInstance = {
            paymentIntents: { create: jest.fn() },
            webhooks: { constructEvent: jest.fn() },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PaymentService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string) => {
                            const config: Record<string, string> = {
                                STRIPE_SECRET_KEY: 'sk_test_fake',
                                STRIPE_WEBHOOK_SECRET: 'whsec_fake',
                            };
                            return config[key];
                        }),
                    },
                },
                { provide: getRepositoryToken(Payment), useValue: mockPaymentRepository },
                { provide: getRepositoryToken(Order), useValue: mockOrderRepository },
            ],
        }).compile();

        service = module.get<PaymentService>(PaymentService);
        // Replace the Stripe instance created in the constructor
        (service as any).stripe = mockStripeInstance;
    });

    afterEach(() => jest.clearAllMocks());

    describe('signature verification', () => {
        it('throws 400 when signature is invalid', async () => {
            mockStripeInstance.webhooks.constructEvent.mockImplementation(() => {
                throw new Error('No signatures found matching the expected signature for payload');
            });

            await expect(
                service.handleWebhook('bad-signature', Buffer.from('payload')),
            ).rejects.toThrow(BadRequestException);
        });

        it('returns { received: true } when signature is valid', async () => {
            mockStripeInstance.webhooks.constructEvent.mockReturnValue(
                mockStripeEvent('payment_intent.succeeded'),
            );
            mockOrderRepository.update.mockResolvedValue({});

            const result = await service.handleWebhook('valid-sig', Buffer.from('payload'));
            expect(result).toEqual({ received: true });
        });
    });

    describe('payment_intent.succeeded', () => {
        it('updates order to PROCESSING and PAID', async () => {
            mockStripeInstance.webhooks.constructEvent.mockReturnValue(
                mockStripeEvent('payment_intent.succeeded'),
            );
            mockOrderRepository.update.mockResolvedValue({});

            await service.handleWebhook('sig', Buffer.from('payload'));

            expect(mockOrderRepository.update).toHaveBeenCalledWith('order-123', {
                status: OrderStatus.PROCESSING,
                paymentStatus: PaymentStatus.PAID,
                paymentIntentId: 'pi_test_123',
            });
        });

        it('does not throw when orderId is missing from metadata', async () => {
            mockStripeInstance.webhooks.constructEvent.mockReturnValue(
                mockStripeEvent('payment_intent.succeeded', {}),
            );

            await expect(
                service.handleWebhook('sig', Buffer.from('payload')),
            ).resolves.toEqual({ received: true });

            expect(mockOrderRepository.update).not.toHaveBeenCalled();
        });
    });

    describe('payment_intent.payment_failed', () => {
        it('updates order paymentStatus to FAILED', async () => {
            mockStripeInstance.webhooks.constructEvent.mockReturnValue(
                mockStripeEvent('payment_intent.payment_failed'),
            );
            mockOrderRepository.update.mockResolvedValue({});

            await service.handleWebhook('sig', Buffer.from('payload'));

            expect(mockOrderRepository.update).toHaveBeenCalledWith('order-123', {
                paymentStatus: PaymentStatus.FAILED,
            });
        });

        it('does not throw when orderId is missing from metadata', async () => {
            mockStripeInstance.webhooks.constructEvent.mockReturnValue(
                mockStripeEvent('payment_intent.payment_failed', {}),
            );

            await expect(
                service.handleWebhook('sig', Buffer.from('payload')),
            ).resolves.toEqual({ received: true });
        });
    });

    describe('payment_intent.canceled', () => {
        it('updates order to CANCELLED and paymentStatus to FAILED', async () => {
            mockStripeInstance.webhooks.constructEvent.mockReturnValue(
                mockStripeEvent('payment_intent.canceled'),
            );
            mockOrderRepository.update.mockResolvedValue({});

            await service.handleWebhook('sig', Buffer.from('payload'));

            expect(mockOrderRepository.update).toHaveBeenCalledWith('order-123', {
                status: OrderStatus.CANCELLED,
                paymentStatus: PaymentStatus.FAILED,
            });
        });
    });

    describe('unhandled event types', () => {
        it('returns { received: true } without updating any order', async () => {
            mockStripeInstance.webhooks.constructEvent.mockReturnValue(
                mockStripeEvent('customer.created'),
            );

            const result = await service.handleWebhook('sig', Buffer.from('payload'));

            expect(result).toEqual({ received: true });
            expect(mockOrderRepository.update).not.toHaveBeenCalled();
        });
    });

    describe('processing error resilience', () => {
        it('returns { received: true } even when DB update throws', async () => {
            mockStripeInstance.webhooks.constructEvent.mockReturnValue(
                mockStripeEvent('payment_intent.succeeded'),
            );
            mockOrderRepository.update.mockRejectedValue(new Error('DB connection lost'));

            // Should NOT throw — processing errors must not cause Stripe retries
            await expect(
                service.handleWebhook('sig', Buffer.from('payload')),
            ).resolves.toEqual({ received: true });
        });
    });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { NewsletterService } from '../services/newsletter.service';
import { NewsletterSubscriberRepository } from '../repositories/newsletter-subscriber.repository';
import { MailerService } from '@infrastructure/email/mailer.service';
import { BullmqService } from '@infrastructure/queue/bullmq.service';

describe('NewsletterService', () => {
    let service: NewsletterService;
    let subscriberRepository: Record<string, jest.Mock>;
    let mailerService: Record<string, jest.Mock>;
    let bullmqService: Record<string, jest.Mock>;

    beforeEach(async () => {
        subscriberRepository = {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            find: jest.fn(),
            count: jest.fn(),
        };

        mailerService = {
            sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
        };

        bullmqService = {
            addEmailJob: jest.fn().mockResolvedValue(undefined),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NewsletterService,
                { provide: NewsletterSubscriberRepository, useValue: subscriberRepository },
                { provide: MailerService, useValue: mailerService },
                { provide: BullmqService, useValue: bullmqService },
            ],
        }).compile();

        service = module.get<NewsletterService>(NewsletterService);
    });

    afterEach(() => jest.clearAllMocks());

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('subscribe', () => {
        const dto = { email: 'test@example.com', name: 'Test User' };

        it('creates a new subscriber and sends welcome email', async () => {
            subscriberRepository.findOne.mockResolvedValue(null);
            subscriberRepository.create.mockResolvedValue({ id: 'sub-1', ...dto });

            const result = await service.subscribe(dto);

            expect(subscriberRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({ email: dto.email }),
            );
            expect(mailerService.sendWelcomeEmail).toHaveBeenCalledWith(
                dto.email,
                expect.objectContaining({ name: dto.name }),
            );
            expect(result.message).toContain('subscribed');
        });

        it('throws ConflictException when email is already active', async () => {
            subscriberRepository.findOne.mockResolvedValue({ email: dto.email, isActive: true });

            await expect(service.subscribe(dto)).rejects.toThrow(ConflictException);
            expect(subscriberRepository.create).not.toHaveBeenCalled();
        });

        it('re-subscribes an inactive subscriber without creating a new record', async () => {
            const inactive = { email: dto.email, isActive: false, name: 'Old Name' };
            subscriberRepository.findOne.mockResolvedValue(inactive);
            subscriberRepository.save.mockResolvedValue({ ...inactive, isActive: true });

            const result = await service.subscribe(dto);

            expect(subscriberRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({ isActive: true }),
            );
            expect(subscriberRepository.create).not.toHaveBeenCalled();
            expect(result.message).toContain('re-subscribed');
        });
    });

    describe('unsubscribe', () => {
        it('deactivates subscriber for valid token', async () => {
            const subscriber = { email: 'test@example.com', isActive: true, unsubscribeToken: 'tok' };
            subscriberRepository.findOne.mockResolvedValue(subscriber);
            subscriberRepository.save.mockResolvedValue({ ...subscriber, isActive: false });

            const result = await service.unsubscribe('tok');

            expect(subscriberRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({ isActive: false }),
            );
            expect(result.message).toContain('unsubscribed');
        });

        it('throws NotFoundException for invalid token', async () => {
            subscriberRepository.findOne.mockResolvedValue(null);

            await expect(service.unsubscribe('bad-token')).rejects.toThrow(NotFoundException);
        });
    });

    describe('sendCampaign', () => {
        it('enqueues an email job for each active subscriber', async () => {
            const subscribers = [
                { email: 'a@example.com', name: 'Alice' },
                { email: 'b@example.com', name: 'Bob' },
            ];
            subscriberRepository.find.mockResolvedValue(subscribers);

            const dto = { subject: 'Big Sale!', content: 'Save 50% today' };
            const result = await service.sendCampaign(dto as any);

            expect(bullmqService.addEmailJob).toHaveBeenCalledTimes(2);
            expect(bullmqService.addEmailJob).toHaveBeenCalledWith(
                'send-newsletter',
                expect.objectContaining({ to: 'a@example.com', subject: 'Big Sale!' }),
            );
            expect(result.queued).toBe(2);
        });

        it('returns queued 0 when no active subscribers', async () => {
            subscriberRepository.find.mockResolvedValue([]);

            const result = await service.sendCampaign({ subject: 'Test', content: 'Body' } as any);

            expect(result.queued).toBe(0);
            expect(bullmqService.addEmailJob).not.toHaveBeenCalled();
        });
    });

    describe('getSubscriberCount', () => {
        it('returns count of active subscribers', async () => {
            subscriberRepository.count.mockResolvedValue(37);

            const count = await service.getSubscriberCount();

            expect(count).toBe(37);
            expect(subscriberRepository.count).toHaveBeenCalledWith(
                expect.objectContaining({ where: { isActive: true } }),
            );
        });
    });
});

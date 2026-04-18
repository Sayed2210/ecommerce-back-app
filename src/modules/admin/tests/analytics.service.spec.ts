import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AnalyticsService } from '../services/analytics.service';
import { AuditLog } from '../entities/audit-log.entity';
import { Order } from '../../orders/entities/order.entity';
import { User } from '../../auth/entities/user.entity';
import { Product } from '../../products/entities/product.entity';

const makeQueryBuilder = (rawOneResult: object = { sum: '500' }) => {
    const qb: any = {
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(rawOneResult),
    };
    return qb;
};

describe('AnalyticsService', () => {
    let service: AnalyticsService;

    let auditLogRepository: Record<string, jest.Mock>;
    let orderRepository: Record<string, jest.Mock>;
    let userRepository: Record<string, jest.Mock>;
    let productRepository: Record<string, jest.Mock>;

    beforeEach(async () => {
        const qb = makeQueryBuilder({ sum: '1500' });

        auditLogRepository = {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
        };

        orderRepository = {
            count: jest.fn().mockResolvedValue(42),
            find: jest.fn().mockResolvedValue([]),
            createQueryBuilder: jest.fn().mockReturnValue(qb),
        };

        userRepository = {
            count: jest.fn().mockResolvedValue(10),
        };

        productRepository = {
            count: jest.fn().mockResolvedValue(100),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AnalyticsService,
                { provide: getRepositoryToken(AuditLog), useValue: auditLogRepository },
                { provide: getRepositoryToken(Order), useValue: orderRepository },
                { provide: getRepositoryToken(User), useValue: userRepository },
                { provide: getRepositoryToken(Product), useValue: productRepository },
            ],
        }).compile();

        service = module.get<AnalyticsService>(AnalyticsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getDashboardStats', () => {
        it('returns aggregated stats from all repositories', async () => {
            const stats = await service.getDashboardStats();

            expect(stats.totalOrders).toBe(42);
            expect(stats.totalUsers).toBe(10);
            expect(stats.totalProducts).toBe(100);
            expect(stats.totalRevenue).toBe(1500);
        });

        it('defaults totalRevenue to 0 when sum is null', async () => {
            orderRepository.createQueryBuilder.mockReturnValue(makeQueryBuilder({ sum: null }));

            const stats = await service.getDashboardStats();

            expect(stats.totalRevenue).toBe(0);
        });

        it('includes up to 5 recent orders', async () => {
            const recentOrders = Array.from({ length: 5 }, (_, i) => ({ id: `order-${i}` }));
            orderRepository.find.mockResolvedValue(recentOrders);

            const stats = await service.getDashboardStats();

            expect(stats.recentOrders).toHaveLength(5);
        });
    });

    describe('logAction', () => {
        it('creates and saves an audit log entry', async () => {
            const dto = { action: 'CREATE_PRODUCT', userId: 'u1', resource: 'Product', resourceId: 'p1' };
            const created = { id: 'log-1', ...dto };
            auditLogRepository.create.mockReturnValue(created);
            auditLogRepository.save.mockResolvedValue(created);

            const result = await service.logAction(dto);

            expect(auditLogRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'CREATE_PRODUCT' }),
            );
            expect(result).toBe(created);
        });

        it('creates log without user when userId is omitted', async () => {
            const dto = { action: 'SYSTEM_EVENT', resource: 'System' };
            auditLogRepository.create.mockReturnValue(dto);
            auditLogRepository.save.mockResolvedValue(dto);

            await service.logAction(dto as any);

            expect(auditLogRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({ user: undefined }),
            );
        });
    });

    describe('getAuditLogs', () => {
        it('returns logs ordered by createdAt DESC with default limit 20', async () => {
            const logs = [{ id: 'l1' }];
            auditLogRepository.find.mockResolvedValue(logs);

            const result = await service.getAuditLogs();

            expect(auditLogRepository.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    order: { createdAt: 'DESC' },
                    take: 20,
                }),
            );
            expect(result).toBe(logs);
        });

        it('respects custom limit', async () => {
            auditLogRepository.find.mockResolvedValue([]);

            await service.getAuditLogs(5);

            expect(auditLogRepository.find).toHaveBeenCalledWith(
                expect.objectContaining({ take: 5 }),
            );
        });
    });
});

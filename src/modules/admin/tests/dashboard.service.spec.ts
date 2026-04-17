import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { DashboardService } from '../services/dashboard.service';

const makeQb = (manyResult: any[] = [], oneResult: object = {}) => {
    const qb: any = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(manyResult),
        getRawOne: jest.fn().mockResolvedValue(oneResult),
    };
    return qb;
};

describe('DashboardService', () => {
    let service: DashboardService;
    let mockDataSource: { createQueryBuilder: jest.Mock };

    beforeEach(async () => {
        mockDataSource = { createQueryBuilder: jest.fn() };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DashboardService,
                { provide: DataSource, useValue: mockDataSource },
            ],
        }).compile();

        service = module.get<DashboardService>(DashboardService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getStats', () => {
        it('returns stats shape with all required keys', async () => {
            const salesData = [
                { date: '2026-01-01', revenue: '200', orders: '2', avgordervalue: '100' },
            ];
            mockDataSource.createQueryBuilder
                .mockReturnValueOnce(makeQb(salesData))  // sales
                .mockReturnValueOnce(makeQb([]))         // top products
                .mockReturnValueOnce(makeQb([]))         // category stats
                .mockReturnValueOnce(makeQb([], { totalCustomers: '5', newCustomers: '1' })); // user stats

            const result = await service.getStats('30d');

            expect(result).toHaveProperty('sales');
            expect(result).toHaveProperty('topProducts');
            expect(result).toHaveProperty('categoryStats');
            expect(result).toHaveProperty('userStats');
            expect(result).toHaveProperty('summary');
            expect(result.summary.totalRevenue).toBe(200);
            expect(result.summary.totalOrders).toBe(2);
        });

        it('computes summary as zero when no sales data', async () => {
            mockDataSource.createQueryBuilder
                .mockReturnValue(makeQb([], {}));

            const result = await service.getStats('7d');

            expect(result.summary.totalRevenue).toBe(0);
            expect(result.summary.totalOrders).toBe(0);
        });

        it('accepts all valid time ranges', async () => {
            const ranges: Array<'7d' | '30d' | '90d' | '1y'> = ['7d', '30d', '90d', '1y'];
            for (const range of ranges) {
                mockDataSource.createQueryBuilder.mockReturnValue(makeQb([]));
                await expect(service.getStats(range)).resolves.not.toThrow();
            }
        });
    });
});

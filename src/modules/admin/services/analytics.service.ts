import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { Order } from '../../orders/entities/order.entity';
import { User } from '../../auth/entities/user.entity';
import { Product } from '../../products/entities/product.entity';
import { DashboardStatsDto } from '../dtos/dashboard-stats.dto';
import { CreateAuditLogDto } from '../dtos/audit-log.dto';

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectRepository(AuditLog)
        private readonly auditLogRepository: Repository<AuditLog>,
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
    ) { }

    async getDashboardStats(): Promise<DashboardStatsDto> {
        const totalOrders = await this.orderRepository.count();
        const totalUsers = await this.userRepository.count();
        const totalProducts = await this.productRepository.count();

        const { sum } = await this.orderRepository
            .createQueryBuilder('order')
            .select('SUM(order.totalAmount)', 'sum')
            .getRawOne();

        const recentOrders = await this.orderRepository.find({
            order: { createdAt: 'DESC' },
            take: 5,
            relations: ['user'],
        });

        return {
            totalOrders,
            totalRevenue: parseFloat(sum || '0'),
            totalUsers,
            totalProducts,
            recentOrders,
        };
    }

    async logAction(dto: CreateAuditLogDto): Promise<AuditLog> {
        const log = this.auditLogRepository.create({
            ...dto,
            user: dto.userId ? { id: dto.userId } : undefined,
        });
        return this.auditLogRepository.save(log);
    }

    async getAuditLogs(limit: number = 20): Promise<AuditLog[]> {
        return this.auditLogRepository.find({
            order: { createdAt: 'DESC' },
            take: limit,
            relations: ['user'],
        });
    }
}

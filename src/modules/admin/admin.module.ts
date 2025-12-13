import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Staff } from './entities/staff.entity';
import { AuditLog } from './entities/audit-log.entity';
import { Order } from '../orders/entities/order.entity';
import { User } from '../auth/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { StaffService } from './services/staff.service';
import { AnalyticsService } from './services/analytics.service';
import { DashboardService } from './services/dashboard.service';
import { DashboardController } from './controllers/dashboard.controller';
import { StaffController } from './controllers/staff.controller';
import { AnalyticsController } from './controllers/analytics.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([Staff, AuditLog, Order, User, Product]),
    ],
    controllers: [DashboardController, StaffController, AnalyticsController],
    providers: [StaffService, AnalyticsService, DashboardService],
    exports: [StaffService, AnalyticsService],
})
export class AdminModule { }

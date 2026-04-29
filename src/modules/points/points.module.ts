import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointTransaction } from './entities/point-transaction.entity';
import { PointRule } from './entities/point-rule.entity';
import { PointRedemption } from './entities/point-redemption.entity';
import { PointTransactionRepository } from './repositories/point-transaction.repository';
import { PointRuleRepository } from './repositories/point-rule.repository';
import { PointRedemptionRepository } from './repositories/point-redemption.repository';
import { PointsService } from './services/points.service';
import { PointsAdminService } from './services/points-admin.service';
import { PointsController } from './controllers/points.controller';
import { PointsAdminController } from './controllers/points-admin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([PointTransaction, PointRule, PointRedemption]),
  ],
  controllers: [PointsController, PointsAdminController],
  providers: [
    PointsService,
    PointsAdminService,
    PointTransactionRepository,
    PointRuleRepository,
    PointRedemptionRepository,
  ],
  exports: [PointsService],
})
export class PointsModule {}

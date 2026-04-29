import { Entity, Column } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';

@Entity('point_rules')
export class PointRule extends BaseEntity {
  @Column({
    name: 'points_per_currency_spent',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  pointsPerCurrencySpent: number;

  @Column({ name: 'fixed_points_per_order', type: 'int', default: 0 })
  fixedPointsPerOrder: number;

  @Column({ name: 'expiry_days', type: 'int', default: 365 })
  expiryDays: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}

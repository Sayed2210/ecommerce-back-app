import { Entity, Column } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';

export enum RedemptionType {
  DISCOUNT = 'discount',
  FREE_ORDER = 'free_order',
  FREE_SHIPPING = 'free_shipping',
}

@Entity('point_redemptions')
export class PointRedemption extends BaseEntity {
  @Column({ type: 'enum', enum: RedemptionType })
  type: RedemptionType;

  @Column({ name: 'points_required', type: 'int' })
  pointsRequired: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  value?: number;

  @Column({
    name: 'max_order_value',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  maxOrderValue?: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}

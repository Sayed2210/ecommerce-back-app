import { Entity, Column } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';

export enum PointTransactionType {
  EARN = 'earn',
  REDEEM = 'redeem',
  EXPIRE = 'expire',
}

@Entity('point_transactions')
export class PointTransaction extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'order_id', nullable: true })
  orderId?: string;

  @Column({ type: 'enum', enum: PointTransactionType })
  type: PointTransactionType;

  @Column({ type: 'int' })
  amount: number;

  @Column({ name: 'balance_after', type: 'int' })
  balanceAfter: number;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt?: Date;

  @Column({ nullable: true })
  reason?: string;
}

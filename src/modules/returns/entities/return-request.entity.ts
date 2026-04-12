import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { User } from '@modules/auth/entities/user.entity';
import { Order } from '@modules/orders/entities/order.entity';
import { OrderItem } from '@modules/orders/entities/order-item.entity';

export enum ReturnStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    REFUNDED = 'refunded',
}

export enum ReturnReason {
    DEFECTIVE = 'defective',
    WRONG_ITEM = 'wrong_item',
    NOT_AS_DESCRIBED = 'not_as_described',
    CHANGED_MIND = 'changed_mind',
}

@Entity('return_requests')
export class ReturnRequest extends BaseEntity {
    @Column({ type: 'enum', enum: ReturnStatus, default: ReturnStatus.PENDING })
    status: ReturnStatus;

    @Column({ type: 'enum', enum: ReturnReason })
    reason: ReturnReason;

    @Column({ nullable: true, type: 'text' })
    notes?: string;

    @Column({ name: 'refund_amount', type: 'decimal', precision: 12, scale: 2 })
    refundAmount: number;

    @Column({ name: 'refund_id', nullable: true })
    refundId?: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Order, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @ManyToOne(() => OrderItem, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_item_id' })
    orderItem: OrderItem;
}

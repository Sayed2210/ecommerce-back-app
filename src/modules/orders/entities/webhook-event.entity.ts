import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';

@Entity('webhook_events')
@Index(['eventId'], { unique: true })
export class WebhookEvent extends BaseEntity {
  @Column({ name: 'event_id', unique: true })
  eventId: string;

  @Column({ name: 'event_type' })
  eventType: string;

  @Column({ type: 'jsonb', default: {} })
  payload: Record<string, any>;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt?: Date;
}

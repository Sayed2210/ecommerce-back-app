import { Entity, Column } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';

@Entity('newsletter_subscribers')
export class NewsletterSubscriber extends BaseEntity {
  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ nullable: true, length: 100 })
  name?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'unsubscribe_token', unique: true })
  unsubscribeToken: string;
}

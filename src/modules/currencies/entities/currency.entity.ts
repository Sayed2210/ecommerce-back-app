import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('currencies')
export class Currency {
  @PrimaryColumn({ length: 3 })
  code: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 10 })
  symbol: string;

  @Column({ name: 'exchange_rate', type: 'decimal', precision: 18, scale: 6 })
  exchangeRate: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;
}

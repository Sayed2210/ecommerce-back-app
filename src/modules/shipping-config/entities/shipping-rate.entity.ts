import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ShippingZone } from './shipping-zone.entity';

@Entity('shipping_rates')
export class ShippingRate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'min_weight', type: 'decimal', precision: 10, scale: 2 })
  minWeight: number;

  @Column({ name: 'max_weight', type: 'decimal', precision: 10, scale: 2 })
  maxWeight: number;

  @Column({ name: 'base_cost', type: 'decimal', precision: 12, scale: 2 })
  baseCost: number;

  @Column({
    name: 'per_kg_cost',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  perKgCost: number;

  @Column({
    name: 'free_shipping_threshold',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  freeShippingThreshold?: number;

  @ManyToOne(() => ShippingZone, (zone) => zone.rates, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'zone_id' })
  zone: ShippingZone;
}

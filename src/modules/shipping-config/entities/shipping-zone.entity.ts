import { Entity, Column, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ShippingRate } from './shipping-rate.entity';

@Entity('shipping_zones')
export class ShippingZone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'simple-array' })
  countries: string[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => ShippingRate, (rate) => rate.zone, { cascade: true })
  rates: ShippingRate[];
}

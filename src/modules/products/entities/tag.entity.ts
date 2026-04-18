import { Entity, Column, ManyToMany } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { Product } from './product.entity';

@Entity('tags')
export class Tag extends BaseEntity {
  @Column({ unique: true, length: 100 })
  name: string;

  @Column({ unique: true, length: 100 })
  slug: string;

  @ManyToMany(() => Product, (product) => product.tags)
  products: Product[];
}

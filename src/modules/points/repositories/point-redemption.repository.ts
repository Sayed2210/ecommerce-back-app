import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractRepository } from '../../../common/database/abstract.repository';
import { PointRedemption } from '../entities/point-redemption.entity';

@Injectable()
export class PointRedemptionRepository extends AbstractRepository<PointRedemption> {
  constructor(
    @InjectRepository(PointRedemption)
    private readonly redemptionRepo: Repository<PointRedemption>,
  ) {
    super(redemptionRepo);
  }

  async findActiveByType(type: string): Promise<PointRedemption | null> {
    return this.findOne({ type, isActive: true } as any);
  }
}

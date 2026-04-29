import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractRepository } from '../../../common/database/abstract.repository';
import { ShippingRate } from '../entities/shipping-rate.entity';

@Injectable()
export class ShippingRateRepository extends AbstractRepository<ShippingRate> {
  constructor(
    @InjectRepository(ShippingRate)
    private readonly rateRepo: Repository<ShippingRate>,
  ) {
    super(rateRepo);
  }

  async findApplicableRate(
    zoneId: string,
    weight: number,
  ): Promise<ShippingRate | null> {
    return this.createQueryBuilder('rate')
      .where('rate.zone_id = :zoneId', { zoneId })
      .andWhere('rate.minWeight <= :weight', { weight })
      .andWhere('rate.maxWeight >= :weight', { weight })
      .getOne();
  }
}

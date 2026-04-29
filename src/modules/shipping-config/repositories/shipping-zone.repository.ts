import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractRepository } from '../../../common/database/abstract.repository';
import { ShippingZone } from '../entities/shipping-zone.entity';

@Injectable()
export class ShippingZoneRepository extends AbstractRepository<ShippingZone> {
  constructor(
    @InjectRepository(ShippingZone)
    private readonly zoneRepo: Repository<ShippingZone>,
  ) {
    super(zoneRepo);
  }

  async findByCountry(countryCode: string): Promise<ShippingZone | null> {
    return this.createQueryBuilder('zone')
      .leftJoinAndSelect('zone.rates', 'rates')
      .where('zone.isActive = :active', { active: true })
      .andWhere(':country = ANY(zone.countries)', {
        country: countryCode.toUpperCase(),
      })
      .getOne();
  }
}

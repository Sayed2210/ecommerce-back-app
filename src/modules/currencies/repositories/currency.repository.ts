import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractRepository } from '../../../common/database/abstract.repository';
import { Currency } from '../entities/currency.entity';

@Injectable()
export class CurrencyRepository extends AbstractRepository<Currency> {
  constructor(
    @InjectRepository(Currency)
    private readonly currencyRepo: Repository<Currency>,
  ) {
    super(currencyRepo);
  }

  async findDefault(): Promise<Currency | null> {
    return this.findOne({ isDefault: true } as any);
  }

  async findActive(): Promise<Currency[]> {
    return this.findAll({ where: { isActive: true } as any });
  }
}

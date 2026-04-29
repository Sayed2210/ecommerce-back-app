import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractRepository } from '../../../common/database/abstract.repository';
import { PointRule } from '../entities/point-rule.entity';

@Injectable()
export class PointRuleRepository extends AbstractRepository<PointRule> {
  constructor(
    @InjectRepository(PointRule)
    private readonly ruleRepo: Repository<PointRule>,
  ) {
    super(ruleRepo);
  }

  async findActive(): Promise<PointRule | null> {
    return this.findOne({ isActive: true } as any);
  }
}

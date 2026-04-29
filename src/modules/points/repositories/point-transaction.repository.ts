import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { AbstractRepository } from '../../../common/database/abstract.repository';
import {
  PointTransaction,
  PointTransactionType,
} from '../entities/point-transaction.entity';

@Injectable()
export class PointTransactionRepository extends AbstractRepository<PointTransaction> {
  constructor(
    @InjectRepository(PointTransaction)
    private readonly transactionRepo: Repository<PointTransaction>,
  ) {
    super(transactionRepo);
  }

  async getUserBalance(userId: string): Promise<number> {
    const result = await this.createQueryBuilder('pt')
      .select('SUM(pt.amount)', 'balance')
      .where('pt.userId = :userId', { userId })
      .andWhere('(pt.expiresAt IS NULL OR pt.expiresAt > NOW())')
      .getRawOne();
    return Number(result?.balance || 0);
  }

  async findExpired(): Promise<PointTransaction[]> {
    return this.findAll({
      where: {
        type: PointTransactionType.EARN,
        expiresAt: LessThan(new Date()),
      } as any,
    });
  }
}

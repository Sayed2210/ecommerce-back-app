import { Injectable, BadRequestException } from '@nestjs/common';
import { PointTransactionRepository } from '../repositories/point-transaction.repository';
import { PointRuleRepository } from '../repositories/point-rule.repository';
import { PointRedemptionRepository } from '../repositories/point-redemption.repository';
import { RedeemPointsDto } from '../dtos/redeem-points.dto';
import { PointTransactionType } from '../entities/point-transaction.entity';
import { RedemptionType } from '../entities/point-redemption.entity';

@Injectable()
export class PointsService {
  constructor(
    private readonly transactionRepository: PointTransactionRepository,
    private readonly ruleRepository: PointRuleRepository,
    private readonly redemptionRepository: PointRedemptionRepository,
  ) {}

  async getBalance(userId: string): Promise<number> {
    return this.transactionRepository.getUserBalance(userId);
  }

  async earnPoints(
    userId: string,
    orderId: string,
    orderTotal: number,
  ): Promise<void> {
    const rule = await this.ruleRepository.findActive();
    if (!rule) return;

    const pointsFromSpend = Math.floor(
      orderTotal * Number(rule.pointsPerCurrencySpent),
    );
    const totalPoints = pointsFromSpend + (rule.fixedPointsPerOrder || 0);

    if (totalPoints <= 0) return;

    const currentBalance = await this.getBalance(userId);

    await this.transactionRepository.create({
      userId,
      orderId,
      type: PointTransactionType.EARN,
      amount: totalPoints,
      balanceAfter: currentBalance + totalPoints,
      expiresAt: rule.expiryDays
        ? new Date(Date.now() + rule.expiryDays * 24 * 60 * 60 * 1000)
        : undefined,
      reason: `Points earned for order ${orderId}`,
    } as any);
  }

  async redeemPoints(
    userId: string,
    dto: RedeemPointsDto,
  ): Promise<{
    discountAmount: number;
    shippingFree: boolean;
    orderFree: boolean;
  }> {
    const balance = await this.getBalance(userId);
    if (balance < dto.points) {
      throw new BadRequestException('Insufficient points');
    }

    const redemption = await this.redemptionRepository.findActiveByType(
      dto.type,
    );
    if (!redemption) {
      throw new BadRequestException(
        `Redemption type ${dto.type} is not available`,
      );
    }

    if (dto.points < redemption.pointsRequired) {
      throw new BadRequestException(
        `Minimum ${redemption.pointsRequired} points required for this redemption`,
      );
    }

    const currentBalance = await this.getBalance(userId);

    await this.transactionRepository.create({
      userId,
      orderId: dto.orderId,
      type: PointTransactionType.REDEEM,
      amount: -dto.points,
      balanceAfter: currentBalance - dto.points,
      reason: `Redeemed ${dto.points} points for ${dto.type}`,
    } as any);

    return {
      discountAmount:
        dto.type === RedemptionType.DISCOUNT ? redemption.value || 0 : 0,
      shippingFree: dto.type === RedemptionType.FREE_SHIPPING,
      orderFree: dto.type === RedemptionType.FREE_ORDER,
    };
  }

  async getTransactions(userId: string) {
    return this.transactionRepository.findAll({
      where: { userId } as any,
      order: { createdAt: 'DESC' } as any,
    });
  }
}

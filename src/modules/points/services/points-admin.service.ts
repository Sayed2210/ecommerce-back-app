import { Injectable, NotFoundException } from '@nestjs/common';
import { PointRuleRepository } from '../repositories/point-rule.repository';
import { PointRedemptionRepository } from '../repositories/point-redemption.repository';
import { CreatePointRuleDto } from '../dtos/create-point-rule.dto';
import { UpdatePointRuleDto } from '../dtos/update-point-rule.dto';
import { CreateRedemptionDto } from '../dtos/create-redemption.dto';
import { UpdateRedemptionDto } from '../dtos/update-redemption.dto';
import { PaginationDto } from '@common/dtos/pagination.dto';

@Injectable()
export class PointsAdminService {
  constructor(
    private readonly ruleRepository: PointRuleRepository,
    private readonly redemptionRepository: PointRedemptionRepository,
  ) {}

  // Point Rules
  async createRule(dto: CreatePointRuleDto) {
    return this.ruleRepository.create(dto as any);
  }

  async findAllRules(pagination: PaginationDto) {
    return this.ruleRepository.findWithPagination(
      pagination.page,
      pagination.limit,
    );
  }

  async findRuleById(id: string) {
    const rule = await this.ruleRepository.findOne({ id } as any);
    if (!rule) throw new NotFoundException('Point rule not found');
    return rule;
  }

  async updateRule(id: string, dto: UpdatePointRuleDto) {
    await this.findRuleById(id);
    return this.ruleRepository.update(id, dto as any);
  }

  async removeRule(id: string) {
    await this.findRuleById(id);
    await this.ruleRepository.softDelete(id);
    return { message: 'Point rule removed successfully' };
  }

  // Redemptions
  async createRedemption(dto: CreateRedemptionDto) {
    return this.redemptionRepository.create(dto as any);
  }

  async findAllRedemptions(pagination: PaginationDto) {
    return this.redemptionRepository.findWithPagination(
      pagination.page,
      pagination.limit,
    );
  }

  async findRedemptionById(id: string) {
    const redemption = await this.redemptionRepository.findOne({ id } as any);
    if (!redemption) throw new NotFoundException('Redemption not found');
    return redemption;
  }

  async updateRedemption(id: string, dto: UpdateRedemptionDto) {
    await this.findRedemptionById(id);
    return this.redemptionRepository.update(id, dto as any);
  }

  async removeRedemption(id: string) {
    await this.findRedemptionById(id);
    await this.redemptionRepository.softDelete(id);
    return { message: 'Redemption removed successfully' };
  }
}

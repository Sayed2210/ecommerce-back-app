import { Injectable, NotFoundException } from '@nestjs/common';
import { ShippingZoneRepository } from '../repositories/shipping-zone.repository';
import { ShippingRateRepository } from '../repositories/shipping-rate.repository';
import { CreateShippingZoneDto } from '../dtos/create-shipping-zone.dto';
import { UpdateShippingZoneDto } from '../dtos/update-shipping-zone.dto';
import { CreateShippingRateDto } from '../dtos/create-shipping-rate.dto';
import { UpdateShippingRateDto } from '../dtos/update-shipping-rate.dto';
import { PaginationDto } from '@common/dtos/pagination.dto';

@Injectable()
export class ShippingConfigService {
  constructor(
    private readonly zoneRepository: ShippingZoneRepository,
    private readonly rateRepository: ShippingRateRepository,
  ) {}

  // Zones
  async createZone(dto: CreateShippingZoneDto) {
    return this.zoneRepository.create(dto as any);
  }

  async findAllZones(pagination: PaginationDto) {
    return this.zoneRepository.findWithPagination(
      pagination.page,
      pagination.limit,
    );
  }

  async findZoneById(id: string) {
    const zone = await this.zoneRepository.findOneWithOptions({
      where: { id },
      relations: ['rates'],
    });
    if (!zone) throw new NotFoundException('Shipping zone not found');
    return zone;
  }

  async updateZone(id: string, dto: UpdateShippingZoneDto) {
    await this.findZoneById(id);
    return this.zoneRepository.update(id, dto as any);
  }

  async removeZone(id: string) {
    await this.findZoneById(id);
    await this.zoneRepository.softDelete(id);
    return { message: 'Shipping zone removed successfully' };
  }

  // Rates
  async createRate(dto: CreateShippingRateDto) {
    await this.findZoneById(dto.zoneId);
    return this.rateRepository.create(dto as any);
  }

  async updateRate(id: string, dto: UpdateShippingRateDto) {
    const rate = await this.rateRepository.findOne({ id } as any);
    if (!rate) throw new NotFoundException('Shipping rate not found');
    return this.rateRepository.update(id, dto as any);
  }

  async removeRate(id: string) {
    const rate = await this.rateRepository.findOne({ id } as any);
    if (!rate) throw new NotFoundException('Shipping rate not found');
    await this.rateRepository.permanentDelete(id);
    return { message: 'Shipping rate removed successfully' };
  }

  async calculateShipping(
    countryCode: string,
    weight: number,
    orderValue: number,
  ): Promise<number> {
    const zone = await this.zoneRepository.findByCountry(countryCode);
    if (!zone || !zone.rates || zone.rates.length === 0) {
      return 0;
    }

    const rate = zone.rates.find(
      (r) => weight >= Number(r.minWeight) && weight <= Number(r.maxWeight),
    );
    if (!rate) {
      return 0;
    }

    if (
      rate.freeShippingThreshold &&
      orderValue >= Number(rate.freeShippingThreshold)
    ) {
      return 0;
    }

    const cost = Number(rate.baseCost) + Number(rate.perKgCost || 0) * weight;
    return Math.round(cost * 100) / 100;
  }
}

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipping, ShippingStatus } from '../entities/shipping.entity';
import { Address } from '../../users/entities/address.entity';
import { ShippingConfigService } from '../../shipping-config/services/shipping-config.service';

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);

  constructor(
    @InjectRepository(Shipping)
    private readonly shippingRepository: Repository<Shipping>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    private readonly configService: ConfigService,
    private readonly shippingConfigService: ShippingConfigService,
  ) {}

  async calculateShipping(
    addressId: string,
    orderValue: number,
    orderWeight: number = 0,
  ): Promise<number> {
    const address = await this.addressRepository.findOne({
      where: { id: addressId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    const configCost = await this.shippingConfigService.calculateShipping(
      address.country,
      orderWeight,
      orderValue,
    );

    if (configCost > 0) {
      return configCost;
    }

    // Fallback to legacy config-based logic
    const freeShippingThreshold = this.configService.get<number>(
      'FREE_SHIPPING_THRESHOLD',
      100,
    );

    if (orderValue >= freeShippingThreshold) {
      return 0;
    }

    const baseCost = 10;
    const regionMultiplier = address.country === 'US' ? 1 : 1.5;

    return Math.round(baseCost * regionMultiplier * 100) / 100;
  }

  async createShippingRecord(orderId: string, addressId: string, cost: number) {
    const address = await this.addressRepository.findOne({
      where: { id: addressId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    const trackingNumber = this.generateTrackingNumber();

    return this.shippingRepository.create({
      order: { id: orderId },
      address,
      cost,
      trackingNumber,
      status: ShippingStatus.PENDING,
    });
  }

  async updateShippingStatus(
    orderId: string,
    status: ShippingStatus,
    trackingUrl?: string,
  ) {
    const shipping = await this.shippingRepository.findOne({
      where: { order: { id: orderId } },
    });

    if (!shipping) {
      throw new NotFoundException('Shipping record not found');
    }

    shipping.status = status;
    if (trackingUrl) {
      shipping.trackingUrl = trackingUrl;
    }

    return this.shippingRepository.save(shipping);
  }

  private generateTrackingNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 9).toUpperCase();
    return `TRK-${timestamp}-${random}`;
  }
}

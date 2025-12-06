import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipping, ShippingStatus } from '../entities/shipping.entity';
import { Address } from '../../users/entities/address.entity';

@Injectable()
export class ShippingService {
    private readonly logger = new Logger(ShippingService.name);

    constructor(
        @InjectRepository(Shipping)
        private readonly shippingRepository: Repository<Shipping>,
        @InjectRepository(Address)
        private readonly addressRepository: Repository<Address>,
        private readonly configService: ConfigService,
    ) { }

    async calculateShipping(addressId: string, orderValue: number): Promise<number> {
        const address = await this.addressRepository.findOne({
            where: { id: addressId },
        });

        if (!address) {
            throw new NotFoundException('Address not found');
        }

        // Simple shipping calculation logic
        const freeShippingThreshold = this.configService.get<number>('FREE_SHIPPING_THRESHOLD', 100);

        if (orderValue >= freeShippingThreshold) {
            return 0; // Free shipping
        }

        // Base shipping cost varies by country/region
        const baseCost = 10;
        const regionMultiplier = address.country === 'US' ? 1 : 1.5;

        return Math.round(baseCost * regionMultiplier * 100) / 100;
    }

    async createShippingRecord(orderId: string, addressId: string, cost: number) {
        const address = await this.addressRepository.findOne({ where: { id: addressId } });

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

    async updateShippingStatus(orderId: string, status: ShippingStatus, trackingUrl?: string) {
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
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShippingZone } from './entities/shipping-zone.entity';
import { ShippingRate } from './entities/shipping-rate.entity';
import { ShippingZoneRepository } from './repositories/shipping-zone.repository';
import { ShippingRateRepository } from './repositories/shipping-rate.repository';
import { ShippingConfigService } from './services/shipping-config.service';
import { ShippingConfigController } from './controllers/shipping-config.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ShippingZone, ShippingRate])],
  controllers: [ShippingConfigController],
  providers: [
    ShippingConfigService,
    ShippingZoneRepository,
    ShippingRateRepository,
  ],
  exports: [ShippingConfigService],
})
export class ShippingConfigModule {}

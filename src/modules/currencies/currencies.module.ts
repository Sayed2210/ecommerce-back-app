import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Currency } from './entities/currency.entity';
import { CurrencyRepository } from './repositories/currency.repository';
import { CurrenciesService } from './services/currencies.service';
import { CurrenciesController } from './controllers/currencies.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Currency])],
  controllers: [CurrenciesController],
  providers: [CurrenciesService, CurrencyRepository],
  exports: [CurrenciesService],
})
export class CurrenciesModule {}

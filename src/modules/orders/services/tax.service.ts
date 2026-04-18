import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface TaxResult {
  rate: number;
  taxAmount: number;
}

@Injectable()
export class TaxService {
  private readonly logger = new Logger(TaxService.name);
  private readonly defaultRate: number;
  private readonly ratesByCountry: Record<string, number>;

  constructor(private readonly configService: ConfigService) {
    this.defaultRate =
      parseFloat(this.configService.get('DEFAULT_TAX_RATE', '0')) || 0;

    const taxRatesJson = this.configService.get<string>('TAX_RATES');
    if (taxRatesJson) {
      try {
        this.ratesByCountry = JSON.parse(taxRatesJson);
      } catch {
        this.logger.warn(
          'TAX_RATES env var is not valid JSON — using default rate only',
        );
        this.ratesByCountry = {};
      }
    } else {
      this.ratesByCountry = {};
    }
  }

  calculate(taxableAmount: number, countryCode?: string): TaxResult {
    const rate = countryCode
      ? (this.ratesByCountry[countryCode.toUpperCase()] ?? this.defaultRate)
      : this.defaultRate;

    const taxAmount = Math.round(taxableAmount * rate * 100) / 100;

    return { rate, taxAmount };
  }
}

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TaxService } from '../services/tax.service';

const makeConfigService = (values: Record<string, string>) =>
  ({
    get: jest.fn((key: string, fallback?: string) => values[key] ?? fallback),
  }) as any;

describe('TaxService', () => {
  describe('with default rate only', () => {
    let service: TaxService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          TaxService,
          {
            provide: ConfigService,
            useValue: makeConfigService({ DEFAULT_TAX_RATE: '0.1' }),
          },
        ],
      }).compile();
      service = module.get<TaxService>(TaxService);
    });

    it('applies default rate when no country supplied', () => {
      const { rate, taxAmount } = service.calculate(100);
      expect(rate).toBe(0.1);
      expect(taxAmount).toBe(10);
    });

    it('falls back to default rate for unknown country', () => {
      const { rate, taxAmount } = service.calculate(200, 'ZZ');
      expect(rate).toBe(0.1);
      expect(taxAmount).toBe(20);
    });

    it('rounds taxAmount to two decimal places', () => {
      const { taxAmount } = service.calculate(33.33, undefined);
      expect(taxAmount).toBe(3.33);
    });
  });

  describe('with per-country rates', () => {
    let service: TaxService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          TaxService,
          {
            provide: ConfigService,
            useValue: makeConfigService({
              DEFAULT_TAX_RATE: '0.05',
              TAX_RATES: JSON.stringify({ US: 0.08, GB: 0.2 }),
            }),
          },
        ],
      }).compile();
      service = module.get<TaxService>(TaxService);
    });

    it('uses country-specific rate for US', () => {
      const { rate, taxAmount } = service.calculate(100, 'US');
      expect(rate).toBe(0.08);
      expect(taxAmount).toBe(8);
    });

    it('uses country-specific rate for GB', () => {
      const { rate, taxAmount } = service.calculate(100, 'GB');
      expect(rate).toBe(0.2);
      expect(taxAmount).toBe(20);
    });

    it('is case-insensitive for country code', () => {
      const { rate } = service.calculate(100, 'us');
      expect(rate).toBe(0.08);
    });

    it('falls back to default rate for unknown country', () => {
      const { rate } = service.calculate(100, 'AU');
      expect(rate).toBe(0.05);
    });
  });

  describe('with zero default rate', () => {
    let service: TaxService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          TaxService,
          { provide: ConfigService, useValue: makeConfigService({}) },
        ],
      }).compile();
      service = module.get<TaxService>(TaxService);
    });

    it('returns zero tax when DEFAULT_TAX_RATE is not set', () => {
      const { rate, taxAmount } = service.calculate(500);
      expect(rate).toBe(0);
      expect(taxAmount).toBe(0);
    });
  });

  describe('with invalid TAX_RATES JSON', () => {
    let service: TaxService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          TaxService,
          {
            provide: ConfigService,
            useValue: makeConfigService({
              DEFAULT_TAX_RATE: '0.1',
              TAX_RATES: 'not-json',
            }),
          },
        ],
      }).compile();
      service = module.get<TaxService>(TaxService);
    });

    it('falls back to default rate when TAX_RATES JSON is invalid', () => {
      const { rate } = service.calculate(100, 'US');
      expect(rate).toBe(0.1);
    });
  });
});

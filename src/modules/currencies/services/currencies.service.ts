import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CurrencyRepository } from '../repositories/currency.repository';
import { CreateCurrencyDto } from '../dtos/create-currency.dto';
import { UpdateCurrencyDto } from '../dtos/update-currency.dto';
import { PaginationDto } from '@common/dtos/pagination.dto';

@Injectable()
export class CurrenciesService {
  constructor(private readonly currencyRepository: CurrencyRepository) {}

  async create(dto: CreateCurrencyDto) {
    const existing = await this.currencyRepository.findOne({
      code: dto.code,
    } as any);
    if (existing) {
      throw new ConflictException(`Currency ${dto.code} already exists`);
    }

    if (dto.isDefault) {
      await this.clearDefaultFlag();
    }

    return this.currencyRepository.create(dto as any);
  }

  async findAll(pagination: PaginationDto) {
    return this.currencyRepository.findWithPagination(
      pagination.page,
      pagination.limit,
    );
  }

  async findOne(code: string) {
    const currency = await this.currencyRepository.findOne({ code } as any);
    if (!currency) throw new NotFoundException(`Currency ${code} not found`);
    return currency;
  }

  async findActive() {
    return this.currencyRepository.findActive();
  }

  async findDefault() {
    const currency = await this.currencyRepository.findDefault();
    if (!currency) throw new NotFoundException('Default currency not set');
    return currency;
  }

  async update(code: string, dto: UpdateCurrencyDto) {
    await this.findOne(code);

    if (dto.isDefault) {
      await this.clearDefaultFlag();
    }

    return this.currencyRepository.update(code, dto as any);
  }

  async remove(code: string) {
    await this.findOne(code);
    await this.currencyRepository.permanentDelete(code);
    return { message: 'Currency removed successfully' };
  }

  async convert(
    amount: number,
    fromCode: string,
    toCode: string,
  ): Promise<number> {
    if (fromCode === toCode) return amount;

    const from = await this.findOne(fromCode);
    const to = await this.findOne(toCode);

    const amountInBase = amount / from.exchangeRate;
    return Math.round(amountInBase * to.exchangeRate * 100) / 100;
  }

  private async clearDefaultFlag() {
    const defaultCurrency = await this.currencyRepository.findDefault();
    if (defaultCurrency) {
      await this.currencyRepository.update(defaultCurrency.code, {
        isDefault: false,
      } as any);
    }
  }
}

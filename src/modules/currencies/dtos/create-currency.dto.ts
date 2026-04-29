import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCurrencyDto {
  @ApiProperty({ example: 'EGP', description: 'ISO 4217 currency code' })
  @IsString()
  @IsNotEmpty()
  @Length(3, 3)
  code: string;

  @ApiProperty({ example: 'Egyptian Pound' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '£' })
  @IsString()
  @IsNotEmpty()
  symbol: string;

  @ApiProperty({
    example: 30.9,
    description: 'Exchange rate relative to base currency (USD)',
  })
  @IsNumber()
  exchangeRate: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

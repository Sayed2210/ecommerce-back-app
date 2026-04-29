import { IsNumber, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShippingRateDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  zoneId: string;

  @ApiProperty({ example: 0 })
  @IsNumber()
  minWeight: number;

  @ApiProperty({ example: 5 })
  @IsNumber()
  maxWeight: number;

  @ApiProperty({ example: 10 })
  @IsNumber()
  baseCost: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  perKgCost?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  freeShippingThreshold?: number;
}

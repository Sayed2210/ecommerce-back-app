import { IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePointRuleDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(0)
  pointsPerCurrencySpent: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedPointsPerOrder?: number;

  @ApiPropertyOptional({ example: 365 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  expiryDays?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

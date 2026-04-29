import { IsEnum, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RedemptionType } from '../entities/point-redemption.entity';

export class CreateRedemptionDto {
  @ApiProperty({ enum: RedemptionType })
  @IsEnum(RedemptionType)
  type: RedemptionType;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(1)
  pointsRequired: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @ApiPropertyOptional({ example: 200 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxOrderValue?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

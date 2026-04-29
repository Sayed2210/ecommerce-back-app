import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RedemptionType } from '../entities/point-redemption.entity';

export class RedeemPointsDto {
  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(1)
  points: number;

  @ApiProperty({ enum: RedemptionType })
  @IsEnum(RedemptionType)
  type: RedemptionType;

  @ApiPropertyOptional({ example: 'ORD-123' })
  @IsOptional()
  orderId?: string;
}

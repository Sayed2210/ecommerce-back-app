import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReturnReason } from '../entities/return-request.entity';

export class CreateReturnDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsUUID()
  @IsNotEmpty()
  orderItemId: string;

  @ApiProperty({ enum: ReturnReason, example: ReturnReason.DEFECTIVE })
  @IsEnum(ReturnReason)
  reason: ReturnReason;

  @ApiProperty({ required: false, example: 'Item arrived broken' })
  @IsString()
  @IsOptional()
  notes?: string;
}

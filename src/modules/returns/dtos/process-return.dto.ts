import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReturnStatus } from '../entities/return-request.entity';

export class ProcessReturnDto {
  @ApiProperty({ enum: [ReturnStatus.APPROVED, ReturnStatus.REJECTED] })
  @IsEnum([ReturnStatus.APPROVED, ReturnStatus.REJECTED])
  @IsNotEmpty()
  status: ReturnStatus.APPROVED | ReturnStatus.REJECTED;
}

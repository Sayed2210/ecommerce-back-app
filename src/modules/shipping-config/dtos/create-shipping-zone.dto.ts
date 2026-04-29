import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShippingZoneDto {
  @ApiProperty({ example: 'Middle East' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: ['EG', 'SA', 'AE'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  countries: string[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

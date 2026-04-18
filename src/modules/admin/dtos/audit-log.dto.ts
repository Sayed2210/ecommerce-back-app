import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsObject,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAuditLogDto {
  @ApiProperty({ description: 'The action performed' })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiPropertyOptional({ description: 'The type of resource' })
  @IsString()
  @IsOptional()
  resourceType?: string;

  @ApiPropertyOptional({ description: 'The ID of the resource' })
  @IsString()
  @IsOptional()
  resourceId?: string;

  @ApiPropertyOptional({ description: 'Previous values before change' })
  @IsObject()
  @IsOptional()
  oldValues?: Record<string, any>;

  @ApiPropertyOptional({ description: 'New values after change' })
  @IsObject()
  @IsOptional()
  newValues?: Record<string, any>;

  @ApiPropertyOptional({ description: 'IP address of the user' })
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'User agent string' })
  @IsString()
  @IsOptional()
  userAgent?: string;

  @ApiPropertyOptional({
    description: 'ID of the user who performed the action',
  })
  @IsUUID()
  @IsOptional()
  userId?: string;
}

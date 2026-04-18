import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubscribeDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ required: false, example: 'John Doe' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;
}

export class SendCampaignDto {
  @ApiProperty({ example: 'Summer Sale — 20% off everything!' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ example: '<h1>Summer sale is here</h1>' })
  @IsString()
  @IsNotEmpty()
  content: string;
}

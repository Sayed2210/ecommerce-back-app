import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTagDto {
  @ApiProperty({ example: 'new-arrival' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}

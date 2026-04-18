import { IsString, IsOptional } from 'class-validator';

export class TranslatableString {
  @IsString()
  en: string;

  @IsString()
  @IsOptional()
  ar?: string;
}

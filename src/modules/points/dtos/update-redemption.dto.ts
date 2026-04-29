import { PartialType } from '@nestjs/mapped-types';
import { CreateRedemptionDto } from './create-redemption.dto';

export class UpdateRedemptionDto extends PartialType(CreateRedemptionDto) {}

import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../entities/order.entity';

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'New order status',
    enum: OrderStatus,
    example: OrderStatus.SHIPPED,
  })
  @IsEnum(OrderStatus)
  @IsNotEmpty()
  status: OrderStatus;
}

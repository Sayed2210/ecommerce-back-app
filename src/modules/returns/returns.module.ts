import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReturnRequest } from './entities/return-request.entity';
import { ReturnsService } from './services/returns.service';
import { ReturnsController } from './controllers/returns.controller';
import { Order } from '@modules/orders/entities/order.entity';
import { OrderItem } from '@modules/orders/entities/order-item.entity';

@Module({
    imports: [TypeOrmModule.forFeature([ReturnRequest, Order, OrderItem])],
    controllers: [ReturnsController],
    providers: [ReturnsService],
    exports: [ReturnsService],
})
export class ReturnsModule {}

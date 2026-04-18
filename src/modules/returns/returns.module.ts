import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReturnRequest } from './entities/return-request.entity';
import { ReturnsService } from './services/returns.service';
import { ReturnsController } from './controllers/returns.controller';
import { ReturnRequestRepository } from './repositories/return-request.repository';
import { Order } from '@modules/orders/entities/order.entity';
import { OrderItem } from '@modules/orders/entities/order-item.entity';
import { MailerService } from '@infrastructure/email/mailer.service';

@Module({
  imports: [TypeOrmModule.forFeature([ReturnRequest, Order, OrderItem])],
  controllers: [ReturnsController],
  providers: [ReturnsService, ReturnRequestRepository, MailerService],
  exports: [ReturnsService],
})
export class ReturnsModule {}

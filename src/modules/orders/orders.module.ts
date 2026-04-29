import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './controllers/orders.controller';
import { CheckoutController } from './controllers/checkout.controller';
import { CouponsController } from './controllers/coupons.controller';
import { OrdersService } from './services/orders.service';
import { CheckoutService } from './services/checkout.service';
import { PaymentService } from './services/payment.service';
import { ShippingService } from './services/shipping.service';
import { CouponService } from './services/coupon.service';
import { TaxService } from './services/tax.service';
import { InvoiceService } from './services/invoice.service';
import { OrderRepository } from './repositories/order.repository';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Payment } from './entities/payment.entity';
import { Shipping } from './entities/shipping.entity';
import { Coupon } from './entities/coupon.entity';
import { WebhookEvent } from './entities/webhook-event.entity';
import { CartModule } from '../cart/cart.module';
import { UsersModule } from '../users/users.module';
import { CurrenciesModule } from '../currencies/currencies.module';
import { ShippingConfigModule } from '../shipping-config/shipping-config.module';
import { PointsModule } from '../points/points.module';
import { SendInvoiceProcessor } from './jobs/send-invoice.job';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      Payment,
      Shipping,
      Coupon,
      WebhookEvent,
    ]),
    CartModule,
    UsersModule,
    CurrenciesModule,
    ShippingConfigModule,
    PointsModule,
  ],
  controllers: [OrdersController, CheckoutController, CouponsController],
  providers: [
    OrdersService,
    CheckoutService,
    PaymentService,
    ShippingService,
    TaxService,
    CouponService,
    InvoiceService,
    SendInvoiceProcessor,
    OrderRepository,
  ],
  exports: [OrdersService, OrderRepository, PaymentService, InvoiceService],
})
export class OrdersModule {}

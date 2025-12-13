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
import { OrderRepository } from './repositories/order.repository';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Payment } from './entities/payment.entity';
import { Shipping } from './entities/shipping.entity';
import { Coupon } from './entities/coupon.entity';
import { CartModule } from '../cart/cart.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Order, OrderItem, Payment, Shipping, Coupon]),
        CartModule,
        UsersModule,
    ],
    controllers: [OrdersController, CheckoutController, CouponsController],
    providers: [
        OrdersService,
        CheckoutService,
        PaymentService,
        ShippingService,
        CouponService,
        OrderRepository,
    ],
    exports: [OrdersService, OrderRepository],
})
export class OrdersModule { }

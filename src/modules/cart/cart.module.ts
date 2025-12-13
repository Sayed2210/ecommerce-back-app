import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartController } from './controllers/cart.controller';
import { CartService } from './services/cart.service';
import { CartRepository } from './repositories/cart.repository';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { ProductsModule } from '../products/products.module';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Cart, CartItem]),
        ProductsModule,
        NotificationsModule,
    ],
    controllers: [CartController],
    providers: [CartService, CartRepository],
    exports: [CartService, CartRepository],
})
export class CartModule { }

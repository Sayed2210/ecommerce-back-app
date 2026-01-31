import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport'; // Added
import { UsersService } from './services/users.service';
import { UsersController } from './controllers/users.controller';
import { User } from '../auth/entities/user.entity';
import { Address } from './entities/address.entity';
import { Wishlist } from './entities/wishlist.entity';
import { WishlistController } from './controllers/wishlist.controller';
import { WishlistService } from './services/wishlist.service';
import { UserRepository } from './repositories/user.repository';
import { ProductsModule } from '../products/products.module';
// import { OAuthProvider } from './entities/oauth-provider.entity'; // Assuming it exists

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Address, Wishlist]),
        ProductsModule,
        PassportModule, // Changed from .register to avoid potential isolation issues
    ],
    controllers: [UsersController, WishlistController],
    providers: [UsersService, UserRepository, WishlistService],
    exports: [UsersService, UserRepository, TypeOrmModule], // Export TypeOrmModule to allow access to Address entity
})
export class UsersModule { }

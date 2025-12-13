import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './services/products.service';
import { ProductsController } from './controllers/products.controller';
import { Product } from './entities/product.entity';
import { ProductRepository } from './repositories/product.repository';
import { Category } from './entities/category.entity';
import { CategoryRepository } from './repositories/category.repository';
import { ProductVariantRepository } from './repositories/variant.repository';
import { ProductVariant } from './entities/product-variant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Category, ProductVariant])],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    ProductRepository,
    CategoryRepository,
    ProductVariantRepository,
    // ... other repositories
  ],
  exports: [ProductRepository, CategoryRepository, ProductVariantRepository],
})
export class ProductsModule { }
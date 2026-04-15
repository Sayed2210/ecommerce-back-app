import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './services/products.service';
import { TagsService } from './services/tags.service';
import { InventoryService } from './services/inventory.service';
import { CategoriesService } from './services/categories.service';
import { BrandsService } from './services/brands.service';
import { ProductsController } from './controllers/products.controller';
import { TagsController } from './controllers/tags.controller';
import { CategoriesController } from './controllers/categories.controller';
import { BrandsController } from './controllers/brands.controller';
import { Product } from './entities/product.entity';
import { ProductRepository } from './repositories/product.repository';
import { Category } from './entities/category.entity';
import { CategoryRepository } from './repositories/category.repository';
import { ProductVariantRepository } from './repositories/variant.repository';
import { ProductVariant } from './entities/product-variant.entity';
import { Tag } from './entities/tag.entity';
import { InventoryLog } from './entities/inventory-log.entity';
import { Brand } from './entities/brand.entity';
import { BrandRepository } from './repositories/brand.repository';
import { InventoryAlertWorker } from './workers/inventory-alert.worker';
import { MailerService } from '@infrastructure/email/mailer.service';

@Module({
    imports: [TypeOrmModule.forFeature([Product, Category, ProductVariant, Tag, InventoryLog, Brand])],
    controllers: [ProductsController, TagsController, CategoriesController, BrandsController],
    providers: [
        ProductsService,
        TagsService,
        InventoryService,
        CategoriesService,
        BrandsService,
        InventoryAlertWorker,
        MailerService,
        ProductRepository,
        CategoryRepository,
        ProductVariantRepository,
        BrandRepository,
    ],
    exports: [ProductRepository, CategoryRepository, ProductVariantRepository, TagsService, BrandsService],
})
export class ProductsModule {}

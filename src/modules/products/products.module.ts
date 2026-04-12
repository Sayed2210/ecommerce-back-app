import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './services/products.service';
import { TagsService } from './services/tags.service';
import { InventoryService } from './services/inventory.service';
import { ProductsController } from './controllers/products.controller';
import { TagsController } from './controllers/tags.controller';
import { Product } from './entities/product.entity';
import { ProductRepository } from './repositories/product.repository';
import { Category } from './entities/category.entity';
import { CategoryRepository } from './repositories/category.repository';
import { ProductVariantRepository } from './repositories/variant.repository';
import { ProductVariant } from './entities/product-variant.entity';
import { Tag } from './entities/tag.entity';
import { InventoryLog } from './entities/inventory-log.entity';
import { InventoryAlertWorker } from './workers/inventory-alert.worker';
import { MailerService } from '@infrastructure/email/mailer.service';

@Module({
    imports: [TypeOrmModule.forFeature([Product, Category, ProductVariant, Tag, InventoryLog])],
    controllers: [ProductsController, TagsController],
    providers: [
        ProductsService,
        TagsService,
        InventoryService,
        InventoryAlertWorker,
        MailerService,
        ProductRepository,
        CategoryRepository,
        ProductVariantRepository,
    ],
    exports: [ProductRepository, CategoryRepository, ProductVariantRepository, TagsService],
})
export class ProductsModule {}

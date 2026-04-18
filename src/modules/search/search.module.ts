import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchService } from './services/search.service';
import { ElasticsearchService } from './services/elasticsearch.service';
import { SearchController } from './controllers/search.controller';
import { Product } from '@modules/products/entities/product.entity';

@Module({
    imports: [ConfigModule, TypeOrmModule.forFeature([Product])],
    controllers: [SearchController],
    providers: [SearchService, ElasticsearchService],
    exports: [SearchService, ElasticsearchService],
})
export class SearchModule { }

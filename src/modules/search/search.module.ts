import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SearchService } from './services/search.service';
import { ElasticsearchService } from './services/elasticsearch.service';
import { SearchController } from './controllers/search.controller';

@Module({
    imports: [ConfigModule],
    controllers: [SearchController],
    providers: [SearchService, ElasticsearchService],
    exports: [SearchService, ElasticsearchService],
})
export class SearchModule { }

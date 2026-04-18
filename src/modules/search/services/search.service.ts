import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ElasticsearchService } from './elasticsearch.service';
import { SearchDto } from '../dtos/search.dto';
import { Product } from '@modules/products/entities/product.entity';

@Injectable()
export class SearchService {
    private readonly logger = new Logger(SearchService.name);

    constructor(
        private readonly elasticsearchService: ElasticsearchService,
        @InjectRepository(Product)
        private readonly productRepo: Repository<Product>,
    ) {}

    async search(dto: SearchDto) {
        return this.elasticsearchService.search(dto.query || '', dto);
    }

    async reindexAll(): Promise<{ indexed: number; errors: number }> {
        this.logger.log('Starting full product reindex...');

        const products = await this.productRepo.find({
            relations: ['category', 'brand'],
        });

        const result = await this.elasticsearchService.bulkIndex(products);
        this.logger.log(`Reindex complete: ${result.indexed} indexed, ${result.errors} errors`);
        return result;
    }
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';
import { Product } from '@modules/products/entities/product.entity';

interface SearchFilters {
    category?: string;
    brands?: string[];
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    sortBy?: string;
    page: number;
    limit: number;
}

@Injectable()
export class ElasticsearchService {
    private readonly client: Client;

    constructor(private configService: ConfigService) {
        const node = configService.get('ELASTICSEARCH_NODE') || 'http://localhost:9200';
        const apiKey = configService.get('ELASTICSEARCH_API_KEY');

        this.client = new Client({
            node,
            ...(apiKey && { auth: { apiKey } }),
        });
    }

    async indexProduct(product: Product) {
        await this.client.index({
            index: 'products',
            id: product.id,
            body: {
                name: product.name,
                description: product.description,
                shortDescription: product.shortDescription,
                category: product.category.name,
                brand: product.brand.name,
                price: product.basePrice,
                isActive: product.isActive,
                stock: product.inventoryQuantity,
                seoKeywords: product.seoKeywords,
                createdAt: product.createdAt,
                metadata: product.metadata,
            },
        });
    }

    async search(query: string, filters: SearchFilters) {
        const mustQueries = [];

        // Full-text search on name and description
        if (query) {
            mustQueries.push({
                multi_match: {
                    query,
                    fields: ['name^3', 'shortDescription^2', 'description', 'seoKeywords'],
                    type: 'best_fields',
                    fuzziness: 'AUTO',
                },
            });
        }

        // Category filter
        if (filters.category) {
            mustQueries.push({ term: { category: filters.category } });
        }

        // Brand filter
        if (filters.brands?.length) {
            mustQueries.push({ terms: { brand: filters.brands } });
        }

        // Price range
        if (filters.minPrice || filters.maxPrice) {
            mustQueries.push({
                range: {
                    price: {
                        gte: filters.minPrice || 0,
                        lte: filters.maxPrice || 999999,
                    },
                },
            });
        }

        // Stock filter
        if (filters.inStock) {
            mustQueries.push({ range: { stock: { gt: 0 } } });
        }

        const result = await this.client.search({
            index: 'products',
            from: (filters.page - 1) * filters.limit,
            size: filters.limit,
            body: {
                query: {
                    bool: {
                        must: mustQueries,
                        filter: [{ term: { isActive: true } }],
                    },
                },
                sort: this.getSortClause(filters.sortBy),
            },
        } as any);

        const total = typeof result.hits.total === 'number' ? result.hits.total : result.hits.total?.value || 0;

        return {
            products: result.hits.hits.map(hit => hit._source),
            total,
        };
    }

    private getSortClause(sortBy: string) {
        switch (sortBy) {
            case 'price-low':
                return [{ price: { order: 'asc' as const } }];
            case 'price-high':
                return [{ price: { order: 'desc' as const } }];
            case 'newest':
                return [{ createdAt: { order: 'desc' as const } }];
            case 'rating':
                return [{ 'metadata.avgRating': { order: 'desc' as const } }];
            default:
                return [{ _score: { order: 'desc' as const } }]; // Relevance
        }
    }
}
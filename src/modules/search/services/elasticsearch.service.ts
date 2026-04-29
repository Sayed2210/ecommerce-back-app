import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';
import { Product } from '@modules/products/entities/product.entity';
import { PaginatedResponseDto } from '@common/dtos/paginated-response.dto';

const PRODUCTS_INDEX = 'products';

interface SearchFilters {
  category?: string;
  brands?: string[];
  tags?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page: number;
  limit: number;
}

@Injectable()
export class ElasticsearchService implements OnModuleInit {
  private readonly logger = new Logger(ElasticsearchService.name);
  private readonly client: Client;

  constructor(private configService: ConfigService) {
    const node =
      configService.get('ELASTICSEARCH_NODE') || 'http://localhost:9200';
    const apiKey = configService.get('ELASTICSEARCH_API_KEY');

    this.client = new Client({
      node,
      ...(apiKey && { auth: { apiKey } }),
    });
  }

  async onModuleInit() {
    await this.ensureIndex();
  }

  // ── Index management ───────────────────────────────────────────────────────

  async ensureIndex(): Promise<void> {
    try {
      const exists = await this.client.indices.exists({
        index: PRODUCTS_INDEX,
      });
      if (!exists) {
        await this.client.indices.create({
          index: PRODUCTS_INDEX,
          body: {
            mappings: {
              properties: {
                name: { type: 'object' },
                description: { type: 'object' },
                shortDescription: { type: 'object' },
                category: { type: 'keyword' },
                brand: { type: 'keyword' },
                price: { type: 'float' },
                isActive: { type: 'boolean' },
                stock: { type: 'integer' },
                seoKeywords: { type: 'object' },
                createdAt: { type: 'date' },
                metadata: { type: 'object', dynamic: true },
              },
            },
          },
        });
        this.logger.log(`Created Elasticsearch index: ${PRODUCTS_INDEX}`);
      }
    } catch (error) {
      this.logger.warn(
        `Could not ensure Elasticsearch index: ${error.message}`,
      );
    }
  }

  // ── Write operations ───────────────────────────────────────────────────────

  async indexProduct(product: Product): Promise<void> {
    await this.client.index({
      index: PRODUCTS_INDEX,
      id: product.id,
      body: {
        name: product.name,
        description: product.description,
        shortDescription: product.shortDescription,
        category: product.category?.name ?? null,
        brand: product.brand?.name ?? null,
        price: product.basePrice,
        isActive: product.isActive,
        stock: product.inventoryQuantity,
        seoKeywords: product.seoKeywords,
        createdAt: product.createdAt,
        metadata: product.metadata,
      },
    });
  }

  async deleteProduct(productId: string): Promise<void> {
    try {
      await this.client.delete({ index: PRODUCTS_INDEX, id: productId });
    } catch (error) {
      // 404 means it was never indexed — not an error worth surfacing
      if (error?.meta?.statusCode !== 404) throw error;
    }
  }

  async bulkIndex(
    products: Product[],
  ): Promise<{ indexed: number; errors: number }> {
    if (products.length === 0) return { indexed: 0, errors: 0 };

    const operations = products.flatMap((product) => [
      { index: { _index: PRODUCTS_INDEX, _id: product.id } },
      {
        name: product.name,
        description: product.description,
        shortDescription: product.shortDescription,
        category: product.category?.name ?? null,
        brand: product.brand?.name ?? null,
        price: product.basePrice,
        isActive: product.isActive,
        stock: product.inventoryQuantity,
        seoKeywords: product.seoKeywords,
        createdAt: product.createdAt,
        metadata: product.metadata,
      },
    ]);

    const response = await this.client.bulk({
      body: operations,
      refresh: true,
    });

    const errors = response.errors
      ? (response.items as any[]).filter((i) => i.index?.error).length
      : 0;

    this.logger.log(
      `Bulk indexed ${products.length - errors} products, ${errors} errors`,
    );
    return { indexed: products.length - errors, errors };
  }

  // ── Search ─────────────────────────────────────────────────────────────────

  async search(query: string, filters: SearchFilters) {
    const mustQueries: any[] = [];

    if (query) {
      mustQueries.push({
        multi_match: {
          query,
          fields: [
            'name^3',
            'shortDescription^2',
            'description',
            'seoKeywords',
          ],
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      });
    }

    if (filters.category) {
      mustQueries.push({ term: { category: filters.category } });
    }

    if (filters.brands?.length) {
      mustQueries.push({ terms: { brand: filters.brands } });
    }

    if (filters.tags?.length) {
      mustQueries.push({ terms: { tags: filters.tags } });
    }

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

    if (filters.inStock) {
      mustQueries.push({ range: { stock: { gt: 0 } } });
    }

    const result = await this.client.search({
      index: PRODUCTS_INDEX,
      from: (filters.page - 1) * filters.limit,
      size: filters.limit,
      body: {
        query: {
          bool: {
            must: mustQueries,
            filter: [{ term: { isActive: true } }],
          },
        },
        sort: this.getSortClause(filters.sortBy, filters.sortOrder),
      },
    } as any);

    const total =
      typeof result.hits.total === 'number'
        ? result.hits.total
        : (result.hits.total?.value ?? 0);

    const data = result.hits.hits.map((hit) => hit._source);
    return new PaginatedResponseDto(data, filters.page, filters.limit, total);
  }

  async ping(): Promise<void> {
    await this.client.ping();
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private getSortClause(sortBy?: string, sortOrder?: 'asc' | 'desc') {
    const order = sortOrder || 'desc';
    switch (sortBy) {
      case 'price':
        return [{ price: { order: order } }];
      case 'name':
        return [{ 'name.en.keyword': { order: order } }];
      case 'newest':
      case 'createdAt':
        return [{ createdAt: { order: order } }];
      case 'rating':
        return [{ 'metadata.avgRating': { order: 'desc' as const } }];
      default:
        return [{ _score: { order: 'desc' as const } }];
    }
  }
}

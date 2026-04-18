import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SearchService } from '../services/search.service';
import { ElasticsearchService } from '../services/elasticsearch.service';
import { Product } from '@modules/products/entities/product.entity';

describe('SearchService', () => {
  let service: SearchService;
  let elasticsearchService: Record<string, jest.Mock>;
  let productRepository: Record<string, jest.Mock>;

  beforeEach(async () => {
    elasticsearchService = {
      search: jest.fn(),
      bulkIndex: jest.fn(),
    };

    productRepository = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: ElasticsearchService, useValue: elasticsearchService },
        { provide: getRepositoryToken(Product), useValue: productRepository },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('search', () => {
    it('delegates to elasticsearchService.search with query and dto', async () => {
      const searchResult = { products: [{ id: 'p1' }], total: 1 };
      elasticsearchService.search.mockResolvedValue(searchResult);

      const dto = { query: 'headphones', page: 1, limit: 10 };
      const result = await service.search(dto as any);

      expect(elasticsearchService.search).toHaveBeenCalledWith(
        'headphones',
        dto,
      );
      expect(result).toBe(searchResult);
    });

    it('passes empty string when query is undefined', async () => {
      elasticsearchService.search.mockResolvedValue({ products: [], total: 0 });

      await service.search({ page: 1, limit: 10 } as any);

      expect(elasticsearchService.search).toHaveBeenCalledWith(
        '',
        expect.any(Object),
      );
    });
  });

  describe('reindexAll', () => {
    it('loads all products with relations and calls bulkIndex', async () => {
      const products = [{ id: 'p1' }, { id: 'p2' }];
      productRepository.find.mockResolvedValue(products);
      elasticsearchService.bulkIndex.mockResolvedValue({
        indexed: 2,
        errors: 0,
      });

      const result = await service.reindexAll();

      expect(productRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ relations: ['category', 'brand'] }),
      );
      expect(elasticsearchService.bulkIndex).toHaveBeenCalledWith(products);
      expect(result).toEqual({ indexed: 2, errors: 0 });
    });

    it('returns { indexed: 0, errors: 0 } when no products exist', async () => {
      productRepository.find.mockResolvedValue([]);
      elasticsearchService.bulkIndex.mockResolvedValue({
        indexed: 0,
        errors: 0,
      });

      const result = await service.reindexAll();

      expect(result).toEqual({ indexed: 0, errors: 0 });
    });
  });
});

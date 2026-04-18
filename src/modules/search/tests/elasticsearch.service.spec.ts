import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ElasticsearchService } from '../services/elasticsearch.service';

const mockEsClient = {
  indices: {
    exists: jest.fn(),
    create: jest.fn(),
  },
  index: jest.fn(),
  delete: jest.fn(),
  bulk: jest.fn(),
  search: jest.fn(),
  ping: jest.fn(),
};

// Intercept the @elastic/elasticsearch Client constructor so no real connection is made
jest.mock('@elastic/elasticsearch', () => ({
  Client: jest.fn().mockImplementation(() => mockEsClient),
}));

const makeProduct = (overrides: Record<string, any> = {}) => ({
  id: 'prod-1',
  name: { en: 'Blue T-Shirt', ar: 'تيشيرت أزرق' },
  description: { en: 'A great shirt' },
  shortDescription: null,
  basePrice: 29.99,
  isActive: true,
  inventoryQuantity: 10,
  seoKeywords: null,
  createdAt: new Date('2026-01-01'),
  metadata: { avgRating: 4.5 },
  category: { name: { en: 'Clothing' } },
  brand: { name: { en: 'BrandX' } },
  ...overrides,
});

describe('ElasticsearchService', () => {
  let service: ElasticsearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ElasticsearchService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'ELASTICSEARCH_NODE') return 'http://localhost:9200';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ElasticsearchService>(ElasticsearchService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('ensureIndex', () => {
    it('creates the index when it does not exist', async () => {
      mockEsClient.indices.exists.mockResolvedValue(false);
      mockEsClient.indices.create.mockResolvedValue({});

      await service.ensureIndex();

      expect(mockEsClient.indices.create).toHaveBeenCalledWith(
        expect.objectContaining({ index: 'products' }),
      );
    });

    it('skips creation when the index already exists', async () => {
      mockEsClient.indices.exists.mockResolvedValue(true);

      await service.ensureIndex();

      expect(mockEsClient.indices.create).not.toHaveBeenCalled();
    });

    it('logs a warning and does not throw when Elasticsearch is unreachable', async () => {
      mockEsClient.indices.exists.mockRejectedValue(
        new Error('connection refused'),
      );

      await expect(service.ensureIndex()).resolves.not.toThrow();
    });
  });

  describe('indexProduct', () => {
    it('sends a document to the products index with the correct shape', async () => {
      mockEsClient.index.mockResolvedValue({ result: 'created' });
      const product = makeProduct();

      await service.indexProduct(product as any);

      expect(mockEsClient.index).toHaveBeenCalledWith(
        expect.objectContaining({
          index: 'products',
          id: 'prod-1',
          body: expect.objectContaining({
            name: { en: 'Blue T-Shirt', ar: 'تيشيرت أزرق' },
            price: 29.99,
            isActive: true,
            stock: 10,
            category: { en: 'Clothing' },
            brand: { en: 'BrandX' },
          }),
        }),
      );
    });

    it('handles products with null brand gracefully', async () => {
      mockEsClient.index.mockResolvedValue({ result: 'created' });

      await expect(
        service.indexProduct(makeProduct({ brand: null }) as any),
      ).resolves.not.toThrow();

      expect(mockEsClient.index).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({ brand: null }),
        }),
      );
    });
  });

  describe('deleteProduct', () => {
    it('deletes the document by product id', async () => {
      mockEsClient.delete.mockResolvedValue({ result: 'deleted' });

      await service.deleteProduct('prod-1');

      expect(mockEsClient.delete).toHaveBeenCalledWith({
        index: 'products',
        id: 'prod-1',
      });
    });

    it('does not throw when the product was never indexed (404)', async () => {
      const notFound = new Error('not found');
      (notFound as any).meta = { statusCode: 404 };
      mockEsClient.delete.mockRejectedValue(notFound);

      await expect(
        service.deleteProduct('prod-missing'),
      ).resolves.not.toThrow();
    });

    it('re-throws non-404 errors', async () => {
      const serverError = new Error('ES cluster not available');
      (serverError as any).meta = { statusCode: 503 };
      mockEsClient.delete.mockRejectedValue(serverError);

      await expect(service.deleteProduct('prod-1')).rejects.toThrow(
        'ES cluster not available',
      );
    });
  });

  describe('bulkIndex', () => {
    it('returns { indexed: 0, errors: 0 } for an empty product list', async () => {
      const result = await service.bulkIndex([]);
      expect(result).toEqual({ indexed: 0, errors: 0 });
      expect(mockEsClient.bulk).not.toHaveBeenCalled();
    });

    it('sends bulk operations for all products', async () => {
      mockEsClient.bulk.mockResolvedValue({ errors: false, items: [{}, {}] });
      const products = [makeProduct(), makeProduct({ id: 'prod-2' })];

      const result = await service.bulkIndex(products as any);

      expect(mockEsClient.bulk).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.arrayContaining([
            { index: { _index: 'products', _id: 'prod-1' } },
            { index: { _index: 'products', _id: 'prod-2' } },
          ]),
        }),
      );
      expect(result).toEqual({ indexed: 2, errors: 0 });
    });

    it('counts partial failures correctly', async () => {
      mockEsClient.bulk.mockResolvedValue({
        errors: true,
        items: [
          { index: { result: 'created' } },
          { index: { error: { reason: 'document_missing_exception' } } },
        ],
      });
      const products = [makeProduct(), makeProduct({ id: 'prod-2' })];

      const result = await service.bulkIndex(products as any);

      expect(result).toEqual({ indexed: 1, errors: 1 });
    });
  });
});

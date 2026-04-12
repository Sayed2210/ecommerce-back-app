# Search Module

Product search powered by Elasticsearch with analytics tracking and product recommendations.

## Responsibilities

- Full-text product search with filters
- Elasticsearch index management
- Search query logging for analytics
- Product recommendations (collaborative filtering)

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/search` | ❌ | Search products (rate-limited: 30/min) |

## DTOs

### `SearchDto`
```typescript
{
  query?: string        // full-text search terms
  category?: string     // category slug
  brands?: string[]     // brand slugs
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest'
  page?: number         // default: 1
  limit?: number        // default: 10, max: 100
}
```

## Entities

### `SearchQuery`
| Field | Type | Notes |
|-------|------|-------|
| query | string | the search terms |
| userId | UUID | optional — null for anonymous |
| resultCount | number | how many results were returned |
| filters | jsonb | applied filter snapshot |
| sessionId | string | optional |

## Services

### `SearchService`
- `search(dto)` — delegates to `ElasticsearchService`, logs query to `SearchQuery` table

### `ElasticsearchService`
- Manages index creation and mapping
- Executes compound queries (multi-match, range filters, bool)
- Returns paginated product hits with relevance score

### `RecommendationsService`
- `getSimilarProducts(productId)` — Elasticsearch more-like-this query
- `getPersonalizedRecommendations(userId)` — based on order/view history

## Env Variables

| Variable | Description |
|----------|-------------|
| `ELASTICSEARCH_NODE` | Elasticsearch URL (e.g., `http://localhost:9200`) |
| `ELASTICSEARCH_API_KEY` | API key for authentication |

## Exports

`SearchService`, `ElasticsearchService`

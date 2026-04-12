# Products Module

Product catalog with categories, brands, variants, inventory, and multi-language support.

## Responsibilities

- Full product CRUD (admin-only for writes)
- Category tree management
- Brand management
- Product variants (color, size, etc.)
- Inventory tracking per variant
- Product filtering, sorting, and text search
- Response caching via Redis

## Endpoints

### Products

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/products` | ❌ | — | List products (filters + pagination) |
| GET | `/products/:id` | ❌ | — | Get product details |
| POST | `/products` | JWT | ADMIN | Create product |
| PATCH | `/products/:id` | JWT | ADMIN | Update product |
| DELETE | `/products/:id` | JWT | ADMIN | Soft-delete product |

### Categories

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/categories` | ❌ | — | List all categories (tree) |
| GET | `/categories/:id` | ❌ | — | Get category + children |
| POST | `/categories` | JWT | ADMIN | Create category |
| PATCH | `/categories/:id` | JWT | ADMIN | Update category |
| DELETE | `/categories/:id` | JWT | ADMIN | Delete category |

### Brands

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/brands` | ❌ | — | List brands |
| GET | `/brands/:id` | ❌ | — | Get brand |
| POST | `/brands` | JWT | ADMIN | Create brand |
| PATCH | `/brands/:id` | JWT | ADMIN | Update brand |
| DELETE | `/brands/:id` | JWT | ADMIN | Delete brand |

### Tags

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/tags` | ❌ | — | List all tags |
| POST | `/tags` | JWT | ADMIN | Create tag |
| DELETE | `/tags/:id` | JWT | ADMIN | Delete tag |

## Entities

### `Product`
| Field | Type | Notes |
|-------|------|-------|
| name | jsonb | `{ en: string, ar: string }` |
| slug | string | unique, auto-generated |
| description | jsonb | translatable |
| basePrice | decimal(12,2) | |
| compareAtPrice | decimal(12,2) | optional (strike-through price) |
| inventoryQuantity | number | top-level stock |
| isActive | boolean | soft-delete flag |
| isFeatured | boolean | |
| metadata | jsonb | avgRating, reviewCount, viewCount |
| categoryId | UUID | FK → Category |
| brandId | UUID | FK → Brand, optional |

### `Category`
| Field | Type | Notes |
|-------|------|-------|
| name | jsonb | translatable |
| slug | string | unique |
| parent | Category | self-referencing tree |
| displayOrder | number | sort order |
| isActive | boolean | |

### `Brand`
| Field | Type | Notes |
|-------|------|-------|
| name | jsonb | translatable, unique |
| slug | string | unique |
| logoUrl | string | optional |
| websiteUrl | string | optional |

### `ProductVariant`
| Field | Type | Notes |
|-------|------|-------|
| variantName | jsonb | translatable |
| priceModifier | decimal(12,2) | added to basePrice |
| optionValues | jsonb | `{ color: 'Red', size: 'M' }` |
| inventoryQuantity | number | |
| reservedQuantity | number | items in active orders |
| lowStockThreshold | number | default 5 |
| isActive | boolean | |

### `Tag`
| Field | Type | Notes |
|-------|------|-------|
| name | string | unique, max 100 chars |
| slug | string | unique, auto-generated from name |
| products | Product[] | ManyToMany via `product_tags` pivot table |

### `ProductImage`
| Field | Type | Notes |
|-------|------|-------|
| url | string | validated URL |
| isPrimary | boolean | |
| displayOrder | number | |
| altText | string | optional |

## DTOs

### `CreateProductDto`
```typescript
{
  name: { en: string, ar: string }
  description: { en: string, ar: string }
  basePrice: number                 // min: 0
  categoryId: string
  brandId: string
  inventoryQuantity: number         // min: 0
  images?: string[]                 // validated URLs
  variants?: CreateVariantDto[]
  tagIds?: string[]                 // UUIDs of existing tags
  isActive?: boolean
}
```

### `FilterProductsDto`
```typescript
{
  categoryId?: string
  brandId?: string
  minPrice?: number
  maxPrice?: number
  search?: string
  sortBy?: 'price-asc' | 'price-desc' | 'rating' | 'newest'
}
```

## Services

### `ProductsService`
- `create(dto)` — creates product, auto-generates slug, invalidates cache
- `findAll(filters, pagination)` — filtered/sorted list with Redis cache (5 min)
- `findOne(id)` — product details, increments view count, cached 10 min
- `update(id, dto)` — updates, invalidates cache
- `remove(id)` — `isActive = false`, invalidates cache

### `TagsService`
- `findAll()` — all tags ordered by name
- `findByIds(ids[])` — fetch tags by IDs (used when assigning to a product)
- `create(dto)` — creates tag with auto-generated slug; throws on duplicate
- `remove(id)` — deletes tag (pivot rows cascade automatically)

### `InventoryService`
- Reserves stock on order creation (`reservedQuantity++`)
- Releases stock on order cancellation (`reservedQuantity--`)

## Caching

| Key Pattern | TTL | Invalidated On |
|-------------|-----|----------------|
| `products:{filters}:{page}:{limit}` | 5 min | create / update / delete |
| `product:{id}` | 10 min | update / delete |

## Inventory Low-Stock Alerts

`InventoryAlertWorker` registers itself on `onModuleInit` as a BullMQ worker for the `notifications` queue.
When `InventoryService.adjustInventory` drops a variant below `lowStockThreshold`, it enqueues a `low-stock-alert` job.
The worker sends an email to `ADMIN_EMAIL` using the `templates/emails/low-stock-alert.hbs` template.

## Exports

`ProductRepository`, `CategoryRepository`, `ProductVariantRepository`, `TagsService`

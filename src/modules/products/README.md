# Products Module

Manages the full product catalog including categories, brands, variants, inventory, and images.

## Business Purpose

Products are the core of the e-commerce platform. This module lets admins build and maintain a catalog of items for sale, each with multi-language names/descriptions, multiple purchasable variants (e.g. size or color), real-time inventory tracking, and SEO metadata. Customers can browse and filter the catalog without authentication.

## How It Works

### Multi-Language Content
Fields like `name`, `description`, `shortDescription`, `seoTitle`, and `seoDescription` are stored as JSONB objects:
```json
{ "en": "Blue T-Shirt", "ar": "قميص أزرق" }
```
The frontend requests the locale it needs and renders the appropriate language.

### Product Lifecycle
1. Admin creates a product via `POST /products` with at minimum a `name`, `basePrice`, and `categoryId`.
2. A URL-safe `slug` is auto-generated from the English name and guaranteed unique (appends a counter if needed).
3. The product is immediately `isActive = true` and `publishedAt = now()`. To hide it from the storefront, set `isActive = false`.
4. Variants are created separately and linked to the product.

### Variants
A product variant represents a specific purchasable SKU — e.g. "Blue / Large". Each variant has:
- A `priceModifier` added to the product's `basePrice` (positive or negative delta)
- Its own `inventoryQuantity` and `reservedQuantity` (reserved = items currently in carts)
- Optional `sku`, `barcode`, weight, and `attributes` (JSONB for arbitrary key/value like `{ "color": "blue", "size": "L" }`)

### Inventory
`inventoryQuantity` tracks physical stock. `reservedQuantity` tracks how many units are currently in active carts. **Available stock = `inventoryQuantity - reservedQuantity`**. The checkout process reserves stock atomically inside a DB transaction and releases it if the order is cancelled.

`InventoryLog` records every change to stock with a reason (`purchase`, `return`, `adjustment`) for audit purposes.

### Filtering & Pagination
`GET /products` accepts query params: `categoryId`, `brandId`, `minPrice`, `maxPrice`, `search`, `sortBy` (newest / price-asc / price-desc / rating). Results are cached in Redis for 5 minutes with a cache key derived from the filter hash.

### Caching
- Product list: cached per unique filter+pagination combination, TTL 5 min, key `products:{filtersHash}`
- Product detail: cached per ID, TTL 10 min, key `product:{id}`
- Both are invalidated on create, update, or soft-delete

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/products` | Public | List products with filters and pagination |
| GET | `/products/:id` | Public | Get product detail (increments view count) |
| POST | `/products` | Admin | Create a product |
| PATCH | `/products/:id` | Admin | Update a product |
| DELETE | `/products/:id` | Admin | Soft-delete (sets `isActive = false`) |

## Services

| Service | Responsibility |
|---|---|
| `ProductsService` | Product CRUD, filtering, pagination, cache management |
| `VariantsService` | Variant creation and price modifier management |
| `InventoryService` | Stock adjustments, reservation, and inventory logging |

## Repositories

| Repository | Key custom methods |
|---|---|
| `ProductRepository` | `findBySlug`, `findByCategory`, `searchByName`, `findSimilarProducts`, `findByCategoriesWithRating` |
| `CategoryRepository` | Tree/hierarchical category queries |
| `BrandRepository` | Brand lookup |
| `VariantRepository` | Variant by product, inventory queries |

## Key Entities

- **`Product`** — master catalog record with JSONB name/description, `slug`, `basePrice`, SEO fields, `metadata` (avgRating, reviewCount, viewCount)
- **`ProductVariant`** — purchasable SKU with price modifier, inventory, and attributes
- **`ProductImage`** — ordered image URLs linked to a product
- **`Category`** — hierarchical product categories
- **`Brand`** — product brand
- **`InventoryLog`** — immutable audit trail of every stock change

# Reviews Module

Product reviews with ratings, images, verified purchase badges, and automated product rating updates.

## Responsibilities

- Create, read, update, delete product reviews
- Ownership enforcement on update/delete
- Verified purchase detection (via orderId)
- Auto-update product `avgRating` and `reviewCount` in `Product.metadata`

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/reviews` | JWT | Create review |
| GET | `/reviews/product/:productId` | ❌ | Get reviews for a product (paginated) |
| GET | `/reviews/:id` | ❌ | Get single review |
| PATCH | `/reviews/:id` | JWT | Update own review |
| DELETE | `/reviews/:id` | JWT | Delete own review |

## Entities

### `Review`
| Field | Type | Notes |
|-------|------|-------|
| rating | number | 1–5 |
| title | string | optional |
| comment | text | optional |
| images | string[] | array of image URLs |
| isVerifiedPurchase | boolean | true if orderId was provided and order belongs to user |
| isActive | boolean | soft delete |
| userId | UUID | FK → User |
| productId | UUID | FK → Product |
| orderId | UUID | FK → Order, optional |

### `ReviewImage`
| Field | Type | Notes |
|-------|------|-------|
| url | string | |
| reviewId | UUID | FK → Review |

## DTOs

### `CreateReviewDto`
```typescript
{
  rating: number       // 1–5, required
  title?: string
  comment?: string
  images?: string[]
  productId: string    // UUID
  orderId?: string     // UUID — used to set isVerifiedPurchase
}
```

### `UpdateReviewDto`
```typescript
{
  rating?: number
  title?: string
  comment?: string
  images?: string[]
}
```

## Services

### `ReviewsService`
- `create(userId, dto)` — creates review; if `orderId` provided, sets `isVerifiedPurchase = true`; recalculates and stores `avgRating` + `reviewCount` into `Product.metadata`
- `findAll(productId, pagination)` — paginated reviews for a product
- `findOne(id)` — single review
- `update(id, userId, dto)` — ownership check, then update; recalculates rating aggregates
- `remove(id, userId)` — ownership check (`isActive = false`); recalculates rating aggregates

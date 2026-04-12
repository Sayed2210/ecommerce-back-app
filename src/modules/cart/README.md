# Cart Module

Shopping cart management with real-time WebSocket updates and abandoned cart recovery.

## Responsibilities

- Authenticated and guest (session-based) carts
- Add, update, remove cart items
- Cart total calculation (price × quantity per item)
- Real-time cart updates via WebSocket (`cart_updated` event)
- Abandoned cart background job (BullMQ)

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/cart` | JWT | Get current cart with totals |
| POST | `/cart/items` | JWT | Add item (or increment if exists) |
| PATCH | `/cart/items/:id` | JWT | Update item quantity |
| DELETE | `/cart/items/:id` | JWT | Remove single item |
| DELETE | `/cart` | JWT | Clear entire cart |

## Entities

### `Cart`
| Field | Type | Notes |
|-------|------|-------|
| userId | UUID | FK → User, optional (guest carts use sessionId) |
| sessionId | string | unique, for unauthenticated carts |
| expiresAt | Date | optional, for guest cart expiry |

### `CartItem`
| Field | Type | Notes |
|-------|------|-------|
| cartId | UUID | FK → Cart |
| productId | UUID | FK → Product |
| variantId | UUID | FK → ProductVariant, optional |
| quantity | number | min: 1 |
| totalPrice | number | calculated (price × qty) |

## DTOs

### `AddCartItemDto`
```typescript
{
  productId: string    // UUID
  quantity: number     // min: 1
  variantId?: string   // UUID, optional
}
```

### `UpdateCartItemDto`
```typescript
{
  quantity: number    // min: 1
}
```

## Services

### `CartService`
- `getOrCreateCart(userId?, sessionId?)` — finds or creates cart, returns with totals
- `addItem(cartId, dto)` — adds item; if product+variant already exists, increments quantity; checks stock before adding
- `updateItem(id, dto)` — updates quantity
- `removeItem(id)` — removes single item
- `clearCart(cartId)` — removes all items
- `getCartWithTotals(cartId)` — calculates `item.totalPrice` and `cart.subtotal`

All write methods emit a `cart_updated` WebSocket event to `user:{userId}`.

## Background Job

### `AbandonedCartJob` (`abandoned-cart.job.ts`)
- Runs on BullMQ
- Identifies carts inactive for 24h with items
- Sends `sendAbandonedCartReminder` email via `MailerService`
- After 48h, sends follow-up with discount code via `sendAbandonedCartFollowUp`

## WebSocket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `cart_updated` | Server → Client | Full cart with items and totals |

## Exports

`CartService`, `CartRepository`

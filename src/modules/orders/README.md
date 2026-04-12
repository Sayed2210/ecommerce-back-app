# Orders Module

Order lifecycle management, checkout flow, Stripe payments, coupons, and shipping.

## Responsibilities

- Create orders from cart (checkout flow)
- Payment processing via Stripe or Cash on Delivery
- Coupon validation and discount calculation
- Order status tracking
- Shipping tracking
- Admin order analytics

## Endpoints

### Orders

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/orders` | JWT | — | List own orders (filter by status) |
| GET | `/orders/:id` | JWT | — | Get order details (ownership checked) |
| PATCH | `/orders/:id/status` | JWT | ADMIN | Update order status |
| GET | `/orders/analytics/summary` | JWT | ADMIN | Admin analytics |

### Checkout

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/checkout/webhook` | ❌ (raw body) | Stripe webhook receiver |
| POST | `/checkout/validate` | JWT + Verified | Validate cart, address, inventory |
| POST | `/checkout/create-order` | JWT + Verified | Create order from cart |
| POST | `/checkout/apply-coupon` | JWT + Verified | Validate & preview coupon |

> Checkout endpoints (except webhook) require `EmailVerifiedGuard` in addition to JWT.

### Stripe Webhook
`POST /checkout/webhook` is public and must receive the **raw request body** for signature verification.
`NestFactory.create(AppModule, { rawBody: true })` is set in `main.ts`.
Set `STRIPE_WEBHOOK_SECRET` env var to your Stripe webhook signing secret.

### Coupons (Admin)

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/coupons` | JWT | ADMIN | List coupons |
| POST | `/coupons` | JWT | ADMIN | Create coupon |
| PATCH | `/coupons/:id` | JWT | ADMIN | Update coupon |
| DELETE | `/coupons/:id` | JWT | ADMIN | Delete coupon |

## Entities

### `Order`
| Field | Type | Notes |
|-------|------|-------|
| orderNumber | string | unique, auto-generated |
| status | enum | PENDING → PROCESSING → SHIPPED → DELIVERED → CANCELLED / REFUNDED |
| subtotal | decimal(12,2) | |
| taxAmount | decimal(12,2) | |
| shippingAmount | decimal(12,2) | |
| discountAmount | decimal(12,2) | |
| totalAmount | decimal(12,2) | |
| currency | string | default `USD` |
| paymentStatus | enum | PENDING \| PAID \| FAILED \| REFUNDED |
| paymentMethod | enum | STRIPE \| COD |
| paymentIntentId | string | Stripe, optional |
| trackingNumber | string | optional |
| userId | UUID | FK → User |
| shippingAddressId | UUID | FK → Address |

### `OrderItem`
| Field | Type | Notes |
|-------|------|-------|
| orderId | UUID | FK → Order |
| productId | UUID | FK → Product |
| variantId | UUID | FK → ProductVariant, optional |
| quantity | number | |
| price | decimal(12,2) | snapshot at time of order |

### `Coupon`
| Field | Type | Notes |
|-------|------|-------|
| code | string | unique |
| type | enum | PERCENTAGE \| FIXED \| FREE_SHIPPING |
| value | decimal | percentage or fixed amount |
| maxDiscount | decimal | cap on PERCENTAGE type |
| minOrderValue | decimal | minimum cart value |
| usageLimit | number | optional |
| usageCount | number | |
| startDate | Date | |
| endDate | Date | optional |
| isActive | boolean | |

### `Payment`
| Field | Type | Notes |
|-------|------|-------|
| paymentIntentId | string | Stripe intent ID |
| amount | decimal | |
| currency | string | |
| gateway | enum | STRIPE \| PAYPAL \| CASH_ON_DELIVERY |
| orderId | UUID | FK → Order |

### `Shipping`
| Field | Type | Notes |
|-------|------|-------|
| status | enum | PENDING → SHIPPED → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED / FAILED |
| trackingNumber | string | optional |
| trackingUrl | string | optional |
| carrier | string | optional |
| cost | decimal | |
| shippedAt | Date | |
| deliveredAt | Date | |

## DTOs

### `CreateOrderDto`
```typescript
{
  shippingAddressId: string   // UUID
  couponCode?: string
  paymentMethod: PaymentGateway   // 'stripe' | 'cash_on_delivery'
  paymentToken?: string           // Stripe token
}
```

## Checkout Flow

```
1. validateCheckout   → check cart, address, inventory availability
2. createOrder        → lock inventory (reservedQuantity++)
                     → apply coupon (if provided)
                     → calculate totals (subtotal + tax + shipping - discount)
                     → persist Order + OrderItems
3. processPayment     → Stripe: createPaymentIntent(orderId, amount, token)
                     → COD: paymentStatus = PENDING
4. clearCart          → delete cart items
5. sendConfirmation   → queue order confirmation email
```

## Services

### `OrdersService`
- `findAll(filters, pagination)` — scoped to `userId` unless admin
- `findOne(id, userId)` — ownership-checked
- `updateStatus(id, status)` — admin only
- `getOrderAnalytics()` — totals, breakdown by status

### `CheckoutService`
- `validateCheckout(userId, data)` — validates all pre-conditions
- `createOrder(userId, dto)` — full checkout pipeline (see above)
- `applyCoupon(dto)` — returns discount preview without creating order

### `PaymentService`
- `createPaymentIntent(orderId, amount, token)` — Stripe integration
- `handleWebhook(event)` — Stripe webhook: updates paymentStatus

### `CouponService`
- `validate(code, orderValue)` — checks active, date range, usage limit, min value
- `apply(order, coupon)` — calculates and returns discount amount

## Exports

`OrdersService`, `OrderRepository`

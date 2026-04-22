# Checkout Cycle — Frontend Integration Guide

> Base URL: `http://localhost:3000` (dev) | production URL from Railway deployment
> All protected endpoints require `Authorization: Bearer <accessToken>` header.
> Email must be verified before any checkout action.

---

## Overview — Step-by-Step Flow

```
1. Auth          → user is logged in + email verified
2. Cart          → add / update / review cart items
3. Addresses     → select or create a shipping address
4. Coupon        → (optional) validate & apply a discount code
5. Validate      → pre-flight check before payment
6. Place Order   → create order + initiate payment
7. Payment       → handle Stripe client-side confirmation (if Stripe)
8. Confirmation  → poll order status or listen via WebSocket
```

---

## 1. Authentication Prerequisite

The user must be authenticated and have a verified email. All checkout endpoints return `401` without a valid JWT and `403` if the email is not verified.

Obtain tokens via `POST /auth/login` or `POST /auth/register`. Store the `accessToken` for all subsequent requests.

---

## 2. Cart Management

### Get cart
```
GET /cart
Authorization: Bearer <token>
```

**Response**
```json
{
  "id": "uuid",
  "items": [
    {
      "id": "uuid",
      "product": { "id": "uuid", "name": { "en": "...", "ar": "..." } },
      "variant": { "id": "uuid", "name": "..." } | null,
      "quantity": 2,
      "unitPrice": "29.99",
      "totalPrice": "59.98"
    }
  ]
}
```

### Add item to cart
```
POST /cart/items
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "uuid",
  "quantity": 2,
  "variantId": "uuid"   // optional — required if product has variants
}
```

**Responses:** `201` item added | `400` invalid product or insufficient stock

### Update item quantity
```
PATCH /cart/items/:cartItemId
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 3
}
```

### Remove item
```
DELETE /cart/items/:cartItemId
Authorization: Bearer <token>
```
**Response:** `204 No Content`

### Clear cart
```
DELETE /cart
Authorization: Bearer <token>
```
**Response:** `204 No Content`

---

## 3. Address Management

Before creating an order the user must have at least one saved address. Retrieve the address `id` to pass into the order creation request.

### List addresses
```
GET /users/me/addresses
Authorization: Bearer <token>
```

**Response**
```json
[
  {
    "id": "uuid",
    "label": "home | work | other",
    "streetAddress": "123 Main St",
    "city": "Cairo",
    "state": "Cairo",
    "country": "EG",
    "postalCode": "11511",
    "isDefault": true
  }
]
```

### Create address
```
POST /users/me/addresses
Authorization: Bearer <token>
Content-Type: application/json

{
  "label": "home",
  "streetAddress": "123 Main St",
  "city": "Cairo",
  "state": "Cairo",
  "country": "EG",
  "postalCode": "11511"
}
```
**Response:** `201` with the new address object including its `id`.

### Set default address
```
PATCH /users/me/addresses/:id/default
Authorization: Bearer <token>
```

### Update / Delete address
```
PATCH /users/me/addresses/:id   // update fields
DELETE /users/me/addresses/:id  // 204 No Content
```

---

## 4. Apply Coupon (Optional)

Validate a coupon code before placing the order. This is informational — you still pass `couponCode` in the order creation request.

```
POST /checkout/apply-coupon
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "SUMMER2024"
}
```

**Response (200)**
```json
{
  "valid": true,
  "type": "percentage | fixed | free_shipping",
  "value": 20,
  "maxDiscount": 50,
  "minOrderValue": 100
}
```

**Errors:** `400` invalid, expired, or usage-limit reached coupon.

---

## 5. Validate Checkout (Pre-flight)

Run this before showing the order summary / payment form. It verifies cart contents, stock availability, address, and coupon.

```
POST /checkout/validate
Authorization: Bearer <token>
Content-Type: application/json

{
  "shippingAddressId": "uuid",
  "couponCode": "SUMMER2024"   // optional
}
```

**Response (200)** — returns a price breakdown:
```json
{
  "subtotal": "99.99",
  "taxAmount": "14.99",
  "shippingAmount": "5.00",
  "discountAmount": "20.00",
  "totalAmount": "99.98",
  "currency": "USD"
}
```

**Errors:** `400` if cart is empty, stock issues, or invalid address.

---

## 6. Create Order

Rate-limited to **10 requests per minute** per user.

```
POST /checkout/create-order
Authorization: Bearer <token>
Content-Type: application/json

{
  "shippingAddressId": "uuid",
  "paymentMethod": "stripe | cash_on_delivery",
  "couponCode": "SUMMER2024",    // optional
  "paymentToken": "tok_..."      // required for stripe; see step 7
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `shippingAddressId` | UUID | Yes | Must belong to authenticated user |
| `paymentMethod` | enum | Yes | `stripe` or `cash_on_delivery` |
| `couponCode` | string | No | Applied at order time |
| `paymentToken` | string | Stripe only | Token from Stripe.js |

**Response (201)**
```json
{
  "id": "uuid",
  "orderNumber": "ORD-20240101-XXXX",
  "status": "pending",
  "paymentStatus": "pending",
  "subtotal": "99.99",
  "taxAmount": "14.99",
  "shippingAmount": "5.00",
  "discountAmount": "20.00",
  "totalAmount": "99.98",
  "currency": "USD",
  "items": [...],
  "shippingAddress": {...},
  "paymentIntentId": "pi_..."  // present for stripe orders
}
```

**Errors:**
- `400` — insufficient stock, empty cart, or invalid payment token
- `429` — rate limit exceeded

---

## 7. Stripe Payment Flow

Use **Stripe.js** on the client to avoid handling raw card data.

### Option A — Payment Intent (recommended)

1. Call `POST /checkout/create-order` with `paymentMethod: "stripe"` (no `paymentToken`).
2. The response includes `paymentIntentId` (a `pi_...` client secret).
3. Use Stripe.js `stripe.confirmCardPayment(clientSecret, { payment_method: { card } })`.
4. On success Stripe fires the webhook (step 8) which marks the order `paid`.

### Option B — Token

1. Tokenize the card with `stripe.createToken(cardElement)` → get `tok_...`.
2. Pass `paymentToken: "tok_..."` in `POST /checkout/create-order`.

### Cash on Delivery

Pass `paymentMethod: "cash_on_delivery"` with no token. Order is created with `paymentStatus: pending`.

---

## 8. Stripe Webhook (Server-side — no frontend action needed)

The backend exposes a public endpoint to receive Stripe events:

```
POST /checkout/webhook
stripe-signature: <stripe-header>
```

This endpoint is **public** (no JWT). Stripe calls it automatically. It updates `paymentStatus` on the order to `paid`, `failed`, or `refunded`.

Your frontend does not call this directly — just listen for order status changes (see step 9).

---

## 9. Order Confirmation & Tracking

### Poll order status
```
GET /orders/:orderId
Authorization: Bearer <token>
```

**Response**
```json
{
  "id": "uuid",
  "orderNumber": "ORD-20240101-XXXX",
  "status": "pending | processing | shipped | delivered | cancelled | refunded",
  "paymentStatus": "pending | paid | failed | refunded",
  "trackingNumber": "...",
  "items": [
    {
      "productName": "Blue T-Shirt",
      "variantName": "L",
      "sku": "BTS-L",
      "unitPrice": "29.99",
      "quantity": 2,
      "totalPrice": "59.98"
    }
  ],
  "shippingAddress": { ... },
  "shippingAmount": "5.00",
  "taxAmount": "14.99",
  "discountAmount": "20.00",
  "totalAmount": "99.98",
  "createdAt": "2024-01-01T10:00:00Z"
}
```

### List user orders
```
GET /orders?status=pending&page=1&limit=10
Authorization: Bearer <token>
```

### Real-time updates via WebSocket

Connect to the Socket.io server at the base URL. The server emits order status change events to the user's room. Subscribe after authentication:

```js
const socket = io(BASE_URL, { auth: { token: accessToken } });
socket.on('order:updated', (order) => {
  // update UI with new order.status / order.paymentStatus
});
```

---

## Order Status Reference

| Status | Meaning |
|---|---|
| `pending` | Order placed, awaiting payment |
| `processing` | Payment confirmed, being prepared |
| `shipped` | Handed to carrier |
| `delivered` | Received by customer |
| `cancelled` | Cancelled before shipment |
| `refunded` | Payment refunded |

## Payment Status Reference

| Status | Meaning |
|---|---|
| `pending` | Awaiting payment confirmation |
| `paid` | Payment successful |
| `failed` | Payment declined or error |
| `refunded` | Amount returned to customer |

---

## Error Handling

All errors follow this shape:

```json
{
  "statusCode": 400,
  "message": "Insufficient stock for product: Blue T-Shirt",
  "error": "Bad Request"
}
```

| HTTP Code | Meaning |
|---|---|
| `400` | Validation error, bad input, stock issue |
| `401` | Missing or invalid JWT |
| `403` | Email not verified, or role not authorized |
| `404` | Resource not found |
| `429` | Rate limit hit (create-order: 10/min) |
| `500` | Server error |

---

## Complete Checkout Sequence (Quick Reference)

```
// 1. Get cart
GET /cart

// 2. Get addresses (or create one)
GET /users/me/addresses
POST /users/me/addresses

// 3. (Optional) validate coupon
POST /checkout/apply-coupon  { "code": "SAVE20" }

// 4. Pre-flight validation
POST /checkout/validate  { shippingAddressId, couponCode? }

// 5. Place order test
POST /checkout/create-order  { shippingAddressId, paymentMethod, couponCode?, paymentToken? }

// 6. (Stripe) confirm payment client-side with paymentIntentId from step 5

// 7. Poll or listen for status change
GET /orders/:orderId
```

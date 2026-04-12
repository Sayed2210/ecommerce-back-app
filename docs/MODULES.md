# E-Commerce Backend — Modules & Business Logic

This document explains what each module does, why it exists, and how it fits into the overall purchase journey.

---

## Table of Contents

1. [Application Overview](#application-overview)
2. [Auth Module](#auth-module)
3. [Users Module](#users-module)
4. [Products Module](#products-module)
5. [Cart Module](#cart-module)
6. [Orders Module](#orders-module)
7. [Reviews Module](#reviews-module)
8. [Notifications Module](#notifications-module)
9. [Search Module](#search-module)
10. [Admin Module](#admin-module)
11. [Cross-Module Flow: Full Purchase Journey](#cross-module-flow-full-purchase-journey)

---

## Application Overview

This is a full-featured e-commerce backend built with **NestJS**, **PostgreSQL** (TypeORM), **Redis**, **BullMQ**, and **Elasticsearch**.

The platform supports:
- Multi-language product content (English + Arabic via JSONB fields)
- JWT-based authentication with refresh token rotation
- A full shopping cart → checkout → payment → order lifecycle
- Real-time cart and notification updates over WebSocket (Socket.io)
- Elasticsearch-powered full-text product search with fuzzy matching
- AI-style product recommendations based on order history and wishlist
- Stripe payment processing with webhook handling
- A complete admin dashboard with analytics, staff management, and audit logs

**User roles:** `customer` (default), `staff`, `admin`

---

## Auth Module

`src/modules/auth/`

### Business Purpose

Every visitor must prove who they are before accessing protected resources. This module is the entry point for all identity and session management.

### Registration Flow

1. Client sends `{ email, password, firstName, lastName }` to `POST /auth/register`.
2. Email uniqueness is checked — throws `409 Conflict` if already taken.
3. Password is hashed with **bcrypt**.
4. A `User` record is created with `role = customer` and `isActive = true`.
5. An **access token** (short-lived JWT) and a **refresh token** (long-lived JWT) are issued immediately — the user is logged in right away.
6. The refresh token is saved to the `refresh_tokens` table for later revocation.

### Login Flow

1. Client sends `{ email, password }` to `POST /auth/login`.
2. Both "account not found" and "wrong password" return `401 Unauthorized` — deliberately identical to prevent user enumeration.
3. A new token pair is issued and the refresh token saved.

### Token Rotation (Refresh)

`POST /auth/refresh` accepts the current refresh token, verifies it, revokes it (one-time use), and issues a brand-new pair. This prevents replay attacks — a stolen token can only be used once before it's invalidated.

### Password Reset Flow

1. `POST /auth/forgot-password` — always returns a success-looking response regardless of whether the email exists. If the account exists, a password-reset link (with a 1-hour expiry token) is sent via email.
2. `POST /auth/reset-password` — verifies the token, hashes the new password, saves it, and revokes the reset token so it cannot be reused.

### Logout

`POST /auth/logout` revokes the submitted refresh token. The access token expires naturally on its own TTL.

### Token Types

| Token | Stored in DB | Revocable | Purpose |
|---|---|---|---|
| Access Token (JWT) | No | No — expires via TTL | Authenticates API requests |
| Refresh Token (JWT) | Yes | Yes | Obtains a new access token |
| Reset Token (JWT) | Yes | Yes | One-time password reset |
| Verification Token | Yes | Yes | One-time email verification |

### Guards & Decorators

- **`JwtAuthGuard`** — validates the `Authorization: Bearer <token>` header on protected routes.
- **`@Public()`** — marks a route as exempt from the JWT guard (login, register, forgot-password are all public).
- **`RolesGuard`** + **`@Roles(UserRole.ADMIN)`** — checks `user.role` inside the JWT payload to restrict routes to specific roles.

### API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Create account, receive token pair |
| POST | `/auth/login` | Public | Authenticate, receive token pair |
| POST | `/auth/refresh` | Public | Rotate refresh token |
| POST | `/auth/forgot-password` | Public | Trigger password-reset email |
| POST | `/auth/reset-password` | Public | Apply new password via reset token |
| POST | `/auth/verify-email` | Public | Confirm email address |
| POST | `/auth/logout` | JWT | Revoke refresh token |

---

## Users Module

`src/modules/users/`

### Business Purpose

After authentication, customers need to manage their personal data — profile, delivery addresses, and wishlist. Admins need to view and deactivate accounts.

### Profile Management

- `GET /users/me` — returns the authenticated user's profile. Sensitive fields (`passwordHash`, `refreshTokens`) are stripped before returning.
- `PATCH /users/me` — updates `firstName`, `lastName`, `phone`, `avatarUrl`. If the email is changed, uniqueness is re-validated first.
- `DELETE /users/:id` (Admin only) — performs a **soft deactivation** (`isActive = false`) rather than a hard delete, preserving the user's full order history.

### Address Book

Customers can save multiple named delivery addresses (home, office, etc.) and flag one as default. The checkout flow references these address IDs — no need to re-enter addresses at checkout.

### Wishlist

A wishlist entry links a user to a product they want to buy later. When the wishlist is fetched, full product details (price, images, stock) are loaded in a single query via relations. The frontend can detect price drops or out-of-stock status directly from the wishlist response.

### Admin User Management

Admins can paginate all users, look up any user by ID, and deactivate accounts. All admin routes require `@Roles(UserRole.ADMIN)`.

### API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/users/me` | JWT | Get own profile |
| PATCH | `/users/me` | JWT | Update own profile |
| GET | `/users/me/wishlist` | JWT | Get wishlist with full product details |
| GET | `/users` | Admin | List all users (paginated) |
| GET | `/users/:id` | Admin | Get user by ID |
| DELETE | `/users/:id` | Admin | Deactivate user (soft delete) |

---

## Products Module

`src/modules/products/`

### Business Purpose

Products are the core inventory of the platform. This module lets admins build a catalog of items for sale and lets customers browse it. It handles everything from multi-language descriptions and SEO metadata to granular per-variant stock tracking.

### Multi-Language Content

Text fields (`name`, `description`, `shortDescription`, `seoTitle`, `seoDescription`, `seoKeywords`) are stored as **JSONB** objects in PostgreSQL:

```json
{
  "en": "Blue T-Shirt",
  "ar": "قميص أزرق"
}
```

The API returns the full object; the frontend picks the correct locale.

### Product Lifecycle

1. Admin creates a product with `name`, `basePrice`, and `categoryId` at minimum.
2. A URL-safe `slug` is auto-generated from the English name and guaranteed unique (a counter suffix is appended on collision).
3. The product is `isActive = true` and `publishedAt = now()` by default.
4. Deleting a product sets `isActive = false` — a soft delete that keeps historical order data intact.

### Variants

A variant represents a single purchasable SKU — e.g. "Blue / Large". Each variant has:
- `priceModifier` — added to the product's `basePrice` (can be negative for a cheaper option)
- `inventoryQuantity` — physical stock on hand
- `reservedQuantity` — units currently sitting in active carts
- `attributes` (JSONB) — arbitrary key/value, e.g. `{ "color": "blue", "size": "L" }`

**Available stock = `inventoryQuantity − reservedQuantity`**

### Inventory Tracking

Every stock change writes an `InventoryLog` entry with a `reason` (`purchase`, `return`, `manual_adjustment`). This creates an immutable audit trail for stock discrepancies.

### Filtering & Caching

`GET /products` supports `categoryId`, `brandId`, `minPrice`, `maxPrice`, `search` (ILIKE), and `sortBy` (newest / price-asc / price-desc / rating). Results are cached in **Redis** for 5 minutes per unique filter combination. `GET /products/:id` also increments `metadata.viewCount` and is cached per ID for 10 minutes. All caches are invalidated on any write operation.

### API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/products` | Public | List with filters, sorting, pagination |
| GET | `/products/:id` | Public | Product detail (increments view count) |
| POST | `/products` | Admin | Create product |
| PATCH | `/products/:id` | Admin | Update product |
| DELETE | `/products/:id` | Admin | Soft-delete (sets `isActive = false`) |

---

## Cart Module

`src/modules/cart/`

### Business Purpose

The cart is the holding area between browsing and buying. It tracks what items a customer wants, validates stock availability in real time, computes running totals, and broadcasts live updates over WebSocket so the cart badge in the UI updates instantly across browser tabs.

### Cart Behavior

- A cart is created lazily — `getOrCreateCart` either returns the existing cart for the user or creates a new empty one. Customers are never blocked by a missing cart.
- **Guest carts** are identified by a `sessionId` (stored in the DB); they can be merged into a user cart after login.
- Adding an item that already exists in the cart **increments the quantity** rather than creating a duplicate line.
- Before adding an item, available stock (`inventoryQuantity − reservedQuantity`) is checked. If insufficient, `400 Bad Request` is returned.
- Every mutation (add, update, remove, clear) recalculates the cart total server-side and emits a `cart_updated` Socket.io event to the user's room, keeping all connected tabs in sync.

### Abandoned Cart Job

A **BullMQ** background job (`abandoned-cart.job.ts`) runs on a schedule to identify carts that have been inactive for a configurable period and trigger a re-engagement email via the mailer service.

### API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/cart` | JWT | Get cart with calculated totals |
| POST | `/cart/items` | JWT | Add item (creates cart if needed) |
| PATCH | `/cart/items/:id` | JWT | Update item quantity |
| DELETE | `/cart/items/:id` | JWT | Remove a single item |
| DELETE | `/cart` | JWT | Clear entire cart |

---

## Orders Module

`src/modules/orders/`

### Business Purpose

The orders module converts a cart into a purchase. It manages the full lifecycle from checkout validation through payment processing, shipping calculation, and order status tracking.

### Checkout Flow (inside a DB transaction)

1. **Validate** — cart must exist and be non-empty.
2. **Inventory check** — every cart item's `quantity` is compared against available stock. If any item fails, the entire checkout is rejected with a descriptive error.
3. **Calculate totals** — `subtotal` = sum of `(basePrice + priceModifier) × quantity` across all items.
4. **Apply coupon** (optional) — validates the coupon code is active, not expired, and within its usage limit. Applies `PERCENTAGE` or `FIXED` discount and respects `maxDiscount` cap.
5. **Shipping cost** — `ShippingService` calculates the shipping fee based on the destination address and order value (free shipping threshold logic).
6. **Create Order** — an `Order` record is saved with `status = PENDING`.
7. **Create OrderItems** — one `OrderItem` per cart line, snapshotting the price at time of purchase.
8. **Reserve inventory** — increments `reservedQuantity` on each `ProductVariant` to prevent double-selling.
9. **Clear cart** — all `CartItem` records for this cart are deleted.
10. **Process payment** — Stripe `PaymentIntent` is created (or Cash-on-Delivery is flagged as pending).
11. **Enqueue confirmation email** — a BullMQ job is added to send the order confirmation asynchronously.

### Order Status Lifecycle

```
PENDING → PROCESSING → SHIPPED → DELIVERED
              ↓
           CANCELLED → REFUNDED
```

Status transitions are managed by admins via `PATCH /orders/:id/status`. Each transition can trigger downstream side effects (e.g. releasing reserved inventory on cancellation).

### Payment

- **Stripe** — creates a `PaymentIntent` and returns a `clientSecret` to the frontend for card entry. Webhook events (`payment_intent.succeeded`, `payment_intent.payment_failed`) update the order's `paymentStatus` asynchronously.
- **Cash on Delivery** — no Stripe call; order is created with `paymentStatus = PENDING`.

### Coupons

| Type | Behavior |
|---|---|
| `PERCENTAGE` | Deducts `value`% of subtotal, capped at `maxDiscount` |
| `FIXED` | Deducts a fixed amount (cannot exceed the subtotal) |
| `FREE_SHIPPING` | Waives the shipping fee |

Coupons have `usageLimit` (max total redemptions), `startDate`, `endDate`, and `minOrderValue` constraints.

### API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/orders` | JWT | List own orders (filterable by status) |
| GET | `/orders/:id` | JWT | Order detail |
| PATCH | `/orders/:id/status` | Admin | Update order status |
| GET | `/orders/analytics/summary` | JWT | Order analytics for the current user |
| POST | `/checkout/validate` | JWT | Validate cart before checkout |
| POST | `/checkout/create-order` | JWT | Full checkout — creates order + payment |
| POST | `/checkout/apply-coupon` | JWT | Preview coupon discount |

---

## Reviews Module

`src/modules/reviews/`

### Business Purpose

Customer reviews build trust and help other shoppers make informed decisions. Reviews can optionally be tied to a specific order, verifying that the reviewer actually purchased the product.

### Review Rules

- Only the review's author can **update** or **delete** their own review. Other users receive `403 Forbidden`.
- Deleting a review sets `isActive = false` (soft delete) — the data is retained for analytics.
- Reviews are paginated and returned sorted newest-first.
- Each review has a `rating` (1–5), a `title`, `body`, and optional `images`.

### Product Rating Sync

When a review is created or updated, the product's `metadata.avgRating` and `metadata.reviewCount` fields are updated to reflect the new aggregate score. This allows the products list to sort by rating without a costly JOIN on every request.

### API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/reviews?productId=` | Public | List reviews for a product (paginated) |
| GET | `/reviews/:id` | Public | Get a single review |
| POST | `/reviews` | JWT | Submit a review |
| PATCH | `/reviews/:id` | JWT | Update own review |
| DELETE | `/reviews/:id` | JWT | Soft-delete own review |

---

## Notifications Module

`src/modules/notifications/`

### Business Purpose

Customers need real-time feedback on events that matter to them — order status changes, payment confirmations, cart updates. This module delivers notifications both persistently (stored in the DB for the inbox) and in real-time (pushed over WebSocket).

### How It Works

1. Any service that wants to notify a user calls `NotificationService.create({ userId, type, title, message })`.
2. The notification is saved to the `notifications` table.
3. **Immediately**, a Socket.io event `newNotification` is emitted to the user's private room (`user:{userId}`).
4. The user's inbox shows all notifications, with unread ones queryable by `readAt IS NULL`.

### WebSocket Connection

The `NotificationsGateway` handles Socket.io connections:
- On connect, the gateway reads the JWT from `Authorization: Bearer <token>` in the handshake headers.
- If valid, the socket is joined to the room `user:{userId}`.
- Invalid or missing tokens cause an immediate disconnect.

The gateway also exposes `sendCartUpdate(userId, cart)` — called by `CartService` after every cart mutation to push the updated cart state to the user in real time.

### Notification Inbox

| Action | Description |
|---|---|
| `GET /notifications` | Paginated list of own notifications (newest first) |
| `PATCH /notifications/:id/read` | Mark a single notification as read |
| `PATCH /notifications/read-all` | Mark all notifications as read |
| `DELETE /notifications/:id` | Delete a notification |

---

## Search Module

`src/modules/search/`

### Business Purpose

PostgreSQL `ILIKE` queries work for simple searches but don't support fuzzy matching, typo tolerance, or relevance ranking. Elasticsearch provides all of these, plus fast faceted filtering across millions of products.

### Full-Text Search

`GET /search?q=blue+shirt&category=clothing&minPrice=20&maxPrice=100&sortBy=rating`

The Elasticsearch query:
1. Runs a `multi_match` across `name` (weight ×3), `shortDescription` (×2), `description`, and `seoKeywords` with `fuzziness: AUTO` for typo tolerance.
2. Applies `term` filters for category and brand (exact match).
3. Applies a `range` filter for price.
4. Applies a stock filter (`stock > 0`) if `inStock=true`.
5. Only returns `isActive = true` products (applied as a Elasticsearch `filter` for performance).

Sort options: relevance (default), `price-low`, `price-high`, `newest`, `rating`.

### Product Indexing

When a product is created or updated, `ElasticsearchService.indexProduct(product)` writes the denormalized document to the `products` index — including name, description, category, brand, price, stock, and metadata — so no joins are needed at query time.

### Recommendations

`RecommendationsService` provides three recommendation types:

| Type | Logic |
|---|---|
| **Frequently Bought Together** | Queries `order_items` to find products co-purchased with the given product |
| **Similar Products** | Finds active products in the same category or by the same brand, excluding the current product |
| **Personalized** | Aggregates categories from the user's order history and wishlist, ranks by frequency, then returns top-rated products from the top 3 categories |

### API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/search` | Public | Full-text search with filters |
| GET | `/search/recommendations/similar/:id` | Public | Similar products |
| GET | `/search/recommendations/bought-together/:id` | Public | Frequently bought together |
| GET | `/search/recommendations/personalized` | JWT | Personalized recommendations |

---

## Admin Module

`src/modules/admin/`

### Business Purpose

Admins and staff need a back-office to understand business performance, manage operations, and maintain accountability. This module provides a sales dashboard, staff account management, and a tamper-proof audit log.

### Dashboard & Analytics

`GET /admin/dashboard?timeRange=30d`

Returns a time-series breakdown for the chosen range (7d / 30d / 90d / 1y):
- **Daily sales** — revenue, order count, and average order value per day (excludes cancelled orders)
- **Top 10 products** — by units sold and revenue
- **Category performance** — revenue and order count per category
- **User stats** — total customers and new customers in the last 7 days
- **Summary** — total revenue, total orders, average order value for the period

`GET /admin/analytics` (via `AnalyticsService`) provides real-time counters:
- Total orders, users, products, and cumulative revenue
- The 5 most recent orders with user details

### Staff Management

Admins can create back-office staff accounts linked to a `User` record. Each staff member has an `employeeId`, `department`, and `position`. This separates operational staff identity from customer identity while reusing the same authentication system.

| Action | Endpoint |
|---|---|
| Create staff | `POST /admin/staff` |
| List staff | `GET /admin/staff` |
| Get staff by ID | `GET /admin/staff/:id` |
| Update staff | `PATCH /admin/staff/:id` |
| Remove staff | `DELETE /admin/staff/:id` |

### Audit Log

Every significant admin action (product update, order status change, user deactivation) is recorded in the `audit_logs` table via `AnalyticsService.logAction()`. Each entry captures:
- `userId` — who performed the action
- `action` — what was done (e.g. `UPDATE_ORDER_STATUS`)
- `entity` and `entityId` — what was affected
- `metadata` (JSONB) — before/after state or other context
- `createdAt` — when it happened

The audit log is immutable — records are only inserted, never updated or deleted.

### API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/admin/dashboard` | Admin | Sales dashboard with time-range filter |
| GET | `/admin/analytics` | Admin | Real-time counters and recent orders |
| GET | `/admin/audit-logs` | Admin | Recent audit log entries |
| POST | `/admin/staff` | Admin | Create staff account |
| GET | `/admin/staff` | Admin | List all staff |
| GET | `/admin/staff/:id` | Admin | Staff detail |
| PATCH | `/admin/staff/:id` | Admin | Update staff |
| DELETE | `/admin/staff/:id` | Admin | Remove staff |

---

## Cross-Module Flow: Full Purchase Journey

This diagram shows how modules interact from the moment a visitor lands on the site to when their order is delivered.

```
1. VISITOR LANDS
   └─► Auth Module: POST /auth/register or /auth/login
       └─► Issues JWT access token + refresh token

2. BROWSE CATALOG
   └─► Products Module: GET /products (with filters)
       ├─► Redis cache hit → instant response
       └─► Redis cache miss → PostgreSQL query → cache result

   └─► Search Module: GET /search?q=...
       └─► Elasticsearch full-text + fuzzy search

3. ADD TO CART
   └─► Cart Module: POST /cart/items
       ├─► Validates stock (inventoryQuantity - reservedQuantity)
       ├─► Creates/updates CartItem
       └─► Notifications Module (WebSocket): emits cart_updated to browser

4. CHECKOUT
   └─► Orders Module: POST /checkout/validate
       └─► Confirms cart is valid and stock is available

   └─► Orders Module: POST /checkout/create-order (DB transaction)
       ├─► Recalculates totals
       ├─► Applies coupon (if any)
       ├─► Calculates shipping
       ├─► Creates Order + OrderItems
       ├─► Reserves inventory (increments reservedQuantity)
       ├─► Clears cart
       ├─► Payment: Stripe PaymentIntent or COD
       └─► BullMQ: enqueues order-confirmation email job

5. PAYMENT WEBHOOK (async)
   └─► Stripe → POST /checkout/webhook
       ├─► payment_intent.succeeded → Order status = PROCESSING, paymentStatus = PAID
       └─► payment_intent.payment_failed → Order status = CANCELLED, paymentStatus = FAILED

6. ORDER UPDATES
   └─► Admin updates status: PATCH /orders/:id/status
       └─► Notifications Module: sends real-time push + persists notification

7. POST-PURCHASE
   └─► Reviews Module: POST /reviews (linked to orderId)
   └─► Search Module: GET /search/recommendations/personalized
       └─► Uses order history to suggest next purchases

8. ONGOING ENGAGEMENT
   └─► Cart Module (BullMQ job): abandoned-cart check
       └─► Mailer Service: re-engagement email if cart abandoned > threshold
```

---

## Infrastructure Summary

| Layer | Technology | Used For |
|---|---|---|
| Database | PostgreSQL + TypeORM | Persistent data, relations, transactions |
| Cache | Redis (ioredis) | Product/cart caching, distributed locks, pub-sub |
| Queue | BullMQ | Async jobs: emails, order processing |
| Search | Elasticsearch | Full-text search, fuzzy matching |
| Real-time | Socket.io + Redis adapter | Live cart and notification updates |
| Email | Nodemailer + @nestjs-modules/mailer | Transactional emails |
| Payments | Stripe | Card payments and webhooks |
| File Storage | AWS S3 | Product images and user avatars |

# Code Review Issues & Fix Plan

Generated: 2026-04-27

---

## Summary

Review of uncommitted changes and recent commits identified **2 critical bugs**, **2 high-priority configuration issues**, and **2 medium-priority issues**. Two test suites are failing (10 tests total).

| Severity | Count | Categories |
|----------|-------|------------|
| Critical | 2 | Unreachable route, failing tests |
| High | 2 | Missing env vars, DB sync mismatch |
| Medium | 2 | Lint failure, property mismatch |

---

## 1. Critical Issues

### 1.1 Unreachable Route in `OrdersController`

- **File:** `src/modules/orders/controllers/orders.controller.ts`
- **Issue:** `@Get('analytics/summary')` is declared **after** `@Get(':id')`. NestJS evaluates routes top-to-bottom, so `GET /orders/analytics/summary` is captured by `:id` with `id="analytics/summary"`.
- **Impact:** The analytics endpoint returns 404 or wrong data for any request to `/orders/analytics/summary`.
- **Fix:** Move `@Get('analytics/summary')` above `@Get(':id')`.

```typescript
// BEFORE (broken)
@Get(':id')           // captures /orders/analytics/summary
async findOne(...) {}

@Get('analytics/summary')
async getAnalytics() {}

// AFTER (fixed)
@Get('analytics/summary')
async getAnalytics() {}

@Get(':id')
async findOne(...) {}
```

---

### 1.2 Failing Tests (2 Suites, 10 Tests)

#### Payment Service Tests
- **File:** `src/modules/orders/tests/payment.service.spec.ts`
- **Issue:** `PaymentService` constructor now injects `WebhookEventRepository` at index 3, but the test module does not provide a mock for it.
- **Fix:** Add mock provider:

```typescript
{
  provide: getRepositoryToken(WebhookEvent),
  useValue: { create: jest.fn(), save: jest.fn() },
}
```

#### Categories Service Tests
- **File:** `src/modules/products/tests/categories.service.spec.ts`
- **Issue:** `CategoriesService.findAll()` now uses `findAndCount()` returning `{ categories, total, page, limit }`, but the mock only implements `find()` and the test expects the old return shape.
- **Fix:**
  1. Add `findAndCount: jest.fn().mockResolvedValue([[], 0])` to `mockCategoryRepository()`.
  2. Update the `findAll` test assertion to expect the paginated object.

---

## 2. High Priority Issues

### 2.1 Missing Required Environment Variables

The `.env` file is missing several variables that the application actively uses. `.env.example` has some, but `.env` (the active file) does not.

| Variable | Used In | Current Behavior if Missing |
|----------|---------|----------------------------|
| `SMTP_SECURE` | `mailer.service.ts:38` | Defaults to `false`; may cause TLS issues on port 465 |
| `SUPPORT_EMAIL` | `mailer.service.ts:139` | Renders as `undefined` in email templates |
| `APP_NAME` | `mailer.service.ts:138` | Falls back to "E-Commerce Store" |
| `APP_LOGO_URL` | `mailer.service.ts:141` | Logo missing in emails |
| `APP_URL` | `auth.service.ts:95` | Password reset links use `http://localhost:3000` |
| `FRONTEND_URL` | `main.ts:23` | CORS may block frontend requests |
| `REDIS_DB` | `redis.service.ts:34` | Defaults to `0`; usually fine but should be explicit |

**Fix:** Add all missing variables to `.env` with sensible development defaults:

```env
SMTP_SECURE=false
SUPPORT_EMAIL=support@yourstore.com
APP_NAME=Ecommerce
APP_LOGO_URL=http://localhost:3000/logo.png
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001
REDIS_DB=0
```

---

### 2.2 Database `synchronize` Discrepancy

- **File:** `src/app.module.ts:47`
- **Issue:** `synchronize: configService.get('NODE_ENV') !== 'production'` enables auto-sync in development. This contradicts `AGENTS.md` which mandates `synchronize: false` — **always generate and run migrations**.
- **Impact:** Schema changes in development are silently auto-applied, bypassing migrations. This leads to drift between environments and broken migration generation.
- **Fix:** Set `synchronize: false` unconditionally.

```typescript
// BEFORE
synchronize: configService.get('NODE_ENV') !== 'production',

// AFTER
synchronize: false,
```

---

## 3. Medium Priority Issues

### 3.1 Prettier / Lint Error

- **File:** `src/modules/orders/orders.module.ts:24`
- **Issue:** The `TypeOrmModule.forFeature([...])` array exceeds the maximum line length. Running `npx eslint "src/**/*.ts" --max-warnings 0` fails.
- **Fix:** Reformat the array across multiple lines.

```typescript
TypeOrmModule.forFeature([
  Order,
  OrderItem,
  Payment,
  Shipping,
  Coupon,
  WebhookEvent,
]),
```

---

### 3.2 Abandoned Cart Property Mismatch

- **File:** `src/infrastructure/email/mailer.service.ts:222-241`
- **Issue:** `sendAbandonedCartReminder` expects `recoveryUrl` in its data signature, but the queue job and callers pass `recoveryLink`. This causes the recovery link to be `undefined` in the rendered email.
- **Fix:** Align the service method to accept `recoveryLink` (matching the caller) instead of `recoveryUrl`.

---

## Execution Plan

### Phase 1: Lint & Format
1. Fix `orders.module.ts` line length.

### Phase 2: Tests
2. Add `WebhookEvent` mock to `payment.service.spec.ts`.
3. Add `findAndCount` mock and update assertion in `categories.service.spec.ts`.

### Phase 3: Bugs
4. Move `analytics/summary` route above `:id` in `orders.controller.ts`.
5. Fix `recoveryUrl` -> `recoveryLink` in `mailer.service.ts`.

### Phase 4: Configuration
6. Update `.env` with all missing variables.
7. Set `synchronize: false` in `app.module.ts`.

### Phase 5: Verification
8. Run `npx eslint "src/**/*.ts" --max-warnings 0`.
9. Run `npm test`.
10. Run `npm run build`.

---

## New Features (Recent Commits)

These were identified during the review and are working correctly:

1. **Admin Orders Endpoint** (`8c83a7e`)
   - `GET /orders/admin/all` — Admin-only route to list all orders with optional `status` filter.

2. **Socket Notification Hardening** (`ca7a1e0`)
   - WebSocket gateway now parses `Bearer` tokens, validates JWT payload, stores `userId` in `client.data`, and leaves rooms on disconnect using stored data.
   - `NotificationService.markAsRead` and `remove` now require `userId`, preventing cross-user modification.

3. **Categories Pagination Enhancement**
   - `CategoriesService.findAll()` now returns `{ categories, total, page, limit }` using `findAndCount()`.

---

## Environment Requirements

For the application to run correctly, ensure these services are available:

- **PostgreSQL** (port 5432)
- **Redis** (port 6379)
- **Elasticsearch** (port 9200) — health check catches failures gracefully

### Minimum `.env` Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres123
DATABASE_NAME=ecommerce_db

# JWT
JWT_SECRET=your_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
MAIL_FROM=noreply@yourstore.com
SMTP_SECURE=false
SUPPORT_EMAIL=support@yourstore.com

# App
APP_NAME=Ecommerce
APP_URL=http://localhost:3000
APP_LOGO_URL=http://localhost:3000/logo.png
FRONTEND_URL=http://localhost:3001

# Elasticsearch
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_API_KEY=your_api_key
```

---

*End of review document.*

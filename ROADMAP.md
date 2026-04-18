# E-Commerce Backend — Roadmap

## Project Review

### Module Status

| Module | Entity | Repository | Service | Controller | Tests |
|--------|--------|-----------|---------|-----------|-------|
| auth | ✓ | ✓ | ✓ | ✓ | ✓ |
| users | ✓ | ✓ | ✓ | ✓ | ✓ |
| products | ✓ (7 entities) | ✓ | ✓ (5 services) | ✓ | ✓ |
| cart | ✓ | ✓ | ✓ | ✓ | ✓ |
| orders | ✓ (5 entities) | ✓ | ✓ (5 services) | ✓ | ✓ |
| reviews | ✓ | ✓ | ✓ | ✓ | partial |
| admin | ✓ | ✓ | ✓ | ✓ | missing |
| returns | ✓ | missing | ✓ | ✓ | missing |
| newsletter | ✓ | missing | ✓ | ✓ | missing |
| notifications | ✓ | missing | ✓ | ✓ | partial |
| search | ✓ | missing | ✓ | ✓ | missing |
| health | — | — | — | ✓ | missing |

### Infrastructure Status

| Service | Status |
|---------|--------|
| PostgreSQL + TypeORM | wired |
| Redis + BullMQ | wired |
| Stripe payments | intent creation — **no webhook handler** |
| AWS S3 | service exists — **no upload endpoints** |
| Elasticsearch | service exists — **no indexing hooks** |
| Email / Nodemailer | service exists — **no templates** |
| Socket.io notifications | gateway wired |
| Docker / CI | missing |

---

## Gap Analysis

### Critical — Broken in Production

| # | Gap | Impact |
|---|-----|--------|
| C1 | No Stripe webhook handler | Orders stay `PENDING` after payment; real money risk |
| C2 | No email templates | Order confirmations, password resets, newsletters cannot send |
| C3 | Elasticsearch indexing not hooked up | Search always returns empty results |
| C4 | No S3 upload endpoints | Product images table is permanently empty |

### Structural — Breaks Architecture Pattern

| # | Gap | Impact |
|---|-----|--------|
| S1 | Missing repositories in `newsletter`, `notifications`, `returns` | Raw TypeORM injection instead of `AbstractRepository<T>` |
| S2 | Returns workflow is a stub | No approve/reject/refund flow, no Stripe refund call |

### Missing Business Logic

| # | Gap | Impact |
|---|-----|--------|
| B1 | Tax calculation always returns 0 | `taxAmount` field is never populated |
| B2 | No admin coupon management | `CouponService` exists but no admin endpoints |
| B3 | No inventory restock alert | Out-of-stock not detected automatically |
| B4 | Newsletter send missing | Subscriber list is useless without broadcast endpoint |

### Production Readiness

| # | Gap | Impact |
|---|-----|--------|
| P1 | No Docker / docker-compose | Manual local setup required for every environment |
| P2 | No CI/CD pipeline | No automated quality gate on PRs |
| P3 | No e2e tests | Checkout, auth, and order lifecycle untested end-to-end |
| P4 | No Stripe webhook signature verification | Security hole if webhook is added without it |

---

## Phase 1 — Close Critical Holes

> Nothing downstream works reliably without these.

- [x] **1.1** Stripe webhook handler + signature verification
  - Handle `payment_intent.succeeded` and `payment_intent.payment_failed`
  - Update order `paymentStatus` and `status` from webhook, not client
  - Verify `Stripe-Signature` header on every incoming webhook request

- [x] **1.2** Email templates
  - Order confirmed (with line items, total, shipping address)
  - Password reset (token link, expiry notice)
  - Newsletter broadcast (unsubscribe link required)

- [x] **1.3** S3 product image upload endpoint
  - `POST /products/:id/images` — upload and store URL in `product_images`
  - `DELETE /products/:id/images/:imageId` — remove from S3 and DB
  - Reuse `S3Service` already in `src/infrastructure/storage/s3.service.ts`

- [x] **1.4** Elasticsearch indexing hooks
  - Index product on `ProductsService.create` and `ProductsService.update`
  - Remove from index on `ProductsService.softDelete`
  - Bulk re-index script for existing products

---

## Phase 2 — Complete Business Workflows

> Scaffolded but not functional end-to-end.

- [x] **2.1** Returns: approve / reject / refund flow
  - Admin endpoints: `PATCH /returns/:id/approve`, `PATCH /returns/:id/reject`
  - On approve: call Stripe refund API, update order `paymentStatus` to `refunded`
  - Emit notification to customer on status change

- [x] **2.2** Add repositories to `newsletter`, `notifications`, `returns`
  - Extend `AbstractRepository<T>` instead of raw TypeORM injection
  - Keeps the data-access pattern consistent across all modules

- [x] **2.3** Tax calculation service
  - Configurable rate per country/region via env or DB config table
  - Calculate and persist `taxAmount` during checkout

- [x] **2.4** Admin coupon management endpoints
  - Move or expose `CouponService` CRUD via `admin` module
  - Endpoints: list, create, update, deactivate, delete

- [x] **2.5** Inventory restock alert via BullMQ
  - After each sale, check if stock falls below configurable threshold
  - Enqueue `low-stock` job → send email to admin

- [x] **2.6** Newsletter broadcast / send endpoint
  - `POST /newsletter/send` (admin only) — send to all active subscribers
  - Use email template from Phase 1.2
  - Enqueue sends via BullMQ to avoid timeout on large lists

---

## Phase 3 — Test Coverage

> Close testing gaps before adding more features.

- [x] **3.1** Unit tests for untested modules
  - `admin`: analytics.service, dashboard.service, staff.service
  - `newsletter`: newsletter.service
  - `returns`: returns.service
  - `search`: search.service, elasticsearch.service

- [x] **3.2** E2e tests for critical flows
  - Auth flow: register → verify email → login → refresh token → logout
  - Checkout flow: add to cart → apply coupon → checkout → payment → order created
  - Order lifecycle: created → processing → shipped → delivered

- [x] **3.3** Webhook integration test
  - Simulate Stripe `payment_intent.succeeded` event with valid signature
  - Assert order `paymentStatus` transitions to `paid`

---

## Phase 4 — Production Readiness

> Deploy-ready infrastructure.

- [x] **4.1** Docker + docker-compose
  - Services: app, postgres, redis, elasticsearch
  - `.env.example` with all required variables documented
  - Multi-stage Dockerfile (build → production)

- [x] **4.2** GitHub Actions CI pipeline
  - Steps: lint → unit tests → build → docker build
  - Run on every PR targeting `main`

- [x] **4.3** Migration step in CI / deploy
  - Run `migration:run` automatically before app starts in production
  - Prevent deploy if migration fails

- [x] **4.4** Seed data
  - Sample categories (tree structure), brands, and products
  - Useful for staging environment and demo purposes

- [x] **4.5** Rate limiting per sensitive endpoint
  - Apply `ThrottleGuard` to: `POST /auth/login`, `POST /auth/register`, `POST /orders/checkout`
  - Configure stricter limits than the global default

---

## Recommended Start

Start with **Phase 1.1 — Stripe webhook handler**.

It is the highest-risk gap in the entire project. A customer can complete payment on Stripe's side while the order remains `PENDING` in the database. This means:
- Customer is charged but receives no confirmation
- Order is never fulfilled
- No refund is triggered automatically

Every other feature builds on a trustworthy payment state. Fix this first.

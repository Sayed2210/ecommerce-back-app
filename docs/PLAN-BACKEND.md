# Backend API Fix Plan

> Contract-level fixes the backend team must implement so the frontend can consume a reliable, documented, secure API.

---

## P0 — Critical (Breaks Authentication / Security / Core Flows)

### 1. Rename Security Scheme to `bearer`
- **File:** Backend Swagger / OpenAPI generator config
- **Action:** Change `components.securitySchemes.JWT-AUTH` → `bearer` (or update all endpoint `security` blocks to reference `JWT-AUTH`)
- **Why:** Swagger UI cannot authorize requests when the referenced scheme name does not exist
- **Impact:** All protected endpoints appear locked but tokens are never sent

### 2. Implement & Return Consistent Response Schemas
- **Priority Endpoints:**
  | Endpoint | Required Schema |
  |----------|-----------------|
  | `POST /auth/login` | `TokenResponse` (`accessToken`, `refreshToken`, `user?: User`) |
  | `GET /users/me` | `User` profile object |
  | `GET /products` | `PaginatedResponse<Product>` |
  | `GET /products/{id}` | `Product` with nested `variants`, `category`, `brand`, `reviewsSummary` |
  | `GET /orders` | `PaginatedResponse<Order>` |
  | `GET /orders/{id}` | `Order` with `items`, `shippingAddress`, `timeline` |
  | `GET /cart` | `Cart` with `items[]`, `summary` (subtotal, discount, total) |
  | `GET /wishlist` | `WishlistItem[]` or `PaginatedResponse<WishlistItem>` |
- **Why:** Frontend currently guesses JSON shape; causes deserialization bugs

### 3. Implement `PaginatedResponse<T>` Globally
- **Action:** Return wrapper for **every** list endpoint:
  ```json
  {
    "data": [],
    "meta": { "page": 1, "limit": 10, "total": 100, "totalPages": 10 }
  }
  ```
- **Endpoints:** `/products`, `/users`, `/orders`, `/notifications`, `/reviews/product/{productId}`, `/returns`, `/admin/staff`, `/search`
- **Why:** Frontend pagination components (`DataTablePagination.vue`) need `total` and `totalPages`

---

## P1 — High (Causes Bugs or Security Gaps)

### 4. Implement `Accept-Language` Resolution
- **Endpoints:** `GET /products`, `GET /products/{id}`, `GET /search`, `GET /categories`, `GET /brands`
- **Action:** Read `Accept-Language` header (e.g., `en`, `ar`) and return localized fields (`name.en`, `description.ar`, etc.)
- **Fallback:** Default to `en` if header missing or locale not found
- **Why:** Frontend sends this header for bilingual support

### 5. Return `401` for Missing/Invalid JWT
- **Scope:** All endpoints with `security: [{ bearer: [] }]`
- **Action:** Ensure middleware returns `401 Unauthorized` (not `403`) when:
  - No `Authorization` header
  - Token expired or malformed
- **Why:** Frontend auth middleware (`app/middleware/auth.ts`) relies on `401` to trigger refresh or redirect

### 6. Return `403` for Forbidden Resource Access
- **Endpoints:**
  - `GET /orders/{id}` — user tries to view another user's order
  - `GET /returns/{id}` — user tries to view another user's return
  - `PATCH /reviews/{id}` — user tries to edit another user's review
  - `DELETE /reviews/{id}` — user tries to delete another user's review
- **Why:** Prevents IDOR (Insecure Direct Object Reference) vulnerabilities

### 7. Add Missing Request Body Endpoints
- **Endpoints:**
  | Endpoint | Body Required |
  |----------|---------------|
  | `PATCH /orders/{id}/status` | `{ "status": "shipped" }` (enum) |
  | `POST /checkout/apply-coupon` | `{ "code": "SUMMER2024" }` |
  | `POST /newsletter/unsubscribe` | `{ "email": "user@example.com" }` |
- **Why:** Frontend forms submit these fields but backend contract is undocumented

### 8. Implement `UpdateReviewDto`
- **Fields:** `rating` (1–5), `title` (string), `comment` (string), `images` (string[])
- **Validation:** Same rules as `CreateReviewDto` but all fields optional
- **Why:** Current schema is empty `{}`, so any payload is technically valid

---

## P2 — Medium (Contract Consistency & Clean-Up)

### 9. Remove or Deprecate Duplicate Wishlist Endpoint
- **Action:** Remove `GET /users/me/wishlist`; keep canonical `GET /wishlist`
- **Why:** Confuses frontend (two endpoints, same data). If backward compat required, mark as `@Deprecated`

### 10. Standardize DELETE Responses to `204 No Content`
- **Endpoints to fix:**
  - `DELETE /tags/{id}` → currently `200`, change to `204`
  - `DELETE /notifications/{id}` → currently `200`, change to `204`
- **Keep `204`:** `/products/{id}`, `/users/{id}`, `/cart/items/{id}`, `/wishlist/{productId}`, `/admin/staff/{id}`
- **Why:** `204` is the REST convention for successful deletion with no body

### 11. Fix `/auth/logout` Contract
- **Current:** Requires both Bearer token AND `refreshToken` in body
- **Options:**
  - **A:** Accept only Bearer token (read user from JWT, revoke all sessions)
  - **B:** Accept only `refreshToken` in body (no Bearer required)
- **Recommended:** Option A — simpler for frontend, standard OAuth2 behavior

### 12. Add `sortOrder` Parameter or Clarify `sortBy` Values
- **Endpoints:** `/products`, `/search`
- **Options:**
  - **A:** Add `sortOrder` (`asc`/`desc`) alongside `sortBy` (`price`, `name`, `createdAt`)
  - **B:** Accept combined values: `price_asc`, `price_desc`, `name_asc`, etc.
- **Why:** Frontend currently cannot sort descending (e.g., price high→low)

### 13. Add `tags` Filter to `/search`
- **Parameter:** `tags` (array of tag slugs / IDs)
- **Why:** Tags API exists but search cannot filter by them

### 14. Add Pagination to `/coupons`
- **Why:** Admin coupon list will grow; needs `page`/`limit`/`total`

### 15. Add Date Range to `/orders/analytics/summary`
- **Parameters:** `from` (date), `to` (date), `granularity` (`day`, `week`, `month`)
- **Why:** Dashboard KPIs need time-filtered analytics

### 16. Add Status Filter to `/returns` (Admin)
- **Parameter:** `status` (`pending`, `approved`, `rejected`, `received`)
- **Why:** Admin returns list needs filtering by status

### 17. Remove or Restrict `POST /admin/analytics/audit-logs`
- **Question:** Should admins manually create audit logs?
- **Recommendation:** Remove from public API; audit logs should be system-generated only. If needed, restrict to super-admin.

---

## P3 — Low (Nice to Have / Observability)

### 18. Implement Rate Limiting on Auth Endpoints
- **Endpoints:** `POST /auth/login`, `POST /auth/register`, `POST /auth/forgot-password`
- **Action:** Return `429 Too Many Requests` with `Retry-After` header after threshold
- **Why:** Prevents brute-force attacks; frontend can show countdown UI

### 19. Add Health Check Endpoint Caching
- **Endpoint:** `GET /health`
- **Action:** Cache DB/Redis health status for 5–10 seconds to avoid hammering connections on every call
- **Why:** Frontend might poll this for status pages

### 20. Add `X-Request-Id` Header Support
- **Action:** Accept optional `X-Request-Id` header, propagate to logs, return in response headers
- **Why:** Easier frontend-to-backend debugging

---

## Execution Order

```
Sprint 1 — Stability
├── Fix security scheme name (P0)
├── Add core response schemas: login, user, product, order, cart (P0)
├── Implement PaginatedResponse<T> wrapper (P0)
└── Return 401 for invalid/missing JWT (P1)

Sprint 2 — Security & Completeness
├── Add 403 checks for resource ownership (P1)
├── Implement Accept-Language resolution (P1)
├── Add missing request bodies: order status, coupon apply, unsubscribe (P1)
├── Implement UpdateReviewDto (P1)
└── Fix /auth/logout contract (P2)

Sprint 3 — Consistency
├── Standardize DELETE responses to 204 (P2)
├── Remove/deprecate duplicate wishlist endpoint (P2)
├── Clarify sortBy/sortOrder strategy (P2)
├── Add tags filter to search (P2)
└── Add pagination to /coupons (P2)

Sprint 4 — Polish
├── Add date range to analytics (P2)
├── Add status filter to returns (P2)
├── Restrict audit-log creation (P2)
├── Add rate limiting + 429 responses (P3)
└── Add X-Request-Id tracing (P3)
```

---

## Definition of Done

- [ ] All list endpoints return `PaginatedResponse<T>` with accurate `meta.total`
- [ ] All protected endpoints return `401` for missing/invalid JWT
- [ ] Resource-specific endpoints return `403` for cross-user access attempts
- [ ] `POST /auth/login` returns `TokenResponse` schema consistently
- [ ] `Accept-Language` header resolves localized JSONB fields
- [ ] No duplicate endpoints serve the same purpose
- [ ] All DELETE mutations return `204 No Content`
- [ ] Rate limiting returns `429` with `Retry-After` on auth endpoints
- [ ] Swagger UI "Authorize" button works end-to-end with Bearer tokens
- [ ] Frontend QA signs off on all composables (`useAuth`, `useCart`, `useOrders`, etc.)

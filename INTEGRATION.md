# Frontend ↔ Backend Integration Plan

**Frontend:** Nuxt 4 / Vue 3 — `git@github.com:Sayed2210/E-Commerce-front-app.git`
**Backend:** NestJS — this repo
**Base URL env var (frontend):** `NUXT_PUBLIC_API_BASE_URL=http://localhost:3001`
**Backend port (local dev):** 3001 (change `PORT=3001` in `.env` to avoid collision with Nuxt's default 3000)

---

## Quick-Start (Local Dev)

```bash
# Backend (.env)
PORT=3001
FRONTEND_URL=http://localhost:3000

# Frontend (.env)
NUXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

CORS already allows `http://localhost:3000` and `http://localhost:3001` in non-production.

---

## Status Overview

| Feature | Status |
|---------|--------|
| Auth (register / login / refresh / verify-email / forgot-reset password) | Fully wired |
| Product listing & detail | Fully wired |
| Cart management (add / update / remove / clear) | Fully wired |
| Wishlist | Fully wired |
| Product reviews (read + write) | Fully wired |
| Order history list | Fully wired |
| Admin: products, orders, staff, audit logs | Mostly wired (see gaps) |
| **Logout (server-side revocation)** | Broken — 2 bugs |
| **Sort/filter products** | Broken — param name mismatch |
| **Checkout / place order** | Not wired at all |
| **Shipping addresses** | Backend done, zero frontend |
| **Returns** | Backend done, UI is a TODO stub |
| **Newsletter subscribe** | Backend done, composable is a TODO stub |
| **Admin dashboard charts** | Backend response missing 3 fields |
| **Change password (in-session)** | Both sides missing |
| **Coupon apply UI** | Backend done, no UI |
| **Admin coupon management** | Backend done, no admin page |

---

## Phase 1 — Critical Blockers (nothing works without these)

### 1.1 Fix port collision

**Frontend:** set `NUXT_PUBLIC_API_BASE_URL=http://localhost:3001` in `.env`.
**Backend:** set `PORT=3001` in `.env`.

No code change needed — purely config.

---

### 1.2 Fix logout (2 bugs, both in `app/utils/auth.ts` → `useAuth.ts`)

**Bug A — No Bearer token sent:**
`useAuth.ts:62` calls plain `$fetch('/auth/logout')`. The endpoint has `@UseGuards(JwtAuthGuard)` so every call returns 401.

**Bug B — No `refreshToken` in body:**
Even if auth passes, the token is never revoked because `refreshTokenDto.refreshToken` arrives `undefined`.

**Fix in `app/composables/useAuth.ts`:**
```ts
// Before
await $fetch('/auth/logout', { method: 'POST' }).catch(() => {})

// After
const refreshToken = getRefreshToken() // already exported from token.ts
await $fetch('/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${getAccessToken()}` },
    body: { refreshToken },
}).catch(() => {})
```

---

### 1.3 Fix sort parameter name mismatch

**File:** `app/composables/useProducts.ts:27`

Backend `FilterDto` expects `sortBy`, frontend sends `sort`.

```ts
// Before
if (params.sort)  qs.set('sort', params.sort)

// After
if (params.sort)  qs.set('sortBy', params.sort)
```

---

### 1.4 Verify search query parameter name

**File:** `app/composables/useSearch.ts:9` sends `?q=...`

Check `src/modules/search/dtos/search.dto.ts` — if the DTO field is `query` not `q`, change the frontend key.
Backend `SearchDto`:
```ts
// src/modules/search/dtos/search.dto.ts — confirm field name
@IsOptional() @IsString()
query?: string;   // ← if this, frontend must send ?query=
```
Fix whichever side is wrong — prefer keeping the frontend using `q` and renaming the DTO field to `q`.

---

## Phase 2 — Checkout Flow (core e-commerce path)

This is a chain: **Addresses → Checkout page → Place Order**.

### 2.1 Shipping address management (Frontend — new)

Backend already has full CRUD at `/addresses`. The frontend needs:

**New composable: `app/composables/useAddresses.ts`**
```ts
getAddresses()         → GET /addresses
createAddress(dto)     → POST /addresses
updateAddress(id, dto) → PATCH /addresses/:id
setDefault(id)         → PATCH /addresses/:id/default
deleteAddress(id)      → DELETE /addresses/:id
```

**New page or modal: address picker in the account page and checkout**
- Account → Addresses tab: list + add + set-default + delete
- Checkout: dropdown/modal showing saved addresses, "Add new" option

---

### 2.2 Checkout page (Frontend — new)

Create `app/pages/checkout/index.vue` (or wire the existing cart summary).

Steps the page handles:
1. Display cart items + subtotals (already in cart store)
2. **Address picker** — calls `GET /addresses`, user selects one
3. **Coupon code input** — calls `POST /checkout/apply-coupon` → shows discount
4. **Payment method selector** — `cash_on_delivery` | `stripe`
5. **Place Order button** — calls `POST /checkout/create-order`

`CreateOrderDto` (from `src/modules/orders/dtos/create-order.dto.ts`):
```ts
{
  shippingAddressId: string   // required
  paymentMethod: 'stripe' | 'cash_on_delivery'
  couponCode?: string
  notes?: string
}
```

Response for `cash_on_delivery`: `{ order: Order }` — navigate to `/orders/:id`.
Response for `stripe`: includes `clientSecret` — show Stripe Elements payment form.

**Cart page:** add "Proceed to Checkout" button that navigates to `/checkout`.

---

### 2.3 Email-verified guard — UX nudge

`POST /checkout/create-order` returns 403 if email is not verified. The checkout page should:
- After 403, show a toast: "Please verify your email before placing an order. Check your inbox."
- Optionally add a "Resend verification email" button (needs `POST /auth/resend-verification` — check if backend has it; if not, add it).

---

## Phase 3 — Missing UI Features (backend done, frontend TODO)

### 3.1 Returns / Refund request

**File:** `app/pages/orders/index.vue:28-30` — `openReturnDialog` is a TODO stub.

Backend endpoints:
- `POST /returns` — body: `{ orderId, orderItemId, reason }`
- `GET /returns/my` — list user's return requests
- `GET /returns/:id` — single return

**Frontend tasks:**
- Create `app/composables/useReturns.ts` with the 3 customer endpoints
- Replace the TODO stub with a modal: select item from the order, enter reason, submit
- Show return status badge on the orders page alongside the order item

**Admin tasks:**
- Add `/admin/returns` page showing pending returns
- Approve/reject buttons calling `PATCH /returns/:id/process` with `{ status: 'approved' | 'rejected' }`

---

### 3.2 Newsletter subscribe

**File:** `app/composables/useNewsletter.ts:8` — `// TODO: POST to /newsletter/subscribe`

**Fix:**
```ts
// Replace the local stub with:
async function subscribe(email: string, name?: string) {
    await $fetch('/newsletter/subscribe', {
        method: 'POST',
        body: { email, name },
        baseURL: config.public.apiBaseUrl,
    })
    sent.value = true
}
```

---

### 3.3 Apply coupon UI

Backend `POST /checkout/apply-coupon` accepts `{ code }` and returns:
```ts
{ discountValue: number, type: 'percentage' | 'fixed', couponId: string }
```

Wire this into the checkout page (Phase 2.2) — input field + "Apply" button above the order total.

---

## Phase 4 — Admin Gaps

### 4.1 Fix dashboard stats (Backend change)

**File:** `src/modules/admin/services/analytics.service.ts` — `getDashboardStats()` returns only 5 fields. Frontend `app/types/api.ts:384` and `app/composables/admin/useDashboardStats.ts:65-88` expect:

- `ordersByStatus: { status: string, count: number }[]`
- `revenueByMonth: { month: string, revenue: number }[]`
- `topProducts: { id, name, totalSold, revenue }[]`

Add these 3 queries to `getDashboardStats()` in the backend.

---

### 4.2 Fix audit logs pagination (Backend change)

**File:** `src/modules/admin/controllers/analytics.controller.ts:36`

Frontend sends `{ page, limit }` but controller only reads `limit`.

```ts
// Before
@Get('audit-logs')
async getAuditLogs(@Query('limit', new ParseIntPipe({ optional: true })) limit = 50)

// After
@Get('audit-logs')
async getAuditLogs(@Query() dto: PaginationDto)
```

Update the service method signature to accept and use `dto.page`.

---

### 4.3 Coupon management page (Frontend — new)

Backend has full CRUD at `/coupons` (admin only).

Create `app/pages/admin/coupons/index.vue`:
- Table: list all coupons (code, type, value, status, usage)
- Create coupon modal
- Deactivate / delete actions

Add to admin sidebar nav.

---

## Phase 5 — Missing Features on Both Sides

### 5.1 Change password (in-session)

**Frontend stub:** `app/pages/account/index.vue:68-74` — validates but makes no API call.
**Backend gap:** No `POST /auth/change-password` endpoint that accepts `{ currentPassword, newPassword }`.

**Backend — add endpoint:**
```ts
// auth.controller.ts
@Post('change-password')
@UseGuards(JwtAuthGuard)
async changePassword(@GetUser() user, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user.id, dto.currentPassword, dto.newPassword)
}
```

**Frontend — wire it:**
```ts
// account/index.vue changePassword()
await $fetch('/auth/change-password', {
    method: 'POST',
    headers: authH(),
    body: { currentPassword: form.currentPassword, newPassword: form.newPassword },
    baseURL: config.public.apiBaseUrl,
})
```

---

### 5.2 Order detail page (Frontend — new)

`getOrder(id)` exists in `useOrders.ts` but there is no `/orders/[id].vue` page.

Create `app/pages/orders/[id].vue`:
- Order header: number, date, status badge
- Line items: product image, name, variant, qty, price
- Totals: subtotal, discount, tax, shipping, total
- Shipping address
- Payment method
- Returns: list any existing return requests + "Request Return" button per item

---

### 5.3 Real-time notification bell (Frontend — new)

`useNotifications.ts` wires all REST endpoints but there is no notification bell in the app layout.

Add to `app/layouts/default.vue`:
- Bell icon with unread count badge
- Dropdown showing last 5 notifications with "Mark all read" / "See all" links

Socket.io connection (backend already has `NotificationsGateway`):
```ts
// app/plugins/socket.client.ts (create this)
import { io } from 'socket.io-client'
const socket = io(config.public.apiBaseUrl, {
    auth: { token: getAccessToken() }
})
socket.on('notification', (data) => notificationsStore.prepend(data))
```

---

## Execution Order

```
Phase 1 (1 day)
  1.1  Port config (5 min)
  1.2  Fix logout (30 min)
  1.3  Fix sort param (5 min)
  1.4  Verify search param (15 min)

Phase 2 (3–4 days)
  2.1  useAddresses composable + address page/modal
  2.2  /checkout page (address picker + coupon + payment + place order)
  2.3  Email-verified UX nudge

Phase 3 (2 days)
  3.1  Returns modal + /admin/returns page
  3.2  Newsletter subscribe wired
  3.3  Coupon apply in checkout (done as part of 2.2)

Phase 4 (1 day)
  4.1  Backend: dashboard stats + 3 new queries
  4.2  Backend: audit logs pagination fix
  4.3  Frontend: admin coupons page

Phase 5 (2 days)
  5.1  Change password — backend endpoint + frontend wire
  5.2  /orders/[id] detail page
  5.3  Notification bell + socket.io plugin
```

**Total estimated effort: ~8–10 developer-days.**

---

## File Map (quick reference)

| File | Side | What it does |
|------|------|-------------|
| `app/composables/useAuth.ts` | FE | Auth actions — fix logout here |
| `app/composables/useProducts.ts:27` | FE | Fix `sort` → `sortBy` |
| `app/composables/useNewsletter.ts:8` | FE | Wire subscribe call |
| `app/composables/useAddresses.ts` | FE | **Create new** |
| `app/pages/checkout/index.vue` | FE | **Create new** |
| `app/pages/orders/[id].vue` | FE | **Create new** |
| `app/pages/admin/returns/index.vue` | FE | **Create new** |
| `app/pages/admin/coupons/index.vue` | FE | **Create new** |
| `app/plugins/socket.client.ts` | FE | **Create new** |
| `app/pages/account/index.vue:68-74` | FE | Wire password change |
| `src/modules/admin/services/analytics.service.ts` | BE | Add 3 dashboard queries |
| `src/modules/admin/controllers/analytics.controller.ts:36` | BE | Fix audit logs pagination |
| `src/modules/auth/controllers/auth.controller.ts` | BE | Add `POST /auth/change-password` |

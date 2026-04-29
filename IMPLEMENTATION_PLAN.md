# Implementation Plan: Points System, Currency CRUD, Shipping Config, Invoice Email

## Feature 1: Point System (Reward / Loyalty)

**Goal:** Users earn points automatically when an order is paid or accepted. Points can be redeemed as a discount, a free order, or free shipping. Points have an expiration date.

**New Module:** `src/modules/points/`

### Entities

- **PointRule** — admin-configurable earning rule (`pointsPerCurrencySpent`, `fixedPointsPerOrder`, `isActive`).
- **PointTransaction** — ledger of earned/redeemed points per user (`userId`, `orderId`, `type: earn | redeem`, `amount`, `balanceAfter`, `expiresAt`, `reason`).
- **PointRedemption** — redemption config for discounts (`type: discount | free_order | free_shipping`, `pointsRequired`, `value`).

### Files to Create

1. `src/modules/points/entities/point-rule.entity.ts`
2. `src/modules/points/entities/point-transaction.entity.ts`
3. `src/modules/points/entities/point-redemption.entity.ts`
4. `src/modules/points/entities/index.ts`
5. `src/modules/points/repositories/point-rule.repository.ts`
6. `src/modules/points/repositories/point-transaction.repository.ts`
7. `src/modules/points/repositories/point-redemption.repository.ts`
8. `src/modules/points/dtos/create-point-rule.dto.ts`
9. `src/modules/points/dtos/update-point-rule.dto.ts`
10. `src/modules/points/dtos/create-redemption.dto.ts`
11. `src/modules/points/dtos/update-redemption.dto.ts`
12. `src/modules/points/dtos/redeem-points.dto.ts`
13. `src/modules/points/services/points.service.ts`
14. `src/modules/points/services/points-admin.service.ts`
15. `src/modules/points/controllers/points.controller.ts`
16. `src/modules/points/controllers/points-admin.controller.ts`
17. `src/modules/points/points.module.ts`

### Files to Modify

- `src/modules/orders/services/checkout.service.ts` — after order creation & successful payment, call `PointsService.earnPoints()`.
- `src/modules/orders/services/orders.service.ts` — in `updateStatus()`, when status transitions to `DELIVERED` or `PAID`, trigger point earning if not already earned.
- `src/modules/auth/entities/user.entity.ts` — add `totalPoints: number` column (or keep it computed from transactions; computed is safer).
- `src/app.module.ts` — register `PointsModule`.

### Logic Flow

1. On `payment_intent.succeeded` webhook OR on admin status update to `delivered`/`paid`:
   - Fetch active `PointRule`.
   - Calculate points: `order.totalAmount * pointsPerCurrencySpent` (rounded down) + `fixedPointsPerOrder`.
   - Create `PointTransaction` (type=`earn`, `expiresAt = now + rule.expiryDays`).
   - Update user's cached balance in Redis (optional) or compute on read.

2. On checkout (`createOrder`):
   - Accept optional `redeemPoints` field in `CreateOrderDto`.
   - Validate user has enough non-expired points.
   - Deduct points, create `PointTransaction` (type=`redeem`).
   - Apply benefit based on `PointRedemption` config:
     - `discount`: subtract `value` from `totalAmount`.
     - `free_shipping`: set `shippingAmount = 0`.
     - `free_order`: set `totalAmount = 0` (rare, needs guard for max order value).

---

## Feature 2: Currency CRUD (with Manual Exchange Rates)

**Goal:** Admin can manage currencies. At checkout, totals are converted to the selected currency using manual exchange rates.

**New Module:** `src/modules/currencies/`

### Entity

- **Currency** — `code` (PK, e.g., USD), `name`, `symbol`, `exchangeRate` (relative to base currency, default USD = 1.0), `isActive`, `isDefault`.

### Files to Create

1. `src/modules/currencies/entities/currency.entity.ts`
2. `src/modules/currencies/repositories/currency.repository.ts`
3. `src/modules/currencies/dtos/create-currency.dto.ts`
4. `src/modules/currencies/dtos/update-currency.dto.ts`
5. `src/modules/currencies/services/currencies.service.ts`
6. `src/modules/currencies/controllers/currencies.controller.ts`
7. `src/modules/currencies/currencies.module.ts`

### Files to Modify

- `src/modules/orders/entities/order.entity.ts` — `currency` column already exists (string), keep as-is but ensure it references `Currency.code`.
- `src/modules/orders/services/checkout.service.ts` — after calculating totals in USD, if `dto.currencyCode` is provided and different from USD, convert using `exchangeRate`. Store both `subtotal`/`totalAmount` in base USD (for reporting) and add `displayCurrency`, `displayTotal` if needed. **Simpler approach:** store everything in USD in DB, convert at API response time using `CurrenciesService`. We will keep DB in USD and convert on-the-fly for the client.
- `src/app.module.ts` — register `CurrenciesModule`.
- `src/modules/orders/dtos/create-order.dto.ts` — add optional `currencyCode?: string`.

---

## Feature 3: Shipping Fee Configuration (by Country/Region + Weight)

**Goal:** Admin can configure shipping rates based on destination country/region and order weight.

**New Module:** `src/modules/shipping-config/`

### Entities

- **ShippingZone** — `name`, `countries` (jsonb array of ISO codes), `isActive`.
- **ShippingRate** — `shippingZoneId`, `minWeight`, `maxWeight`, `baseCost`, `perKgCost`, `freeShippingThreshold`.

### Files to Create

1. `src/modules/shipping-config/entities/shipping-zone.entity.ts`
2. `src/modules/shipping-config/entities/shipping-rate.entity.ts`
3. `src/modules/shipping-config/entities/index.ts`
4. `src/modules/shipping-config/repositories/shipping-zone.repository.ts`
5. `src/modules/shipping-config/repositories/shipping-rate.repository.ts`
6. `src/modules/shipping-config/dtos/create-shipping-zone.dto.ts`
7. `src/modules/shipping-config/dtos/update-shipping-zone.dto.ts`
8. `src/modules/shipping-config/dtos/create-shipping-rate.dto.ts`
9. `src/modules/shipping-config/dtos/update-shipping-rate.dto.ts`
10. `src/modules/shipping-config/services/shipping-config.service.ts`
11. `src/modules/shipping-config/controllers/shipping-config.controller.ts`
12. `src/modules/shipping-config/shipping-config.module.ts`

### Files to Modify

- `src/modules/orders/services/shipping.service.ts` — replace the hardcoded logic with a call to `ShippingConfigService.calculateShipping(addressId, orderWeight, orderValue)`.
  - Look up `Address.country` → find matching `ShippingZone`.
  - Find `ShippingRate` where `orderWeight` is between `minWeight` and `maxWeight`.
  - Calculate: `baseCost + (perKgCost * orderWeight)`.
  - If `orderValue >= freeShippingThreshold`, return 0.
- `src/modules/orders/orders.module.ts` — import `ShippingConfigModule`.
- `src/app.module.ts` — register `ShippingConfigModule`.

---

## Feature 4: Invoice Email with PDF Attachment

**Goal:** After an order is created, send an email to the client with a PDF invoice attached.

### Files to Create

1. `src/modules/orders/services/invoice.service.ts` — generates PDF using `pdfmake` or `puppeteer`.
2. `templates/emails/invoice.hbs` — HTML template for the invoice email body.
3. `src/modules/orders/jobs/send-invoice.job.ts` — BullMQ processor for async invoice sending.

### Files to Modify

- `src/modules/orders/services/checkout.service.ts` — after order creation, queue an `send-invoice` job via `BullmqService.addOrderProcessingJob()`.
- `src/modules/orders/orders.module.ts` — add `InvoiceService` and `SendInvoiceProcessor` to providers.
- `src/infrastructure/email/mailer.service.ts` — add `sendInvoiceEmail(to, data, pdfBuffer)` method.
- `src/modules/orders/dtos/create-order.dto.ts` — no change needed, email is sent automatically.

### PDF Content (Invoice)

- Store logo, order number, date, billing/shipping address, itemized list (product, qty, unit price, total), subtotal, discount, shipping, tax, total amount, currency.

**Tech choice for PDF:** `pdfmake` is lightweight and good for tabular invoices. We can install it in a local `node_modules`.

---

## Database Migrations

As per `AGENTS.md`, `synchronize: false`. We must generate and run migrations.

**Steps:**

1. After all entities are created, run:
   ```bash
   npm run migration:generate -- src/infrastructure/database/migrations/AddPointsCurrenciesShippingConfig
   ```
2. Then run:
   ```bash
   npm run migration:run
   ```

---

## Updated `CreateOrderDto` Shape

```typescript
export class CreateOrderDto {
  shippingAddressId: string;
  couponCode?: string;
  paymentMethod: PaymentMethod;
  paymentToken?: string;
  currencyCode?: string;        // NEW
  redeemPoints?: number;        // NEW
  redemptionType?: 'discount' | 'free_shipping' | 'free_order'; // NEW
}
```

---

## Module Registration in `AppModule`

Add to `imports` array:

```typescript
import { PointsModule } from './modules/points/points.module';
import { CurrenciesModule } from './modules/currencies/currencies.module';
import { ShippingConfigModule } from './modules/shipping-config/shipping-config.module';

// inside @Module({ imports: [ ..., PointsModule, CurrenciesModule, ShippingConfigModule ] })
```

---

## Verification Steps

1. **Lint:** `npx eslint "src/**/*.ts" --max-warnings 0`
2. **Tests:** `npm run test`
3. **Build:** `npm run build`
4. **API Test (manual):**
   - `POST /currencies` (admin) — create EGP with rate 30.9.
   - `POST /shipping-zones` + `POST /shipping-rates` — create Egypt zone with weight-based rate.
   - `POST /point-rules` — set 1 point per 1 USD, 30-day expiry.
   - `POST /point-redemptions` — 100 points = $5 discount.
   - `POST /checkout/create-order` with `currencyCode: 'EGP'`, `redeemPoints: 100` — verify converted total and discount applied.
   - Check email inbox for PDF invoice.

---

## Order of Implementation

To minimize conflicts and allow testing at each stage:

1. **Currencies Module** (standalone, no dependencies on others).
2. **Shipping Config Module** (standalone, replaces hardcoded shipping logic).
3. **Points Module** (depends on orders, but we can build it and wire into checkout/orders after).
4. **Invoice Email** (depends on orders, added last).
5. **Wire everything into Checkout & Order services.**
6. **Generate migrations.**
7. **Run lint → test → build.**

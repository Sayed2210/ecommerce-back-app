# Checkout Cycle Fix Plan

## Priority 1: Critical Issues

| # | Issue | Fix |
|---|-------|-----|
| 1 | Missing `orderNumber` on Order | Add order number generation (UUID or sequential) in `createOrder()` before save |
| 2 | Payment info mapping mismatch | Change `paymentInfo: { method: dto.paymentMethod }` → `paymentMethod: dto.paymentMethod` |
| 3 | Coupon usage not incremented | Update `usageCount` on coupon after successful order |

## Priority 2: Data Integrity

| # | Issue | Fix |
|---|-------|-----|
| 4 | Race condition on inventory | Add pessimistic locking (`WITH LOCK`) on variant check, or re-validate after reservation |
| 5 | Cart not deleted | Either delete cart after checkout or ensure it's properly cleared for reuse |
| 6 | Missing currency | Explicitly set `currency: 'USD'` (or from config) when creating order |

## Priority 3: Webhook & Idempotency

| # | Issue | Fix |
|---|-------|-----|
| 7 | No webhook idempotency | Track processed webhook events (store `eventId` in DB) to prevent duplicate processing |
| 8 | Order ID in metadata | Ensure `orderId` is always set in payment intent metadata |

## Priority 4: Minor Fixes

| # | Issue | Fix |
|---|-------|-----|
| 9 | `applyCoupon` missing user param | Add `userId` parameter to controller method |
| 10 | Unused `_orderData` param | Remove underscore prefix or implement actual validation |

---

**Estimated files to modify:**
- `checkout.service.ts` (main fixes)
- `payment.service.ts` (idempotency)
- `checkout.controller.ts` (applyCoupon fix)
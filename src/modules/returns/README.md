# Returns Module

Handles return requests and Stripe refunds for delivered orders.

## Responsibilities

- Customers submit return requests within 30 days of delivery
- Admin approves or rejects requests
- On approval: issues a Stripe refund and updates order status to `REFUNDED`
- One return request per order item enforced

## Endpoints

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/returns` | JWT + Verified | — | Submit a return request |
| GET | `/returns/my` | JWT + Verified | — | List own return requests |
| GET | `/returns` | JWT + Verified | ADMIN | List all return requests |
| GET | `/returns/:id` | JWT + Verified | — | Get request details (ownership checked) |
| PATCH | `/returns/:id/process` | JWT + Verified | ADMIN | Approve or reject return |

> All endpoints require `EmailVerifiedGuard` in addition to JWT.

## Entity: `ReturnRequest`

| Field | Type | Notes |
|-------|------|-------|
| status | enum | PENDING → APPROVED / REJECTED / REFUNDED |
| reason | enum | DEFECTIVE \| WRONG_ITEM \| NOT_AS_DESCRIBED \| CHANGED_MIND |
| notes | text | optional customer note |
| refundAmount | decimal(12,2) | `unitPrice × quantity` at time of submission |
| refundId | string | Stripe refund ID, set on REFUNDED |
| userId | UUID | FK → User |
| orderId | UUID | FK → Order |
| orderItemId | UUID | FK → OrderItem |

## DTOs

### `CreateReturnDto`
```typescript
{
  orderId: string       // UUID
  orderItemId: string   // UUID
  reason: ReturnReason  // enum
  notes?: string
}
```

### `ProcessReturnDto`
```typescript
{
  status: 'approved' | 'rejected'
}
```

## Business Rules

- Order must be in `DELIVERED` status
- Submission must be within **30 days** of delivery (`Order.updatedAt`)
- Only one return per `(orderId, orderItemId)` pair
- On `APPROVED`: if `order.paymentIntentId` exists, Stripe refund is created immediately and status becomes `REFUNDED`; otherwise status remains `APPROVED` for manual processing

## Refund Flow

```
PATCH /returns/:id/process { status: 'approved' }
  → load Order.paymentIntentId
  → stripe.refunds.create({ payment_intent, amount: refundAmount * 100 })
  → ReturnRequest.refundId = refund.id
  → ReturnRequest.status = REFUNDED
  → Order.status = REFUNDED, Order.paymentStatus = REFUNDED
```

# Notifications Module

Real-time notifications via Socket.io WebSocket, backed by a persistent database store.

## Responsibilities

- Create and persist notifications for users
- Real-time delivery via WebSocket (`newNotification` event)
- Mark notifications as read (single or all)
- Relay real-time cart updates via the same WebSocket infrastructure

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/notifications` | JWT | Get own notifications (paginated) |
| POST | `/notifications` | JWT | Create notification |
| PATCH | `/notifications/:id/read` | JWT | Mark one as read |
| PATCH | `/notifications/read-all` | JWT | Mark all as read |
| DELETE | `/notifications/:id` | JWT | Delete notification |

## Entities

### `Notification`
| Field | Type | Notes |
|-------|------|-------|
| type | enum | ORDER_UPDATE \| PROMOTION \| SYSTEM \| PAYMENT \| SHIPPING |
| title | string | |
| message | string | optional |
| readAt | Date | null = unread |
| actionUrl | string | optional deep-link |
| data | jsonb | extra context (e.g., orderId) |
| userId | UUID | FK → User |

## Services

### `NotificationService`
- `create(dto)` — persists notification, emits `newNotification` via gateway
- `findAll(userId, pagination)` — paginated list, unread first
- `markAsRead(id)` — sets `readAt = now()`
- `markAllAsRead(userId)` — bulk update
- `remove(id)` — hard delete

## WebSocket Gateway (`NotificationsGateway`)

**Connection:**
- Authenticates client using JWT from `handshake.auth.token`
- On connect: joins room `user:{userId}`
- On disconnect: leaves room

**Server-emitted events:**

| Event | Trigger | Payload |
|-------|---------|---------|
| `newNotification` | `NotificationService.create()` | Notification object |
| `cart_updated` | `CartService` write operations | Full cart with totals |

**Horizontal scaling:** Uses `@socket.io/redis-adapter` so events broadcast correctly across multiple server instances.

## Exports

`NotificationService`, `NotificationsGateway`

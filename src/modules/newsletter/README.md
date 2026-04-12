# Newsletter Module

Subscriber management and campaign delivery for email newsletters.

## Responsibilities

- Public subscribe / unsubscribe endpoints (no auth required)
- Token-based unsubscribe (safe for email links)
- Admin campaign sending — queues one email per active subscriber via BullMQ
- Re-subscribe support for previously unsubscribed emails

## Endpoints

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/newsletter/subscribe` | ❌ | — | Subscribe email |
| POST | `/newsletter/unsubscribe` | ❌ | — | Unsubscribe via token |
| GET | `/newsletter/stats` | JWT | ADMIN | Get active subscriber count |
| POST | `/newsletter/send` | JWT | ADMIN | Queue campaign to all active subscribers |

## Entity: `NewsletterSubscriber`

| Field | Type | Notes |
|-------|------|-------|
| email | string | unique |
| name | string | optional |
| isActive | boolean | false after unsubscribe |
| unsubscribeToken | UUID | unique per subscriber, used in unsubscribe link |

## DTOs

### `SubscribeDto`
```typescript
{
  email: string    // valid email, required
  name?: string
}
```

### `SendCampaignDto`
```typescript
{
  subject: string   // email subject line
  content: string   // HTML body content
}
```

## Services

### `NewsletterService`
- `subscribe(dto)` — creates subscriber or re-activates; sends welcome email
- `unsubscribe(token)` — finds by `unsubscribeToken`, sets `isActive = false`
- `sendCampaign(dto)` — fetches all active subscribers, queues `send-newsletter` BullMQ jobs in bulk
- `getSubscriberCount()` — count of `isActive = true` subscribers

## Unsubscribe Link Pattern

Include this in email templates:
```
{{appUrl}}/newsletter/unsubscribe?token={{unsubscribeToken}}
```

The frontend calls `POST /newsletter/unsubscribe` with the token.

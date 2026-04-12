# Email (Nodemailer + Handlebars)

Transactional email service using Nodemailer with Handlebars templates, backed by BullMQ for async delivery.

## Configuration

| Env Variable | Description |
|-------------|-------------|
| `SMTP_HOST` | SMTP server (e.g., `smtp.gmail.com`) |
| `SMTP_PORT` | Port (e.g., `587`) |
| `SMTP_SECURE` | `'true'` for SSL (port 465), otherwise STARTTLS |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password / app password |
| `MAIL_FROM` | From address (e.g., `noreply@store.com`) |
| `APP_NAME` | Injected into all templates |
| `SUPPORT_EMAIL` | Injected into all templates |
| `APP_LOGO_URL` | Injected into all templates |

In production (`NODE_ENV=production`): TLS certificate validation is enforced (`rejectUnauthorized: true`).

## Transport Settings

```
pool: true, maxConnections: 5, maxMessages: 100, rateLimit: 10/sec
```

## Templates

Templates are Handlebars (`.hbs`) files located at `{project_root}/templates/emails/`.

Every template automatically receives: `appName`, `supportEmail`, `year`, `logoUrl`.

| Template File | Used By |
|--------------|---------|
| `welcome.hbs` | `sendWelcomeEmail` |
| `order-confirmation.hbs` | `sendOrderConfirmation` |
| `password-reset.hbs` | `sendPasswordReset` |
| `verification.hbs` | `sendVerificationEmail` |
| `order-shipped.hbs` | `sendOrderShipped` |
| `abandoned-cart.hbs` | `sendAbandonedCartReminder` |
| `abandoned-cart-followup.hbs` | `sendAbandonedCartFollowUp` |
| `newsletter.hbs` | `sendNewsletter` |

## `MailerService` API

### Sending

```typescript
// Synchronous (immediate) — use for critical transactional emails
await mailerService.sendEmail({ to, subject, template, data });

// Async (queued via BullMQ) — use for everything else
await mailerService.sendEmailAsync({ to, subject, template, data });
```

### Pre-defined Methods (all queued)

```typescript
sendWelcomeEmail(to, { name })
sendOrderConfirmation(to, { orderNumber, total, items, shippingAddress })
sendPasswordReset(to, { name, resetUrl, expiresIn })
sendVerificationEmail(to, { name, url })
sendOrderShipped(to, { orderNumber, trackingNumber, carrier })
sendAbandonedCartReminder(to, { name, cartItems, cartTotal, recoveryUrl })
sendAbandonedCartFollowUp(to, { userName, cartItems, cartTotal, discountCode, recoveryLink })
sendNewsletter(to, { subject, content })
```

### Utilities

```typescript
await mailerService.verifyConnection()  // Test SMTP connectivity
await mailerService.getStats()          // messagesSent, isConnected
```

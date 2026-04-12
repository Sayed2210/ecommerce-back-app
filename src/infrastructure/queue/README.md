# Queue (BullMQ)

Async job queues backed by Redis via BullMQ. Global module — available everywhere without explicit import.

## Configuration

Uses the same Redis connection as the cache (`REDIS_HOST`, `REDIS_PORT`).

## Default Job Options

```typescript
{
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: { count: 1000 },
  removeOnFail:     { count: 5000 },
}
```

## Pre-defined Queues

| Queue Name | Concurrency | Priority | Use Case |
|-----------|-------------|----------|----------|
| `emails` | 2 | normal | Transactional emails |
| `image-processing` | 1 | normal | Resize/optimize uploads |
| `order-processing` | 3 | 1 (high) | Post-order tasks |
| `notifications` | 5 | normal | Push notifications |
| `analytics` | 2 | 5 (low) | Event tracking, delayed 5s |

## `BullmqService` API

### Adding Jobs

```typescript
// Generic
bullmqService.addJob('my-queue', 'job-name', data, options?);

// Pre-defined shortcuts
bullmqService.addEmailJob('send-email', emailData, options?);
bullmqService.addOrderProcessingJob('post-checkout', orderData);
bullmqService.addNotificationJob('push', notifData);
bullmqService.addImageProcessingJob('resize', imageData);
bullmqService.addAnalyticsJob('track-search', searchData);
```

### Creating Workers

```typescript
bullmqService.createEmailWorker(async (job) => {
  await mailerService.sendEmail(job.data);
});

// Generic
bullmqService.createWorker('my-queue', processor, concurrency?);
```

### Queue Management

```typescript
bullmqService.getJobCounts('emails');       // { waiting, active, completed, failed }
bullmqService.pauseQueue('emails');
bullmqService.resumeQueue('emails');
bullmqService.cleanQueue('emails', 0);      // remove completed/failed
bullmqService.getMetrics();                 // metrics across all queues
```

## Active Jobs

| Job | Queue | Trigger |
|-----|-------|---------|
| `send-email` | `emails` | Every email send via `MailerService.sendEmailAsync()` |
| `abandoned-cart` | `order-processing` | Cron via `AbandonedCartJob` |
| `post-checkout` | `order-processing` | After `CheckoutService.createOrder()` |

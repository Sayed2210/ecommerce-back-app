# Common Correct Patterns

Quick reference of idiomatic patterns for this codebase. Use during review to
distinguish "this is the project's style" from "this is genuinely wrong".

---

## AbstractRepository Usage

```ts
// findOne — returns null if missing
const user = await this.userRepo.findOne({ email } as any);

// findOneOrFail — throws EntityNotFoundError (not NotFoundException) if missing
// Use this only in internal operations where you trust the ID exists
const user = await this.userRepo.findOneOrFail({ id } as any);

// findWithPagination — use for all list endpoints
const result = await this.productRepo.findWithPagination(page, limit, where);
// returns: { data: T[], total: number, page: number, limit: number }

// createQueryBuilder — for joins and complex WHERE
const items = await this.repo.createQueryBuilder('product')
  .leftJoinAndSelect('product.category', 'category')
  .where('product.isActive = :active', { active: true })
  .andWhere('product.deletedAt IS NULL')
  .orderBy('product.createdAt', 'DESC')
  .getMany();
```

---

## TranslatableString Pattern

```ts
// Entity definition
@Column({ type: 'jsonb' })
name: TranslatableString;   // stored as { "en": "...", "ar": "..." }

// DTO
@ValidateNested()
@Type(() => TranslatableString)
name: TranslatableString;

// LanguageInterceptor auto-detects objects with string 'en' key
// Client sends: ?lang=ar → response name becomes just "الاسم" (string)
// Client sends: ?lang=en or no lang → response name becomes just "Name" (string)
// No lang header → object returned as-is

// Migration pattern (see migration-1765641477430)
ALTER TABLE "products"
  ALTER COLUMN "name" TYPE jsonb
  USING jsonb_build_object('en', "name");
```

---

## RedisService Patterns

```ts
// Cache-aside (most common pattern)
async getProduct(id: string) {
  return this.redisService.cache(
    `product:${id}`,
    () => this.productRepo.findOne({ id }),
    300,  // 5 minutes TTL
  );
}

// Invalidate on mutation
async updateProduct(id: string, dto: UpdateProductDto) {
  const result = await this.productRepo.update(id, dto);
  await this.redisService.delete(`product:${id}`);
  await this.redisService.deletePattern(`products:list:*`);
  return result;
}

// Distributed lock (for critical sections)
async processOrder(orderId: string) {
  const lockValue = await this.redisService.acquireLock(`order:${orderId}`, 30);
  if (!lockValue) throw new ConflictException('Order is being processed');
  try {
    // ... do work
  } finally {
    await this.redisService.releaseLock(`order:${orderId}`, lockValue);
  }
}
```

---

## BullMQ Job Patterns

```ts
// Adding a job — pick the right queue based on priority/type
await this.bullmqService.addEmailJob('welcome-email', { to, name });
await this.bullmqService.addOrderProcessingJob('process-payment', { orderId });
await this.bullmqService.addAnalyticsJob('track-view', { productId, userId });

// Jobs are fire-and-forget — don't await their completion in the request
async createOrder(dto: CreateOrderDto) {
  const order = await this.orderRepo.create(dto);
  // Non-blocking: queue the confirmation email
  await this.bullmqService.addEmailJob('order-confirmation', {
    to: dto.email,
    orderNumber: order.id,
  });
  return order;  // return immediately, email sent async
}
```

---

## Error Handling Patterns

```ts
// NotFoundException — resource doesn't exist
throw new NotFoundException(`Product #${id} not found`);

// ConflictException — uniqueness violation
throw new ConflictException(`Email '${dto.email}' already exists`);

// BadRequestException — invalid input that passed DTO validation
throw new BadRequestException('Cannot delete a role with active users');

// UnauthorizedException — auth failure (used in auth.service.ts)
throw new UnauthorizedException('Invalid credentials');

// ForbiddenException — authenticated but not authorized
throw new ForbiddenException('Admin access required');

// Internal errors — let them bubble up as 500 (don't catch and swallow)
// Only catch when you can meaningfully recover:
try {
  await this.mailerService.sendEmail(opts);
} catch (error) {
  this.logger.error('Email failed, continuing anyway', error.stack);
  // Don't re-throw — email failure shouldn't fail the order creation
}
```

---

## Module Registration Patterns

```ts
// Standard module
@Module({
  imports: [TypeOrmModule.forFeature([Entity1, Entity2])],
  controllers: [MyController],
  providers: [MyService, MyRepository],
  exports: [MyService],
})

// Module that needs auth (import AuthModule for JwtAuthGuard to work)
@Module({
  imports: [
    TypeOrmModule.forFeature([MyEntity]),
    AuthModule,              // gives access to JwtModule, PassportModule
  ],
  ...
})

// Global infrastructure modules (already global — do NOT re-import)
// CacheModule (RedisService) — @Global()
// QueueModule (BullmqService) — @Global()
// These are available everywhere without importing
```

---

## Slug Generation

```ts
// In service create():
async create(dto: CreateProductDto) {
  const slug = dto.slug
    ?? await SlugUtil.generateUniqueSlug(dto.name.en, this.productRepo['productRepo']);
  return this.productRepo.create({ ...dto, slug });
}
```

---

## Audit Logging (Admin module pattern)

```ts
// In admin services, log all mutations:
await this.auditLogRepo.create({
  userId: currentUser.id,           // from @Request() req → req.user.id
  action: 'UPDATE_PRODUCT',
  entityType: 'Product',
  entityId: id,
  metadata: { changes: dto },
});
```
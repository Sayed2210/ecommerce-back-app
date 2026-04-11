# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run start:dev       # Watch mode (recommended for development)
npm run start:debug     # Debug + watch mode

# Build & Production
npm run build           # Compile TypeScript
npm run start:prod      # Run compiled output

# Testing
npm run test            # Run all unit tests
npm run test:watch      # Watch mode
npm run test:cov        # With coverage
npm run test:e2e        # End-to-end tests

# Database Migrations
npm run migration:generate   # Generate migration from entity changes
npm run migration:run        # Apply pending migrations
```

To run a single test file:
```bash
npx jest src/modules/auth/tests/auth.service.spec.ts
```

## Environment Variables

The app reads from `.env`. The database config uses `DATABASE_HOST/PORT/USERNAME/PASSWORD/NAME` (not `DB_*` as shown in README). Sync is auto-enabled when `NODE_ENV !== 'production'`.

## Architecture

### Path Aliases
TypeScript aliases are configured in `tsconfig.json`:
- `@/*` → `src/*`
- `@common/*` → `src/common/*`
- `@modules/*` → `src/modules/*`
- `@infrastructure/*` → `src/infrastructure/*`
- `@config/*` → `src/config/*`

### Layers

**`src/modules/`** — Feature modules, each self-contained with:
- `entities/` — TypeORM entities
- `repositories/` — Data access extending `AbstractRepository<T>`
- `services/` — Business logic
- `controllers/` — HTTP handlers
- `dtos/` — Input validation with class-validator
- `tests/` — Unit specs (`.spec.ts`)

**`src/infrastructure/`** — Cross-cutting infrastructure:
- `cache/` — `RedisService` (ioredis) with get/set/cache/pub-sub/distributed locks
- `queue/` — BullMQ job queues
- `email/` — `MailerService` via `@nestjs-modules/mailer`
- `database/migrations/` — TypeORM migrations

**`src/common/`** — Shared utilities:
- `entities/base.entity.ts` — Base entity with UUID `id`, `createdAt`, `updatedAt`
- `database/abstract.repository.ts` — Generic CRUD base class; all repositories extend this
- `guards/` — JWT and roles guards (global)
- `interceptors/` — Transform (response wrapper), logging, cache
- `filters/` — HTTP and WebSocket exception filters
- `decorators/` — `@Public()` (skip auth), `@Roles()`
- `pipes/` — Validation and file validation

### Key Design Decisions

**Multi-language content**: Product `name`, `description`, `seoTitle`, etc. are stored as `jsonb` columns with shape `{ "en": "...", "ar": "..." }`.

**Repository pattern**: All repositories extend `AbstractRepository<T>` from `src/common/database/abstract.repository.ts`, which provides `findOne`, `findWithPagination`, `create`, `update`, `softDelete`, `restore`, etc.

**Authentication**: JWT access + refresh token strategy. `@Public()` decorator opts a route out of the global `JwtGuard`. Roles are `customer | staff | admin`.

**Notifications**: Real-time via Socket.io (`NotificationsGateway`) backed by `@socket.io/redis-adapter` for horizontal scaling.

**Search**: Elasticsearch (`@elastic/elasticsearch`) with a `SearchService` and `RecommendationsService`.

**Payments**: Stripe integration in `orders/services/payment.service.ts`.

**Background jobs**: BullMQ (e.g., `cart/jobs/abandoned-cart.job.ts`).

### Module Dependencies
`AuthModule` exports `AuthService`, `TokenService`, `JwtModule`, and `PassportModule` — other modules that need auth import `AuthModule`. `UsersModule` is imported by `AuthModule`.

### API Documentation
Swagger UI is available at `http://localhost:3000/api/docs` when the server is running.

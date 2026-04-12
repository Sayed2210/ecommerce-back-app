# E-Commerce Backend — QWEN Context

## Project Overview

A robust, scalable e-commerce backend built with **NestJS**, **TypeORM**, and **PostgreSQL**. Supports multi-language content (JSONB), user authentication (JWT access + refresh tokens), product management, shopping cart, order processing, real-time notifications (Socket.io + Redis), full-text search (Elasticsearch), Stripe payments, and background job processing (BullMQ).

### Tech Stack

| Category        | Technology                          |
|-----------------|-------------------------------------|
| Framework       | NestJS 10 (Node.js, TypeScript)     |
| Database        | PostgreSQL + TypeORM 0.3            |
| Caching         | Redis (ioredis)                     |
| Queue/Jobs      | BullMQ                              |
| Auth            | JWT + Passport (access + refresh)   |
| Search          | Elasticsearch 8                     |
| Payments        | Stripe                              |
| Email           | Nodemailer (@nestjs-modules/mailer) |
| Real-time       | Socket.io + Redis adapter           |
| API Docs        | Swagger (OpenAPI)                   |
| Validation      | class-validator + class-transformer |
| Object Storage  | AWS S3                              |
| Containerization| Docker (multi-stage, non-root user) |

---

## Building and Running

### Prerequisites

- Node.js v20+
- PostgreSQL
- Redis
- (Optional) Elasticsearch, Stripe account

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Create .env (copy from .env.example and configure)
cp .env.example .env

# 3. Run database migrations
npm run migration:run

# 4. (Optional) Seed admin user
npm run seed:admin
```

### Key Commands

```bash
# Development
npm run start:dev        # Watch mode
npm run start:debug      # Debug + watch

# Build & Production
npm run build            # Compile TypeScript
npm run start            # Start (development)
npm run start:prod       # Run compiled dist/main.js

# Testing
npm run test             # All unit tests
npm run test:watch       # Watch mode
npm run test:cov         # With coverage
npm run test:e2e         # End-to-end tests
npx jest src/modules/<module>/tests/*.spec.ts  # Single test file

# Database
npm run migration:generate  # Generate from entity changes
npm run migration:run       # Apply migrations

# Lint
npx eslint 'src/**/*.ts'
```

### Environment Variables

Reads from `.env`. Key variables (note: DB vars use `DATABASE_*`, not `DB_*`):

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=ecommerce_db

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

REDIS_HOST=localhost
REDIS_PORT=6379

PORT=3000
FRONTEND_URL=http://localhost:8080

NODE_ENV=development   # auto-enables TypeORM sync when !== 'production'
```

### API Documentation

Swagger UI available at **`http://localhost:3000/api/docs`** when the server is running.

---

## Architecture

### Path Aliases

| Alias              | Maps To             |
|--------------------|---------------------|
| `@/*`              | `src/*`             |
| `@common/*`        | `src/common/*`      |
| `@modules/*`       | `src/modules/*`     |
| `@infrastructure/*`| `src/infrastructure/*` |
| `@config/*`        | `src/config/*`      |

### Directory Structure

```
src/
├── modules/              # Feature modules (self-contained)
│   ├── auth/             # JWT auth, login, register, password reset
│   ├── users/            # User CRUD, profiles, wishlists
│   ├── products/         # Product CRUD, variants, multi-language fields
│   ├── cart/             # Shopping cart + abandoned-cart jobs
│   ├── orders/           # Order management + payment service (Stripe)
│   ├── reviews/          # Product reviews
│   ├── search/           # Elasticsearch integration
│   ├── notifications/    # Socket.io real-time notifications
│   ├── newsletter/       # Newsletter subscriptions
│   ├── returns/          # Return/refund handling
│   ├── admin/            # Admin-specific features
│   └── health/           # Health checks (@nestjs/terminus)
├── common/               # Shared utilities
│   ├── entities/         # Base entity (UUID id, createdAt, updatedAt)
│   ├── database/         # AbstractRepository<T> (generic CRUD)
│   ├── guards/           # JwtGuard, RolesGuard
│   ├── interceptors/     # Transform, Logging, Cache, Language
│   ├── filters/          # HTTP + WebSocket exception filters
│   ├── decorators/       # @Public(), @Roles()
│   └── pipes/            # Validation, FileValidation
├── infrastructure/       # Cross-cutting services
│   ├── cache/            # RedisService (ioredis, pub-sub, distributed locks)
│   ├── queue/            # BullMQ job queues
│   ├── email/            # MailerService
│   ├── database/         # Migrations, seeds
│   └── storage/          # S3 integration
├── config/               # App configuration
├── app.module.ts         # Root module
└── main.ts               # Entry point (CORS, Swagger, Helmet)
```

### Module Pattern

Each feature module in `src/modules/` follows a layered architecture:

```
module/
├── entities/          # TypeORM entities
├── repositories/      # Data access (extend AbstractRepository<T>)
├── services/          # Business logic
├── controllers/       # HTTP handlers + route definitions
├── dtos/              # Request validation DTOs
├── jobs/              # BullMQ job handlers (if applicable)
└── tests/             # Unit test specs (*.spec.ts)
```

---

## Key Design Decisions

### Multi-Language Content

Product `name`, `description`, `seoTitle`, and similar fields on Categories/Brands are stored as `jsonb` columns:

```json
{ "en": "Product Name", "ar": "اسم المنتج" }
```

A `LanguageInterceptor` reads `Accept-Language` header to return locale-specific content.

### Repository Pattern

All repositories extend `AbstractRepository<T>` (`src/common/database/abstract.repository.ts`), providing:

- `findOne`, `findById`, `findAll`
- `findWithPagination`
- `create`, `update`, `softDelete`, `restore`

### Authentication Strategy

- **JWT access token** + **refresh token** (dual token strategy)
- `@Public()` decorator bypasses the global `JwtGuard`
- Roles: `customer`, `staff`, `admin` — enforced via `@Roles()` decorator + `RolesGuard`
- `AuthModule` exports `AuthService`, `TokenService`, `JwtModule`, `PassportModule` for reuse

### Real-Time Notifications

Socket.io gateway (`NotificationsGateway`) backed by `@socket.io/redis-adapter` for horizontal scaling across multiple instances.

### Background Jobs

BullMQ handles async tasks like:
- Abandoned cart reminders (`cart/jobs/abandoned-cart.job.ts`)
- Email sending
- Other async operations

### Payment Processing

Stripe integration lives in `orders/services/payment.service.ts`.

---

## Database

- **ORM**: TypeORM with PostgreSQL
- **Migrations**: Stored in `src/infrastructure/database/migrations/`
- **Entities**: Defined within each module's `entities/` folder
- **Synchronize**: Auto-enabled when `NODE_ENV !== 'production'`; disabled in production (use migrations)
- **Config**: `ormconfig.ts` uses `DATABASE_*` env vars

---

## Docker

Multi-stage build producing a lean production image:

- **Base**: `node:20-alpine`
- **Security**: Runs as non-root user (`nestjs:nodejs`, UID 1001)
- **Init**: Uses `dumb-init` for proper signal handling
- **Health Check**: Hits `/api/v1/health` endpoint
- **Exposed Port**: 3000

---

## Testing

- **Framework**: Jest + Supertest (e2e)
- **Config**: Jest configured in `package.json`, e2e in `test/jest-e2e.json`
- **Pattern**: Test files are `*.spec.ts` colocated in module `tests/` folders
- **Module Name Mapping**: Jest `moduleNameMapper` resolves `@modules/*` and `@common/*` aliases

---

## Coding Conventions

- **Language**: TypeScript (strict mode partially disabled — `strictNullChecks: false`, `noImplicitAny: false`)
- **Formatting**: Prettier (see `.prettierrc`)
- **Linting**: ESLint with `@typescript-eslint` (see `eslint.config.mjs`)
- **Naming**: NestJS conventions — PascalCase for classes/decorators, camelCase for methods/variables
- **DTOs**: Use `class-validator` decorators for request validation
- **Entities**: Extend `BaseEntity` (UUID `id`, `createdAt`, `updatedAt`)

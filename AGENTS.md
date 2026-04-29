# AGENTS.md

## Dev Commands

```bash
npm run start:dev       # watch mode (recommended)
npm run build           # compile TypeScript
npm run test            # run all unit tests
npx jest src/modules/auth/tests/auth.service.spec.ts  # single test file
npm run migration:generate  # generate migration from entity changes
npm run migration:run        # apply pending migrations
```

## CI Enforcement

**Order: lint → test → build** — lint fails prevent test/build (see `.github/workflows/ci.yml`).

Run lint manually: `npx eslint "src/**/*.ts" --max-warnings 0`

## Database Config

Uses `DATABASE_*` env vars (not `DB_*` as shown in README):
```
DATABASE_HOST, DATABASE_PORT, DATABASE_USERNAME, DATABASE_PASSWORD, DATABASE_NAME
```

`ormconfig.ts`: `synchronize: false` — **always generate and run migrations**, never rely on auto-sync.

## Module Conventions

- Entities extend `BaseEntity` from `@common/entities/base.entity` (provides `id` [uuid], `createdAt`, `updatedAt`)
- Repositories extend `AbstractRepository<T>` from `@common/database/abstract.repository`
- Soft delete: entity needs `@DeleteDateColumn({ name: 'deleted_at', nullable: true })` + use `softDelete()` from repo
- IDs are **UUID v4** — use `ParseUUIDPipe` in controller params

## Multi-language Fields

`name`, `description`, etc. stored as PostgreSQL `jsonb` with shape `{ "en": "...", "ar": "..." }`. Import `TranslatableString` from `@common/types/translatable.type`.

## Path Aliases

```
@/*          → src/*
@common/*    → src/common/*
@modules/*   → src/modules/*
@infrastructure/* → src/infrastructure/*
@config/*    → src/config/*
```

## Global Infrastructure (inject directly, no import needed in module)

- `RedisService` — `@infrastructure/cache/redis.service`
- `BullmqService` — `@infrastructure/queue/bullmq.service`
- `MailerService` — `@infrastructure/email/mailer.service`

## Auth & Roles

- `@Public()` decorator skips JWT guard
- Roles: `customer` | `staff` | `admin`
- Guard: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.ADMIN)`

## Style

- Prettier: single quotes, trailing commas (`.prettierrc`)
- ESLint: flat config in `eslint.config.mjs`, no npm script — run via `npx eslint`
- No comment policy: don't add comments unless explicitly asked

## Existing Docs

- **CLAUDE.md**: detailed architecture, auth flow, module structure
- **.claude/skills/code-review/SKILL.md**: full module generation templates, DTO patterns, pitfall list
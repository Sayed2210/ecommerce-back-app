# Database (TypeORM + PostgreSQL)

Database configuration, migrations, and seed scripts.

## Configuration

| Env Variable | Default | Description |
|-------------|---------|-------------|
| `DATABASE_HOST` | `localhost` | PostgreSQL host |
| `DATABASE_PORT` | `5432` | PostgreSQL port |
| `DATABASE_USERNAME` | — | Database user |
| `DATABASE_PASSWORD` | — | Database password |
| `DATABASE_NAME` | — | Database name |
| `NODE_ENV` | — | Sync is auto-enabled when not `production` |

Auto-sync (`synchronize: true`) is enabled outside production. In production, use migrations only.

## Migrations

```bash
npm run migration:generate   # Generate migration from entity changes
npm run migration:run        # Apply pending migrations
```

Migrations live in `src/infrastructure/database/migrations/`.

## Seeds

```bash
npm run seed   # (or: npx ts-node src/infrastructure/database/seeds/admin.seed.ts)
```

### `admin.seed.ts`
Creates the initial admin user. Reads credentials from env:

| Env Variable | Description |
|-------------|-------------|
| `ADMIN_EMAIL` | Admin email address |
| `ADMIN_PASSWORD` | Admin password (must meet complexity requirements) |

If either variable is missing, the seed throws immediately. The password is never logged.

## Base Entity (`src/common/entities/base.entity.ts`)

All entities extend `BaseEntity`:

```typescript
id:        UUID (PK, auto-generated)
createdAt: timestamp (auto)
updatedAt: timestamp (auto)
```

## Abstract Repository (`src/common/database/abstract.repository.ts`)

Generic base class all repositories extend:

| Method | Description |
|--------|-------------|
| `findOne(where)` | Find single record |
| `findOneOrFail(where)` | Find or throw NotFoundException |
| `findAll(options)` | Find multiple records |
| `findWithPagination(page, limit, where)` | Paginated query |
| `create(data)` | Insert and return |
| `update(id, data)` | Update and return |
| `softDelete(id)` | Soft delete (sets isActive/deletedAt) |
| `restore(id)` | Restore soft-deleted record |
| `permanentDelete(id)` | Hard delete |
| `createQueryBuilder(alias)` | Raw query builder access |

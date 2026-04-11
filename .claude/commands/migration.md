Generate or run TypeORM database migrations for this e-commerce backend.

## Generate a migration (from entity changes)

```
npm run migration:generate -- --name <MigrationName>
```

This diffs the current entity definitions against the database schema and writes a migration file to `src/infrastructure/database/migrations/`.

Use PascalCase names that describe the change, e.g. `AddProductSlugIndex`, `CreateCouponsTable`, `AddMultiLanguageSupport`.

## Run pending migrations

```
npm run migration:run
```

## When to use migrations vs. synchronize

- `synchronize: true` is active when `NODE_ENV !== 'production'` (set in `src/app.module.ts`). In development, TypeORM auto-syncs — migrations are optional but recommended for tracking schema history.
- In production (`NODE_ENV=production`), synchronize is **off**. Always run migrations before deploying to production.

## After the user asks to generate or run a migration

1. Confirm which action they want: generate (from entity changes) or run (apply pending).
2. Run the appropriate command above.
3. If generating: read the new migration file and summarise what SQL it will execute (up and down).
4. If running: report which migrations were applied.

## Migration file location

`src/infrastructure/database/migrations/`

The existing migration `1765641477430-add_multi_language_support.ts` is a reference example.

Add a new TypeORM entity to an existing module in this e-commerce backend.

The user will specify: the entity name and which module it belongs to (e.g. "add a Tag entity to the products module").

## Steps

1. **Read the module** — Read the target module file at `src/modules/<module>/<module>.module.ts` to understand what's already imported.

2. **Create the entity** at `src/modules/<module>/entities/<entity>.entity.ts`:
   - Extend `BaseEntity` from `@common/entities/base.entity`
   - Use snake_case for column names via `{ name: 'column_name' }` option
   - Use `type: 'jsonb'` for multi-language fields (name, description, etc.)
   - Use `type: 'decimal', precision: 12, scale: 2` for price/money fields
   - Add `@Index()` on columns likely to be queried (slug, email, foreign keys)
   - Nullable optional fields with `nullable: true`

3. **Update the entity barrel** at `src/modules/<module>/entities/index.ts` — add an `export * from './<entity>.entity'` line.

4. **Create a repository** at `src/modules/<module>/repositories/<entity>.repository.ts` — extending `AbstractRepository<Entity>`.

5. **Update the module** — add the entity to `TypeOrmModule.forFeature([...])` and add the repository to `providers` and `exports`.

## Constraints

- Never modify entities that already exist; only create new files.
- Use `@modules/*` and `@common/*` path aliases.
- Do not add soft-delete columns — the `AbstractRepository.softDelete()` method uses TypeORM's built-in soft-delete which requires `@DeleteDateColumn` only if needed; ask the user if they want soft-delete support before adding it.

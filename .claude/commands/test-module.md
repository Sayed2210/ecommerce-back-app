Run tests for a specific module in this NestJS e-commerce backend.

The user will provide a module name (e.g. "auth", "orders", "products", "reviews", "users").

## Steps

1. Run the tests scoped to the module:
   ```
   npx jest src/modules/<module>/tests/ --verbose
   ```

2. If no `tests/` directory exists for that module, also check for spec files directly:
   ```
   npx jest src/modules/<module>/ --verbose
   ```

3. Report:
   - Which test files ran
   - Pass/fail counts
   - Any failing test names and the error message
   - If no tests exist, say so clearly and offer to scaffold a spec file

## To run a single specific spec file

```
npx jest src/modules/<module>/tests/<name>.service.spec.ts --verbose
```

## To run all tests with coverage

```
npm run test:cov
```

## Test patterns used in this project

- Tests use `@nestjs/testing` `Test.createTestingModule`
- All dependencies are mocked with `jest.fn()` — no real DB or Redis connections
- Pattern: `Partial<Record<keyof ServiceOrRepo, jest.Mock>>`
- `beforeEach` recreates the module and stubs
- Tests are co-located in `src/modules/<module>/tests/`

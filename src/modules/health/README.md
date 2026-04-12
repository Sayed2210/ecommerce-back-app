# Health Module

Exposes a `/health` endpoint for load balancer and uptime monitoring checks.

## Endpoint

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | ❌ | Check DB, Redis, and Elasticsearch connectivity |

## Response

```json
{
  "status": "ok",
  "info": {
    "database":      { "status": "up" },
    "redis":         { "status": "up" },
    "elasticsearch": { "status": "up" }
  },
  "error": {},
  "details": { ... }
}
```

Returns HTTP `200` when all checks pass, `503` when any check fails.

## Checks

| Key | Indicator | How |
|-----|-----------|-----|
| `database` | `TypeOrmHealthIndicator.pingCheck` | TypeORM connection ping |
| `redis` | `RedisHealthIndicator` | `RedisService.isHealthy()` → ioredis ping |
| `elasticsearch` | `ElasticsearchHealthIndicator` | `ElasticsearchService.ping()` → ES cluster ping |

## Custom Indicators

### `RedisHealthIndicator`
Wraps `RedisService.isHealthy()` (already implemented in `CacheModule`).

### `ElasticsearchHealthIndicator`
Calls `ElasticsearchService.ping()` — throws `HealthCheckError` on failure.

## Dependencies

Imports `TerminusModule`, `TypeOrmModule`, and `SearchModule` (to access `ElasticsearchService`).
`RedisService` is injected automatically via the global `CacheModule`.

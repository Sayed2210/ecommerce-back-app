# Cache (Redis)

Global Redis service using `ioredis`. Available in every module without explicit import (`@Global`).

## Configuration

| Env Variable | Default | Description |
|-------------|---------|-------------|
| `REDIS_HOST` | `localhost` | Redis server host |
| `REDIS_PORT` | `6379` | Redis server port |
| `REDIS_PASSWORD` | — | Password (optional) |
| `REDIS_DB` | `0` | Database index |

Connection settings: lazy connect, max 3 retries/request, exponential backoff (max 2s).

## `RedisService` API

### Basic Operations

| Method | Description |
|--------|-------------|
| `get<T>(key)` | Get and JSON-deserialize a value |
| `set<T>(key, value, ttlSeconds?)` | JSON-serialize and set, with optional TTL |
| `delete(key)` | Delete a key |
| `deleteMultiple(keys[])` | Delete multiple keys |
| `exists(key)` | Check if key exists |
| `expire(key, seconds)` | Set expiry on existing key |
| `ttl(key)` | Get remaining TTL in seconds |

### Counters

| Method | Description |
|--------|-------------|
| `increment(key, amount?)` | Increment counter by amount (default 1) |
| `decrement(key, amount?)` | Decrement counter |

### Hash Operations

| Method | Description |
|--------|-------------|
| `hset(key, field, value)` | Set hash field |
| `hget<T>(key, field)` | Get hash field |
| `hgetall<T>(key)` | Get all hash fields |
| `hdel(key, field)` | Delete hash field |

### Caching Pattern

```typescript
// Cache-aside: returns cached value or fetches and stores
const products = await redisService.cache(
  'products:page:1',
  () => productsRepository.findAll(),
  300 // TTL in seconds
);
```

### Distributed Locks

```typescript
const lockValue = await redisService.acquireLock('inventory:product:123', 30);
// ... do work ...
await redisService.releaseLock('inventory:product:123', lockValue);
```

### Pub/Sub

```typescript
redisService.publish('order:created', { orderId });
redisService.subscribe('order:created', (msg) => { ... });
```

### Key Patterns in Use

| Key Pattern | Module | TTL | Description |
|------------|--------|-----|-------------|
| `products:{filters}:{page}:{limit}` | Products | 5 min | Product list cache |
| `product:{id}` | Products | 10 min | Single product cache |
| `revoked:reset:{sha256}` | Auth | 1 hr | Used password reset tokens |
| `lock:{key}` | Various | configurable | Distributed lock |

### Utilities

| Method | Description |
|--------|-------------|
| `scan(pattern, count?)` | Scan keys matching glob pattern |
| `deletePattern(pattern)` | Delete all keys matching pattern |
| `isHealthy()` | Ping check |
| `getStats()` | Memory, uptime, client count |
| `flushAll()` | Flush all (non-production only) |

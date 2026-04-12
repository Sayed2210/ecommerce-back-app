# Frontend Developer Guide

## 📖 API Documentation (Swagger)

**The primary source of truth** — interactive, always up-to-date with the actual code.

### Access

Once the backend is running:

| URL | Description |
|-----|-------------|
| **http://localhost:3000/api** | Swagger UI — browse and test all endpoints |
| **http://localhost:3000/api-json** | Raw OpenAPI JSON (for code generation tools) |

### Using Swagger UI

1. **Browse endpoints** — click any section to see request/response schemas
2. **Test endpoints** — click "Try it out" to send real requests
3. **Authenticate** — click 🔒 **Authorize** at the top, enter: `Bearer your_jwt_token_here`
4. **View models** — scroll to "Schemas" to see all DTOs with field descriptions

## 🚀 Quick Start

### 1. Register a new user

```bash
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

### 2. Login to get tokens

```bash
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "SecurePass123!"
}
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "...", "email": "...", "role": "customer" }
}
```

### 3. Use the access token

```bash
GET http://localhost:3000/users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## 🌐 CORS & Base URL

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:3000` |
| Production | Configure via `FRONTEND_URL` env var |

CORS allows credentials and the following methods: `GET, POST, PUT, PATCH, DELETE, OPTIONS`

## 🔐 Authentication Flow

```
Register → Login → [accessToken + refreshToken]
                          ↓
              Use accessToken in Authorization header
                          ↓
            When accessToken expires → POST /auth/refresh
            (send refreshToken to get new tokens)
```

**Token storage:**
- `accessToken` — short-lived (1 day), use for API calls
- `refreshToken` — longer-lived (7 days), use to refresh access tokens

## 🌍 Multi-Language Content

Product/category names and descriptions are stored as JSONB objects:

```json
{
  "name": { "en": "Product Name", "ar": "اسم المنتج" },
  "description": { "en": "Description...", "ar": "الوصف..." }
}
```

Send `Accept-Language: en` or `Accept-Language: ar` header to get the localized version in responses.

## 📋 API Sections (by Tag)

| Tag | Base Path | Auth Required | Description |
|-----|-----------|:-------------:|-------------|
| **Authentication** | `/auth/*` | Partial | Register, login, password reset |
| **Products** | `/products/*` | Partial (browse = public, write = admin) | Product CRUD |
| **Categories** | `/categories/*` | Partial | Category management |
| **Brands** | `/brands/*` | Partial | Brand management |
| **Cart** | `/cart/*` | ✅ | Shopping cart operations |
| **Checkout** | `/checkout/*` | ✅ | Validate cart, create orders |
| **Orders** | `/orders/*` | ✅ | Order management |
| **Users** | `/users/*` | ✅ | User profile |
| **Wishlist** | `/wishlist/*` | ✅ | Wishlist management |
| **Reviews** | `/reviews/*` | Partial | Product reviews |
| **Search** | `/search` | ❌ | Full-text search |
| **Notifications** | `/notifications/*` | ✅ | Real-time notifications |
| **Newsletter** | `/newsletter/*` | Partial | Subscribe/unsubscribe |
| **Returns** | `/returns/*` | ✅ | Return/refund requests |
| **Coupons** | `/coupons/*` | Partial (write = admin) | Discount coupons |
| **Admin Staff** | `/admin/staff/*` | ✅ (admin) | Staff management |
| **Admin Analytics** | `/admin/analytics/*` | ✅ (admin) | Analytics & audit logs |
| **Admin Dashboard** | `/admin/dashboard/*` | ✅ (admin) | Dashboard stats |
| **Health** | `/health` | ❌ | Health check |

## 🎯 Key Response Patterns

### Pagination

List endpoints return:
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15
  }
}
```

### Error Response

```json
{
  "statusCode": 400,
  "message": ["email must be an email", "password is too short"],
  "error": "Bad Request"
}
```

## 🛠 Code Generation (Optional)

You can generate TypeScript API clients from the OpenAPI spec:

```bash
# Get the OpenAPI spec
curl http://localhost:3000/api-json > openapi.json

# Generate with openapi-typescript-codegen
npx openapi-typescript-codegen --input openapi.json --output ./src/api
```

## 📦 WebSocket (Real-Time Notifications)

Connect via Socket.io at `http://localhost:3000`:

```typescript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: 'your_jwt_token' }
});

socket.on('notification', (data) => {
  console.log('New notification:', data);
});
```

## ❓ Need More Details?

- **Swagger UI** (`/api`) — browse all endpoints, schemas, and examples
- **README.md** in each module — contains module-specific documentation
- Ask the backend team for any unclear behavior or edge cases

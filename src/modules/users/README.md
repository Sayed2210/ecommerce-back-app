# Users Module

Manages user profiles, shipping addresses, and wishlists.

## Responsibilities

- Profile retrieval and updates (self-service)
- Admin user management (list, view, delete)
- Shipping address CRUD
- Wishlist add/remove/list

## Endpoints

### Users

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/users` | JWT | ADMIN | List all users (paginated) |
| GET | `/users/me` | JWT | — | Get own profile |
| PATCH | `/users/me` | JWT | — | Update own profile |
| GET | `/users/:id` | JWT | ADMIN | Get user by ID |
| DELETE | `/users/:id` | JWT | ADMIN | Soft-delete user |

### Addresses

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/addresses` | JWT | List own addresses |
| POST | `/addresses` | JWT | Create address |
| PATCH | `/addresses/:id` | JWT | Update address |
| PATCH | `/addresses/:id/default` | JWT | Set as default |
| DELETE | `/addresses/:id` | JWT | Delete address |

### Wishlist

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users/me/wishlist` | JWT | Get wishlist products |
| POST | `/wishlist` | JWT | Add product to wishlist |
| DELETE | `/wishlist/:productId` | JWT | Remove from wishlist |

## Entities

### `Address`
| Field | Type | Notes |
|-------|------|-------|
| label | enum | HOME \| WORK \| OTHER |
| streetAddress | string | |
| city | string | |
| state | string | optional |
| country | string | |
| postalCode | string | |
| isDefault | boolean | one default per user |
| userId | UUID | FK → User |

### `Wishlist`
| Field | Type | Notes |
|-------|------|-------|
| userId | UUID | FK → User |
| productId | UUID | FK → Product |
| | | unique(userId, productId) |

## DTOs

### `UpdateProfileDto`
```typescript
{
  firstName?: string
  lastName?: string
  phone?: string
  avatarUrl?: string
}
```
> `email`, `role`, and `isActive` are not editable via this endpoint.

### `CreateAddressDto`
```typescript
{
  label: AddressLabel   // HOME | WORK | OTHER
  streetAddress: string
  city: string
  state?: string
  country: string
  postalCode: string
  isDefault?: boolean
}
```

## Services

### `UsersService`
- `findAll(pagination)` — paginated user list (admin)
- `findOne(id)` — single user, strips sensitive fields
- `update(id, dto)` — updates profile fields only
- `remove(id)` — sets `isActive = false`
- `getWishlist(userId)` — returns wishlisted products with details

### `AddressesService`
- `findAll(userId)` — all addresses for the user
- `create(userId, dto)` — creates; auto-sets default if first address
- `update(userId, id, dto)` — ownership-checked update
- `setDefault(userId, id)` — clears other defaults, sets this one
- `remove(userId, id)` — ownership-checked delete

## Exports

`UsersService`, `UserRepository`, `TypeOrmModule`

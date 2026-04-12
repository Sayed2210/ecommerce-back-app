# Users Module

Manages customer profiles, shipping/billing addresses, and wishlists.

## Business Purpose

After a customer authenticates, this module lets them maintain their personal data — update their profile, save multiple delivery addresses, and curate a wishlist of products they want to buy later. Admins use this module to view and deactivate user accounts.

## How It Works

### Profile Management
- `GET /users/me` — returns the authenticated user's profile. Sensitive fields (`passwordHash`, `refreshTokens`) are stripped before returning.
- `PATCH /users/me` — allows updating `firstName`, `lastName`, `phone`, `avatarUrl`. If the email is being changed, uniqueness is re-checked first.
- `DELETE /users/:id` (Admin) — does a soft deactivation (`isActive = false`) rather than a hard delete, preserving order history.

### Address Book
Customers can store multiple named addresses (home, office, etc.) and designate one as default. The checkout flow references address IDs when creating an order.

- `POST /users/me/addresses` — add a new address
- `GET /users/me/addresses` — list all addresses
- `PATCH /users/me/addresses/:id` — update an address
- `DELETE /users/me/addresses/:id` — remove an address

### Wishlist
A wishlist entry links a user to a product. Products can be added and removed. The wishlist is fetched with full product details so the frontend can render prices and availability without a separate products call.

- `GET /users/me/wishlist` — returns the wishlist with product relations loaded
- `POST /users/me/wishlist` — add a product
- `DELETE /users/me/wishlist/:productId` — remove a product

### Admin User Management
Admins can list all users (paginated), fetch a user by ID, and deactivate accounts. These routes are guarded by `@Roles(UserRole.ADMIN)`.

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/users/me` | JWT | Get own profile |
| PATCH | `/users/me` | JWT | Update own profile |
| GET | `/users/me/wishlist` | JWT | Get wishlist with products |
| POST | `/users/me/addresses` | JWT | Add an address |
| GET | `/users/me/addresses` | JWT | List addresses |
| PATCH | `/users/me/addresses/:id` | JWT | Update address |
| DELETE | `/users/me/addresses/:id` | JWT | Delete address |
| GET | `/users` | Admin | List all users (paginated) |
| GET | `/users/:id` | Admin | Get user by ID |
| DELETE | `/users/:id` | Admin | Deactivate user |

## Services

| Service | Responsibility |
|---|---|
| `UsersService` | Profile CRUD and wishlist retrieval |
| `AddressesService` | Address book management |
| `NotificationsService` | User-scoped notification queries (see Notifications module) |

## Key Entities

- **`User`** (owned by Auth module, re-used here) — identity and role
- **`Address`** — street, city, country, postal code, `isDefault` flag
- **`Wishlist`** — join table between User and Product

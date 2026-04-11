# Auth Module

Handles all identity and session management for the platform.

## Business Purpose

Any visitor must prove who they are before accessing protected resources. This module issues JWT access tokens (short-lived) and refresh tokens (long-lived), supports email/password registration and login, password reset via email, and token revocation on logout.

## How It Works

### Registration
1. Checks that the email is not already taken — throws `409 Conflict` if it is.
2. Hashes the password with bcrypt via `PasswordService`.
3. Creates the `User` record with `role = customer` by default.
4. Immediately issues an `accessToken` + `refreshToken` pair so the user is logged in right away.
5. Saves the hashed refresh token to the `refresh_tokens` table.

### Login
1. Looks up the user by email. Returns `401 Unauthorized` for both "no account" and "wrong password" — deliberately gives no hint which one failed.
2. Issues a new token pair and saves the refresh token.

### Token Refresh
1. Verifies the submitted refresh token (signature + expiry).
2. Revokes the old refresh token (one-time use).
3. Issues a new token pair and saves the new refresh token.

### Forgot / Reset Password
1. `POST /auth/forgot-password` — always returns a success-looking message regardless of whether the email exists (prevents user enumeration). If the account does exist, a reset link is sent via `MailerService` with a 1-hour expiry token.
2. `POST /auth/reset-password` — verifies the token, hashes the new password, saves it, and revokes the reset token so it cannot be reused.

### Logout
Revokes the supplied refresh token. The short-lived access token is not explicitly invalidated — it naturally expires.

### Email Verification
`POST /auth/verify-email` — marks `isEmailVerified = true` on the user. The verification token is issued separately and revoked after use.

## Token Architecture

| Token | Stored in DB? | Revocable? | Purpose |
|---|---|---|---|
| Access Token (JWT) | No | No (expires via TTL) | Authenticates API requests |
| Refresh Token (JWT) | Yes (hashed) | Yes | Gets a new access token |
| Reset Token (JWT) | Yes | Yes | One-time password reset |
| Verification Token | Yes | Yes | One-time email verification |

## Guards & Decorators

- **`JwtAuthGuard`** — validates the `Bearer` access token. Apply to protected routes.
- **`@Public()`** — marks a route as opt-out of the global JWT guard (register, login, forgot-password, etc. are public).
- **`RolesGuard`** — reads `@Roles(UserRole.ADMIN)` and checks `user.role` in the JWT payload.

## User Roles

| Role | Description |
|---|---|
| `customer` | Default role. Can browse, buy, review. |
| `staff` | Back-office operator. Can manage orders and products. |
| `admin` | Full access including user management and admin dashboard. |

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Create account and receive tokens |
| POST | `/auth/login` | Public | Authenticate and receive tokens |
| POST | `/auth/refresh` | Public | Rotate refresh token |
| POST | `/auth/forgot-password` | Public | Send reset email |
| POST | `/auth/reset-password` | Public | Apply new password using reset token |
| POST | `/auth/logout` | JWT | Revoke refresh token |
| POST | `/auth/verify-email` | Public | Verify email address |

## Services

| Service | Responsibility |
|---|---|
| `AuthService` | Orchestrates registration, login, logout, and password flows |
| `TokenService` | Issues, saves, verifies, and revokes all JWT tokens |
| `PasswordService` | bcrypt hash and verify |
| `OAuthService` | OAuth provider linking (Google, etc.) |
| `MailerService` | Sends password-reset and verification emails |

## Key Entities

- **`User`** — core identity record with `role`, `isEmailVerified`, `isActive`, `lastLogin`
- **`RefreshToken`** — persisted refresh tokens enabling rotation and revocation
- **`OAuthProvider`** — links a user to an external OAuth identity (e.g. Google user ID)

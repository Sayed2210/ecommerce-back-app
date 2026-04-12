# Auth Module

Handles user registration, login, JWT token lifecycle, password management, and OAuth.

## Responsibilities

- Register/login users with email + password
- Issue and refresh JWT access/refresh token pairs
- Email verification on registration
- Password reset flow (forgot → email → reset)
- OAuth login (Google, GitHub)
- Revoke tokens on logout (refresh token in DB, reset token in Redis)

## Endpoints

| Method | Path | Rate Limit | Auth | Description |
|--------|------|-----------|------|-------------|
| POST | `/auth/register` | 5/min | ❌ | Create new account |
| POST | `/auth/login` | 5/min | ❌ | Login, returns token pair |
| POST | `/auth/refresh` | — | ❌ | Exchange refresh token for new access token |
| POST | `/auth/verify-email` | — | ❌ | Verify email with token from email |
| POST | `/auth/forgot-password` | 3/hr | ❌ | Request reset email |
| POST | `/auth/reset-password` | 5/hr | ❌ | Reset password with token |
| POST | `/auth/logout` | — | JWT | Revoke refresh token |

## Entities

### `User`
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK, auto-generated |
| email | string | unique, indexed |
| passwordHash | string | bcrypt, 12 rounds |
| firstName | string | |
| lastName | string | |
| phone | string | optional |
| avatarUrl | string | optional |
| isEmailVerified | boolean | default false |
| isActive | boolean | default true |
| role | enum | CUSTOMER \| STAFF \| ADMIN |
| lastLogin | Date | optional |

### `RefreshToken`
| Field | Type | Notes |
|-------|------|-------|
| token | string | unique |
| isRevoked | boolean | |
| expiresAt | Date | 7 days |
| userId | UUID | FK → User |

### `OAuthProvider`
| Field | Type | Notes |
|-------|------|-------|
| provider | enum | GOOGLE \| GITHUB |
| providerUserId | string | |
| accessToken | string | optional |
| userId | UUID | FK → User |

## DTOs

### `RegisterDto`
```typescript
{
  email: string        // valid email
  password: string     // min 8, uppercase + lowercase + digit + special char
  firstName: string
  lastName: string
  phone?: string
}
```

### `LoginDto`
```typescript
{
  email: string
  password: string
}
```

### `ResetPasswordDto`
```typescript
{
  token: string
  newPassword: string
}
```

## Services

### `AuthService`
- `register(dto)` — creates user, sends verification email, returns tokens
- `login(dto)` — validates credentials, returns tokens
- `refreshTokens(dto)` — verifies refresh token, issues new access token
- `verifyEmail(token)` — marks `isEmailVerified = true`
- `forgotPassword(dto)` — generates reset token (1h), sends email
- `resetPassword(dto)` — verifies token (checks Redis revocation), sets new password hash, revokes token
- `logout(refreshToken)` — deletes refresh token from DB

### `TokenService`
- `generateTokens(userId)` — access token (15m) + refresh token (7d)
- `generateResetToken(userId)` — signed JWT, 1h, `JWT_RESET_SECRET`
- `generateVerificationToken(userId)` — signed JWT, 24h, `JWT_VERIFICATION_SECRET`
- `verifyRefreshToken(token)` — verifies JWT signature **and** confirms the token still exists in DB (detects use of already-rotated tokens)
- `verifyResetToken(token)` — checks Redis blocklist first, then verifies signature
- `revokeResetToken(token)` — SHA-256 hashes token, stores in Redis with 1h TTL (`revoked:reset:<hash>`)

### `PasswordService`
- `hash(password)` — bcrypt, 12 rounds
- `verify(password, hash)` — bcrypt compare
- `generateRandomPassword(length)` — `crypto.randomBytes`, base64

## Security

- Refresh tokens stored in DB; invalidated on logout
- Reset tokens blocklisted in Redis after use (SHA-256 hash, 1h TTL)
- `JWT_VERIFICATION_SECRET` throws at startup if not set (no fallback)
- All auth endpoints behind `ThrottlerGuard` with route-specific limits

## Env Variables

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Access token signing secret (32+ bytes) |
| `JWT_REFRESH_SECRET` | Refresh token signing secret |
| `JWT_RESET_SECRET` | Password reset token secret |
| `JWT_VERIFICATION_SECRET` | Email verification token secret |
| `JWT_EXPIRES_IN` | Access token TTL (default `15m`) |

## Exports

`AuthService`, `TokenService`, `TypeOrmModule`, `JwtModule`, `PassportModule`

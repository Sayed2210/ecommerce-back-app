# Admin Module

Admin dashboard, analytics, staff management, and audit logging. All endpoints require `ADMIN` role.

## Responsibilities

- Dashboard KPIs (revenue, orders, users)
- Revenue and product analytics
- Staff member management
- Audit log storage and retrieval

## Endpoints

### Dashboard

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/admin/dashboard/stats` | JWT | ADMIN | Key metrics (revenue, orders, users, top products) |

### Analytics

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/admin/analytics/revenue` | JWT | ADMIN | Revenue over time |
| GET | `/admin/analytics/products` | JWT | ADMIN | Top products, category breakdown |
| GET | `/admin/analytics/customers` | JWT | ADMIN | New vs. returning customers |

### Staff

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/admin/staff` | JWT | ADMIN | List staff (paginated) |
| GET | `/admin/staff/:id` | JWT | ADMIN | Get staff details |
| POST | `/admin/staff` | JWT | ADMIN | Create staff member |
| PATCH | `/admin/staff/:id` | JWT | ADMIN | Update staff |
| DELETE | `/admin/staff/:id` | JWT | ADMIN | Delete staff |

## Entities

### `Staff`
| Field | Type | Notes |
|-------|------|-------|
| employeeId | string | unique |
| department | string | optional |
| permissions | jsonb | granular permission map |
| role | string | |
| isActive | boolean | |
| userId | UUID | FK → User (1-to-1) |

### `AuditLog`
| Field | Type | Notes |
|-------|------|-------|
| action | string | e.g., `CREATE_PRODUCT`, `UPDATE_ORDER` |
| resourceType | string | e.g., `Product`, `Order` |
| resourceId | UUID | affected resource ID |
| oldValues | jsonb | state before change |
| newValues | jsonb | state after change |
| ipAddress | string | |
| userAgent | string | |
| userId | UUID | FK → User, optional |

## Services

### `DashboardService`
- `getStats()` — aggregates: total orders, revenue (all-time + this month), user count, recent orders, top products by sales volume, order status breakdown

### `AnalyticsService`
- Revenue time-series (daily, weekly, monthly)
- Product performance (views, sales, revenue per product)
- Customer acquisition and retention metrics

### `StaffService`
- `findAll(pagination)`, `findOne(id)`, `create(dto)`, `update(id, dto)`, `remove(id)`
- On create: generates employeeId, creates linked User with `STAFF` role

## Exports

`StaffService`, `AnalyticsService`

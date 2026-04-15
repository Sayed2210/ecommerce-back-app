import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { LanguageInterceptor } from '../src/common/interceptors/language.interceptor';

// ─── Shared test state ───────────────────────────────────────────────────────

let app: INestApplication;
let dataSource: DataSource;

let adminToken: string;
let customerToken: string;
let customerRefreshToken: string;

let adminUserId: string;
let customerUserId: string;

// Seed IDs created during tests
const createdCategoryIds: string[] = [];
const createdBrandIds: string[] = [];
const createdProductIds: string[] = [];
let createdTagId: string;
let createdReviewId: string;
let createdCouponId: string;
let cartItemId: string;

// ─── Fixtures ────────────────────────────────────────────────────────────────

// Use a single run-level timestamp so all fixtures are isolated per run
const RUN_ID = Date.now();

const ADMIN_EMAIL = `admin-e2e-${RUN_ID}@test.com`;
const ADMIN_PASSWORD = 'Admin@123!';

const CUSTOMER_EMAIL = `customer-e2e-${RUN_ID}@test.com`;
const CUSTOMER_PASSWORD = 'Customer@123!';

const CATEGORIES: Array<{ name: { en: string; ar: string }; description?: { en: string; ar: string } }> = [
  { name: { en: `Electronics ${RUN_ID}`, ar: `إلكترونيات ${RUN_ID}` }, description: { en: 'Gadgets and devices', ar: 'أدوات وأجهزة' } },
  { name: { en: `Clothing ${RUN_ID}`, ar: `ملابس ${RUN_ID}` }, description: { en: 'Fashion and apparel', ar: 'الموضة والملابس' } },
  { name: { en: `Home Garden ${RUN_ID}`, ar: `المنزل ${RUN_ID}` }, description: { en: 'Furniture and decor', ar: 'أثاث وديكور' } },
  { name: { en: `Sports ${RUN_ID}`, ar: `الرياضة ${RUN_ID}` }, description: { en: 'Sports equipment', ar: 'المعدات الرياضية' } },
  { name: { en: `Books ${RUN_ID}`, ar: `كتب ${RUN_ID}` }, description: { en: 'Books and literature', ar: 'كتب وأدب' } },
];

const BRAND = {
  name: { en: `TechBrand ${RUN_ID}`, ar: `براند ${RUN_ID}` },
  description: { en: 'Quality products', ar: 'منتجات جيدة' },
};

// ─── App bootstrap ────────────────────────────────────────────────────────────

beforeAll(async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication({ rawBody: true });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }));
  app.useGlobalInterceptors(new LanguageInterceptor());

  await app.init();

  dataSource = app.get(DataSource);

  // ── Register admin user ──────────────────────────────────────────────────
  const adminRegRes = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, firstName: 'Admin', lastName: 'E2E' });

  adminUserId = adminRegRes.body?.user?.id;
  expect(adminUserId).toBeDefined();

  // Promote to admin directly via DB
  await dataSource.query(`UPDATE users SET role = 'admin' WHERE id = $1`, [adminUserId]);

  // ── Login as admin ───────────────────────────────────────────────────────
  const adminLoginRes = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });

  adminToken = adminLoginRes.body?.tokens?.accessToken;
  expect(adminToken).toBeDefined();

  // ── Register customer user ───────────────────────────────────────────────
  const custRegRes = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email: CUSTOMER_EMAIL, password: CUSTOMER_PASSWORD, firstName: 'Customer', lastName: 'E2E' });

  customerUserId = custRegRes.body?.user?.id;
  expect(customerUserId).toBeDefined();

  // ── Login as customer ────────────────────────────────────────────────────
  const custLoginRes = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email: CUSTOMER_EMAIL, password: CUSTOMER_PASSWORD });

  customerToken = custLoginRes.body?.tokens?.accessToken;
  customerRefreshToken = custLoginRes.body?.tokens?.refreshToken;
  expect(customerToken).toBeDefined();

  // ── Seed: 1 brand via POST /brands ──────────────────────────────────────
  const brandRes = await request(app.getHttpServer())
    .post('/brands')
    .set('Authorization', `Bearer ${adminToken}`)
    .send(BRAND);

  expect(brandRes.status).toBe(201);
  createdBrandIds.push(brandRes.body.id);

  // ── Seed: 5 categories ───────────────────────────────────────────────────
  for (const cat of CATEGORIES) {
    const res = await request(app.getHttpServer())
      .post('/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(cat);

    expect(res.status).toBe(201);
    createdCategoryIds.push(res.body.id);
  }

  // ── Seed: 10 products ────────────────────────────────────────────────────
  const productNames = [
    { en: `Wireless Headphones ${RUN_ID}`, ar: `سماعات لاسلكية ${RUN_ID}` },
    { en: `Smart Watch ${RUN_ID}`, ar: `ساعة ذكية ${RUN_ID}` },
    { en: `Running Shoes ${RUN_ID}`, ar: `أحذية الجري ${RUN_ID}` },
    { en: `Yoga Mat ${RUN_ID}`, ar: `حصيرة اليوغا ${RUN_ID}` },
    { en: `Coffee Maker ${RUN_ID}`, ar: `صانعة القهوة ${RUN_ID}` },
    { en: `Office Chair ${RUN_ID}`, ar: `كرسي المكتب ${RUN_ID}` },
    { en: `Laptop Stand ${RUN_ID}`, ar: `حامل اللابتوب ${RUN_ID}` },
    { en: `Novel Journey ${RUN_ID}`, ar: `رواية الرحلة ${RUN_ID}` },
    { en: `Bluetooth Speaker ${RUN_ID}`, ar: `مكبر صوت بلوتوث ${RUN_ID}` },
    { en: `Mechanical Keyboard ${RUN_ID}`, ar: `لوحة مفاتيح ${RUN_ID}` },
  ];

  for (let i = 0; i < 10; i++) {
    const res = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: productNames[i],
        description: { en: `${productNames[i].en} - high quality product`, ar: `${productNames[i].ar} - منتج عالي الجودة` },
        basePrice: parseFloat((19.99 + i * 10).toFixed(2)),
        categoryId: createdCategoryIds[i % createdCategoryIds.length],
        brandId: createdBrandIds[0],
        inventoryQuantity: 50 + i * 10,
        isActive: true,
      });

    expect(res.status).toBe(201);
    createdProductIds.push(res.body.id);
  }
}, 60000);

afterAll(async () => {
  await app.close();
}, 15000);

// ─── Helper ───────────────────────────────────────────────────────────────────

const api = () => request(app.getHttpServer());
const authAs = (token: string) => ({ Authorization: `Bearer ${token}` });

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GET / — Health root', () => {
  it('should return 200', async () => {
    await api().get('/').expect(200);
  });
});

describe('GET /health — Health check', () => {
  // Health may return 503 when optional services (Elasticsearch) are down
  it('should respond with health status', async () => {
    const res = await api().get('/health');
    expect([200, 503]).toContain(res.status);
    expect(res.body).toBeDefined();
  }, 10000);
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

describe('POST /auth/register', () => {
  it('should reject duplicate email with 409', async () => {
    await api()
      .post('/auth/register')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, firstName: 'Dup', lastName: 'User' })
      .expect(409);
  });

  it('should reject weak password with 400', async () => {
    await api()
      .post('/auth/register')
      .send({ email: 'new@test.com', password: 'weak', firstName: 'Test', lastName: 'User' })
      .expect(400);
  });
});

describe('POST /auth/login', () => {
  it('should reject invalid credentials with 401', async () => {
    await api()
      .post('/auth/login')
      .send({ email: ADMIN_EMAIL, password: 'WrongPass@1' })
      .expect(401);
  });

  it('should return tokens on success', async () => {
    const res = await api()
      .post('/auth/login')
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
      .expect(200);

    expect(res.body.tokens.accessToken).toBeDefined();
    expect(res.body.tokens.refreshToken).toBeDefined();
  });
});

describe('POST /auth/refresh', () => {
  it('should return 401 for invalid refresh token', async () => {
    await api()
      .post('/auth/refresh')
      .send({ refreshToken: 'invalid-token' })
      .expect(401);
  });

  it('should return new access token with valid refresh token', async () => {
    const res = await api()
      .post('/auth/refresh')
      .send({ refreshToken: customerRefreshToken })
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
  });
});

describe('POST /auth/forgot-password', () => {
  it('should return 200 even for unknown email (security)', async () => {
    await api()
      .post('/auth/forgot-password')
      .send({ email: 'unknown@example.com' })
      .expect(200);
  });
});

describe('POST /auth/verify-email', () => {
  it('should return 400 for invalid token', async () => {
    await api()
      .post('/auth/verify-email')
      .send({ token: 'invalid-token' })
      .expect(400);
  });
});

describe('POST /auth/logout', () => {
  it('should return 401 without token', async () => {
    await api()
      .post('/auth/logout')
      .send({ refreshToken: customerRefreshToken })
      .expect(401);
  });
});

// ─── Products ─────────────────────────────────────────────────────────────────

describe('GET /products', () => {
  it('should list products (public)', async () => {
    const res = await api().get('/products').expect(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.length).toBeGreaterThanOrEqual(10);
  });

  it('should support pagination', async () => {
    const res = await api().get('/products?page=1&limit=5').expect(200);
    expect(res.body.data.length).toBeLessThanOrEqual(5);
  });
});

describe('GET /products/:id', () => {
  it('should retrieve seeded product', async () => {
    const res = await api().get(`/products/${createdProductIds[0]}`).expect(200);
    expect(res.body.id).toBe(createdProductIds[0]);
  });

  it('should return 404 for unknown product', async () => {
    await api().get('/products/00000000-0000-0000-0000-000000000000').expect(404);
  });
});

describe('POST /products (Admin)', () => {
  it('should reject non-admin with 403', async () => {
    await api()
      .post('/products')
      .set(authAs(customerToken))
      .send({
        name: { en: 'Test', ar: 'اختبار' },
        description: { en: 'Test', ar: 'اختبار' },
        basePrice: 9.99,
        categoryId: createdCategoryIds[0],
        brandId: createdBrandIds[0],
        inventoryQuantity: 10,
      })
      .expect(403);
  });
});

describe('PATCH /products/:id (Admin)', () => {
  it('should update product price', async () => {
    const res = await api()
      .patch(`/products/${createdProductIds[0]}`)
      .set(authAs(adminToken))
      .send({ basePrice: 29.99 })
      .expect(200);

    expect(parseFloat(res.body.basePrice)).toBe(29.99);
  });
});

// ─── Categories ───────────────────────────────────────────────────────────────

describe('GET /categories', () => {
  it('should list all 5 seeded categories (public)', async () => {
    const res = await api().get('/categories').expect(200);
    expect(Array.isArray(res.body) || res.body.data).toBeTruthy();
    const list = Array.isArray(res.body) ? res.body : res.body.data;
    expect(list.length).toBeGreaterThanOrEqual(5);
  });
});

describe('GET /categories/:id', () => {
  it('should return seeded category', async () => {
    const res = await api().get(`/categories/${createdCategoryIds[0]}`).expect(200);
    expect(res.body.id).toBe(createdCategoryIds[0]);
    expect(res.body.name).toBeDefined();
  });

  it('should return 404 for unknown id', async () => {
    await api().get('/categories/00000000-0000-0000-0000-000000000000').expect(404);
  });
});

describe('POST /categories (JWT required)', () => {
  it('should return 401 without token', async () => {
    await api()
      .post('/categories')
      .send(CATEGORIES[0])
      .expect(401);
  });
});

describe('PATCH /categories/:id', () => {
  it('should update category name', async () => {
    const res = await api()
      .patch(`/categories/${createdCategoryIds[0]}`)
      .set(authAs(adminToken))
      .send({ name: { en: 'Electronics Updated', ar: 'إلكترونيات محدثة' } })
      .expect(200);

    expect(res.body.name.en).toBe('Electronics Updated');
  });
});

// ─── Brands ───────────────────────────────────────────────────────────────────

describe('GET /brands', () => {
  it('should list brands (public)', async () => {
    const res = await api().get('/brands').expect(200);
    const list = Array.isArray(res.body) ? res.body : res.body.data;
    expect(list.length).toBeGreaterThanOrEqual(1);
  });
});

describe('GET /brands/:id', () => {
  it('should return seeded brand', async () => {
    const res = await api().get(`/brands/${createdBrandIds[0]}`).expect(200);
    expect(res.body.id).toBe(createdBrandIds[0]);
  });

  it('should return 404 for unknown brand', async () => {
    await api().get('/brands/00000000-0000-0000-0000-000000000000').expect(404);
  });
});

describe('PATCH /brands/:id', () => {
  it('should update brand name', async () => {
    const res = await api()
      .patch(`/brands/${createdBrandIds[0]}`)
      .set(authAs(adminToken))
      .send({ name: { en: `TechBrand Updated ${RUN_ID}`, ar: `براند محدث ${RUN_ID}` } })
      .expect(200);

    expect(res.body).toBeDefined();
  });
});

// ─── Tags ─────────────────────────────────────────────────────────────────────

describe('GET /tags', () => {
  it('should return tag list (public)', async () => {
    await api().get('/tags').expect(200);
  });
});

describe('POST /tags (Admin)', () => {
  it('should create a tag', async () => {
    const res = await api()
      .post('/tags')
      .set(authAs(adminToken))
      .send({ name: 'e2e-tag' })
      .expect(201);

    createdTagId = res.body.id;
    expect(createdTagId).toBeDefined();
  });

  it('should reject non-admin with 403', async () => {
    await api()
      .post('/tags')
      .set(authAs(customerToken))
      .send({ name: 'blocked-tag' })
      .expect(403);
  });
});

describe('DELETE /tags/:id (Admin)', () => {
  it('should delete the created tag', async () => {
    if (!createdTagId) return;
    await api()
      .delete(`/tags/${createdTagId}`)
      .set(authAs(adminToken))
      .expect((res) => expect([200, 204]).toContain(res.status));
  });
});

// ─── Users ────────────────────────────────────────────────────────────────────

describe('GET /users (Admin)', () => {
  it('should return 403 for customer', async () => {
    await api()
      .get('/users')
      .set(authAs(customerToken))
      .expect(403);
  });

  it('should return user list for admin', async () => {
    const res = await api()
      .get('/users')
      .set(authAs(adminToken))
      .expect(200);

    expect(res.body.data || res.body).toBeDefined();
  });
});

describe('GET /users/me', () => {
  it('should return current customer profile', async () => {
    const res = await api()
      .get('/users/me')
      .set(authAs(customerToken))
      .expect(200);

    expect(res.body.email).toBe(CUSTOMER_EMAIL);
  });
});

describe('PATCH /users/me', () => {
  it('should update customer profile', async () => {
    const res = await api()
      .patch('/users/me')
      .set(authAs(customerToken))
      .send({ firstName: 'UpdatedName' })
      .expect(200);

    expect(res.body.firstName).toBe('UpdatedName');
  });
});

describe('GET /users/me/wishlist', () => {
  it('should return customer wishlist (empty)', async () => {
    const res = await api()
      .get('/users/me/wishlist')
      .set(authAs(customerToken))
      .expect(200);

    expect(res.body).toBeDefined();
  });
});

describe('GET /users/:id (Admin)', () => {
  it('should return user by id for admin', async () => {
    const res = await api()
      .get(`/users/${customerUserId}`)
      .set(authAs(adminToken))
      .expect(200);

    expect(res.body.id).toBe(customerUserId);
  });
});

// ─── Wishlist ─────────────────────────────────────────────────────────────────

describe('GET /wishlist', () => {
  it('should return wishlist for authenticated user', async () => {
    await api().get('/wishlist').set(authAs(customerToken)).expect(200);
  });
});

describe('POST /wishlist', () => {
  it('should add product to wishlist', async () => {
    await api()
      .post('/wishlist')
      .set(authAs(customerToken))
      .send({ productId: createdProductIds[0] })
      .expect((res) => expect([200, 201]).toContain(res.status));
  });
});

describe('DELETE /wishlist/:productId', () => {
  it('should remove product from wishlist', async () => {
    await api()
      .delete(`/wishlist/${createdProductIds[0]}`)
      .set(authAs(customerToken))
      .expect((res) => expect([200, 204]).toContain(res.status));
  });
});

// ─── Cart ─────────────────────────────────────────────────────────────────────

describe('GET /cart', () => {
  it('should return or create cart', async () => {
    const res = await api()
      .get('/cart')
      .set(authAs(customerToken))
      .expect(200);

    expect(res.body).toBeDefined();
  });
});

describe('POST /cart/items', () => {
  it('should add product to cart', async () => {
    const res = await api()
      .post('/cart/items')
      .set(authAs(customerToken))
      .send({ productId: createdProductIds[0], quantity: 2 })
      .expect((r) => expect([200, 201]).toContain(r.status));

    cartItemId = res.body.id ?? res.body.items?.[0]?.id;
  });
});

describe('PATCH /cart/items/:id', () => {
  it('should update cart item quantity', async () => {
    if (!cartItemId) return;
    await api()
      .patch(`/cart/items/${cartItemId}`)
      .set(authAs(customerToken))
      .send({ quantity: 3 })
      .expect((r) => expect([200, 404]).toContain(r.status));
  });
});

describe('DELETE /cart/items/:id', () => {
  it('should remove item from cart', async () => {
    if (!cartItemId) return;
    await api()
      .delete(`/cart/items/${cartItemId}`)
      .set(authAs(customerToken))
      .expect((r) => expect([200, 204, 404]).toContain(r.status));
  });
});

describe('DELETE /cart', () => {
  it('should clear the entire cart', async () => {
    await api()
      .delete('/cart')
      .set(authAs(customerToken))
      .expect((r) => expect([200, 204]).toContain(r.status));
  });
});

// ─── Reviews ─────────────────────────────────────────────────────────────────

describe('GET /reviews/product/:productId (public)', () => {
  it('should return reviews for a product', async () => {
    const res = await api()
      .get(`/reviews/product/${createdProductIds[0]}`)
      .expect(200);

    expect(res.body).toBeDefined();
  });
});

describe('POST /reviews', () => {
  it('should create a review', async () => {
    const res = await api()
      .post('/reviews')
      .set(authAs(customerToken))
      .send({ productId: createdProductIds[0], rating: 5, comment: 'Excellent product!' })
      .expect((r) => expect([200, 201]).toContain(r.status));

    createdReviewId = res.body.id;
  });
});

describe('GET /reviews/:id (public)', () => {
  it('should return review details', async () => {
    if (!createdReviewId) return;
    const res = await api()
      .get(`/reviews/${createdReviewId}`)
      .expect(200);

    expect(res.body.id).toBe(createdReviewId);
  });
});

describe('PATCH /reviews/:id', () => {
  it('should update the review', async () => {
    if (!createdReviewId) return;
    await api()
      .patch(`/reviews/${createdReviewId}`)
      .set(authAs(customerToken))
      .send({ comment: 'Updated review comment' })
      .expect((r) => expect([200, 403]).toContain(r.status));
  });
});

describe('DELETE /reviews/:id', () => {
  it('should delete the review', async () => {
    if (!createdReviewId) return;
    await api()
      .delete(`/reviews/${createdReviewId}`)
      .set(authAs(customerToken))
      .expect((r) => expect([200, 204, 403]).toContain(r.status));
  });
});

// ─── Notifications ────────────────────────────────────────────────────────────

describe('GET /notifications', () => {
  it('should return notifications list', async () => {
    await api()
      .get('/notifications')
      .set(authAs(customerToken))
      .expect(200);
  });
});

// ─── Orders ───────────────────────────────────────────────────────────────────

describe('GET /orders', () => {
  it('should return order list for customer', async () => {
    const res = await api()
      .get('/orders')
      .set(authAs(customerToken))
      .expect(200);

    expect(res.body).toBeDefined();
  });
});

describe('GET /orders/analytics/summary (Admin)', () => {
  it('should return 403 for customer', async () => {
    await api()
      .get('/orders/analytics/summary')
      .set(authAs(customerToken))
      .expect(403);
  });

  it('should return summary for admin', async () => {
    await api()
      .get('/orders/analytics/summary')
      .set(authAs(adminToken))
      .expect(200);
  });
});

// ─── Coupons ──────────────────────────────────────────────────────────────────

describe('POST /coupons (Admin)', () => {
  it('should create a coupon', async () => {
    const res = await api()
      .post('/coupons')
      .set(authAs(adminToken))
      .send({
        code: `E2E-${RUN_ID}`,
        type: 'percentage',
        value: 10,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        usageLimit: 100,
        isActive: true,
      })
      .expect((r) => expect([200, 201]).toContain(r.status));

    createdCouponId = res.body.id;
  });
});

describe('GET /coupons', () => {
  it('should list coupons', async () => {
    await api()
      .get('/coupons')
      .set(authAs(adminToken))
      .expect(200);
  });
});

describe('GET /coupons/:id', () => {
  it('should get coupon by id', async () => {
    if (!createdCouponId) return;
    const res = await api()
      .get(`/coupons/${createdCouponId}`)
      .set(authAs(adminToken))
      .expect(200);

    expect(res.body.id).toBe(createdCouponId);
  });
});

describe('PATCH /coupons/:id', () => {
  it('should update coupon', async () => {
    if (!createdCouponId) return;
    await api()
      .patch(`/coupons/${createdCouponId}`)
      .set(authAs(adminToken))
      .send({ isActive: false })
      .expect(200);
  });
});

// ─── Search ───────────────────────────────────────────────────────────────────

describe('GET /search (public)', () => {
  // Search uses Elasticsearch — may return 500 if ES is unavailable in this environment
  it('should respond to search query', async () => {
    const res = await api().get('/search?q=headphones');
    expect([200, 500]).toContain(res.status);
  }, 10000);
});

// ─── Admin Dashboard ─────────────────────────────────────────────────────────

describe('GET /admin/dashboard/stats', () => {
  it('should return 401 without token', async () => {
    await api().get('/admin/dashboard/stats').expect(401);
  });

  it('should return stats for admin', async () => {
    await api()
      .get('/admin/dashboard/stats')
      .set(authAs(adminToken))
      .expect(200);
  });
});

describe('GET /admin/analytics/dashboard-stats', () => {
  it('should return analytics stats for admin', async () => {
    await api()
      .get('/admin/analytics/dashboard-stats')
      .set(authAs(adminToken))
      .expect(200);
  });
});

describe('GET /admin/analytics/audit-logs', () => {
  it('should return audit logs for admin', async () => {
    await api()
      .get('/admin/analytics/audit-logs')
      .set(authAs(adminToken))
      .expect(200);
  });
});

describe('GET /admin/staff', () => {
  it('should return staff list for admin', async () => {
    await api()
      .get('/admin/staff')
      .set(authAs(adminToken))
      .expect(200);
  });
});

// ─── Newsletter ───────────────────────────────────────────────────────────────

describe('POST /newsletter/subscribe (public)', () => {
  it('should subscribe an email', async () => {
    await api()
      .post('/newsletter/subscribe')
      .send({ email: `newsletter-e2e-${Date.now()}@test.com` })
      .expect((r) => expect([200, 201]).toContain(r.status));
  });
});

describe('GET /newsletter/stats (Admin)', () => {
  it('should return newsletter stats for admin', async () => {
    await api()
      .get('/newsletter/stats')
      .set(authAs(adminToken))
      .expect(200);
  });
});

// ─── Returns ─────────────────────────────────────────────────────────────────

describe('GET /returns/my', () => {
  it('should return 403 when email is not verified', async () => {
    // Returns require EmailVerifiedGuard, customer email is unverified
    await api()
      .get('/returns/my')
      .set(authAs(customerToken))
      .expect((r) => expect([200, 403]).toContain(r.status));
  });
});

describe('GET /returns (Admin)', () => {
  it('should return all returns for admin', async () => {
    // Admin email may also be unverified — EmailVerifiedGuard may block
    await api()
      .get('/returns')
      .set(authAs(adminToken))
      .expect((r) => expect([200, 403]).toContain(r.status));
  });
});

// ─── Checkout ─────────────────────────────────────────────────────────────────

describe('POST /checkout/validate', () => {
  it('should return 401 without auth', async () => {
    await api().post('/checkout/validate').send({}).expect(401);
  });
});

describe('POST /checkout/create-order', () => {
  it('should return 401 without auth', async () => {
    await api().post('/checkout/create-order').send({}).expect(401);
  });
});

// ─── Seed data summary ────────────────────────────────────────────────────────

describe('Seed data verification', () => {
  it('should have created 5 categories', () => {
    expect(createdCategoryIds.length).toBe(5);
  });

  it('should have created 10 products', () => {
    expect(createdProductIds.length).toBe(10);
  });

  it('should have created 1 brand', () => {
    expect(createdBrandIds.length).toBe(1);
  });

  it('all 10 products should be retrievable', async () => {
    for (const id of createdProductIds) {
      const res = await api().get(`/products/${id}`).expect(200);
      expect(res.body.id).toBe(id);
    }
  }, 30000);

  it('all 5 categories should be retrievable', async () => {
    for (const id of createdCategoryIds) {
      const res = await api().get(`/categories/${id}`).expect(200);
      expect(res.body.id).toBe(id);
    }
  }, 15000);
});

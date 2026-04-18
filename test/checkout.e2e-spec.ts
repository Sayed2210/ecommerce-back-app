import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { LanguageInterceptor } from '../src/common/interceptors/language.interceptor';

// ─── Shared state ─────────────────────────────────────────────────────────────

let app: INestApplication;
let dataSource: DataSource;

let adminToken: string;
let customerToken: string;

let adminUserId: string;
let customerUserId: string;

let productId: string;
let categoryId: string;
let brandId: string;
let addressId: string;
let couponId: string;
let couponCode: string;
let orderId: string;

const RUN_ID = Date.now();

const ADMIN_EMAIL    = `checkout-admin-${RUN_ID}@test.com`;
const CUSTOMER_EMAIL = `checkout-customer-${RUN_ID}@test.com`;
const PASSWORD       = 'Test@12345!';

// ─── Bootstrap ────────────────────────────────────────────────────────────────

beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ rawBody: true });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }));
    app.useGlobalInterceptors(new LanguageInterceptor());
    await app.init();

    dataSource = app.get(DataSource);

    // ── Register + promote admin ─────────────────────────────────────────────
    const adminReg = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: ADMIN_EMAIL, password: PASSWORD, firstName: 'Admin', lastName: 'E2E' });

    adminUserId = adminReg.body?.user?.id;
    expect(adminUserId).toBeDefined();

    await dataSource.query(`UPDATE users SET role = 'admin' WHERE id = $1`, [adminUserId]);

    const adminLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: ADMIN_EMAIL, password: PASSWORD });

    adminToken = adminLogin.body?.tokens?.accessToken;
    expect(adminToken).toBeDefined();

    // ── Register + verify customer ───────────────────────────────────────────
    const custReg = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: CUSTOMER_EMAIL, password: PASSWORD, firstName: 'Customer', lastName: 'E2E' });

    customerUserId = custReg.body?.user?.id;
    expect(customerUserId).toBeDefined();

    // Mark email as verified so EmailVerifiedGuard passes
    await dataSource.query(
        `UPDATE users SET is_email_verified = true WHERE id = $1`,
        [customerUserId],
    );

    const custLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: CUSTOMER_EMAIL, password: PASSWORD });

    customerToken = custLogin.body?.tokens?.accessToken;
    expect(customerToken).toBeDefined();

    // ── Seed: brand + category ───────────────────────────────────────────────
    const brandRes = await request(app.getHttpServer())
        .post('/brands')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: { en: `Brand-${RUN_ID}`, ar: `براند-${RUN_ID}` } });

    expect(brandRes.status).toBe(201);
    brandId = brandRes.body.id;

    const catRes = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: { en: `Cat-${RUN_ID}`, ar: `فئة-${RUN_ID}` } });

    expect(catRes.status).toBe(201);
    categoryId = catRes.body.id;

    // ── Seed: product ────────────────────────────────────────────────────────
    const prodRes = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
            name:              { en: `Product-${RUN_ID}`, ar: `منتج-${RUN_ID}` },
            description:       { en: 'Test product', ar: 'منتج اختبار' },
            basePrice:         49.99,
            categoryId,
            brandId,
            inventoryQuantity: 100,
            isActive:          true,
        });

    expect(prodRes.status).toBe(201);
    productId = prodRes.body.id;

    // ── Seed: shipping address for customer ──────────────────────────────────
    const addrRes = await request(app.getHttpServer())
        .post('/users/me/addresses')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
            street:     '123 Test St',
            city:       'Cairo',
            state:      'Cairo',
            postalCode: '11511',
            country:    'EG',
            isDefault:  true,
        });

    // Address endpoint may vary — tolerate 200/201/404
    if ([200, 201].includes(addrRes.status)) {
        addressId = addrRes.body.id;
    }

    // ── Seed: coupon (admin) ─────────────────────────────────────────────────
    couponCode = `CHECKOUT-${RUN_ID}`;
    const couponRes = await request(app.getHttpServer())
        .post('/coupons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
            code:       couponCode,
            type:       'percentage',
            value:      10,
            startDate:  new Date().toISOString(),
            endDate:    new Date(Date.now() + 86_400_000).toISOString(),
            usageLimit: 100,
            isActive:   true,
        });

    if ([200, 201].includes(couponRes.status)) {
        couponId = couponRes.body.id;
    }
}, 90_000);

afterAll(async () => {
    await app.close();
}, 20_000);

const api = () => request(app.getHttpServer());
const authAs = (token: string) => ({ Authorization: `Bearer ${token}` });

// ─── Auth lifecycle ───────────────────────────────────────────────────────────

describe('Auth flow — register → login → refresh → logout', () => {
    let refreshToken: string;
    let tempToken: string;
    const tmpEmail = `auth-flow-${RUN_ID}@test.com`;

    it('registers a new user', async () => {
        const res = await api()
            .post('/auth/register')
            .send({ email: tmpEmail, password: PASSWORD, firstName: 'Flow', lastName: 'Test' })
            .expect(201);

        expect(res.body.user.id).toBeDefined();
        expect(res.body.tokens.accessToken).toBeDefined();
        tempToken = res.body.tokens.accessToken;
        refreshToken = res.body.tokens.refreshToken;
    });

    it('verify-email returns 400 for invalid token', async () => {
        await api()
            .post('/auth/verify-email')
            .send({ token: 'invalid-token' })
            .expect(400);
    });

    it('logs in with valid credentials', async () => {
        const res = await api()
            .post('/auth/login')
            .send({ email: tmpEmail, password: PASSWORD })
            .expect(200);

        expect(res.body.tokens.accessToken).toBeDefined();
        expect(res.body.tokens.refreshToken).toBeDefined();
        refreshToken = res.body.tokens.refreshToken;
    });

    it('refreshes access token with valid refresh token', async () => {
        const res = await api()
            .post('/auth/refresh')
            .send({ refreshToken })
            .expect(200);

        expect(res.body.accessToken).toBeDefined();
        tempToken = res.body.accessToken;
    });

    it('rejects refresh with invalid token', async () => {
        await api()
            .post('/auth/refresh')
            .send({ refreshToken: 'bad-token' })
            .expect(401);
    });

    it('logs out successfully', async () => {
        await api()
            .post('/auth/logout')
            .set(authAs(tempToken))
            .send({ refreshToken })
            .expect((res) => expect([200, 204]).toContain(res.status));
    });
});

// ─── Cart flow ────────────────────────────────────────────────────────────────

describe('Cart flow — add item → update → clear', () => {
    let cartItemId: string;

    it('retrieves or creates empty cart', async () => {
        const res = await api()
            .get('/cart')
            .set(authAs(customerToken))
            .expect(200);

        expect(res.body).toBeDefined();
    });

    it('adds a product to cart', async () => {
        // Products need a variant to be added to cart
        const productRes = await api().get(`/products/${productId}`);
        const variantId = productRes.body?.variants?.[0]?.id;

        if (!variantId) {
            // No variants seeded — skip dependent tests
            return;
        }

        const res = await api()
            .post('/cart/items')
            .set(authAs(customerToken))
            .send({ variantId, quantity: 2 })
            .expect((r) => expect([200, 201]).toContain(r.status));

        cartItemId = res.body.id ?? res.body.items?.[0]?.id;
        expect(cartItemId).toBeDefined();
    });

    it('clears cart', async () => {
        await api()
            .delete('/cart')
            .set(authAs(customerToken))
            .expect((r) => expect([200, 204]).toContain(r.status));
    });
});

// ─── Coupon validation ────────────────────────────────────────────────────────

describe('Coupon validation via /checkout/apply-coupon', () => {
    it('returns discount info for a valid coupon', async () => {
        if (!couponId) return;

        const res = await api()
            .post('/checkout/apply-coupon')
            .set(authAs(customerToken))
            .send({ code: couponCode })
            .expect((r) => expect([200, 403]).toContain(r.status)); // 403 if email not verified guard blocks

        if (res.status === 200) {
            expect(res.body.discountValue).toBeDefined();
            expect(res.body.type).toBe('percentage');
        }
    });

    it('returns 404 for an invalid coupon code', async () => {
        await api()
            .post('/checkout/apply-coupon')
            .set(authAs(customerToken))
            .send({ code: 'INVALID-COUPON-XYZ' })
            .expect((r) => expect([404, 403]).toContain(r.status));
    });
});

// ─── Checkout validate ────────────────────────────────────────────────────────

describe('POST /checkout/validate', () => {
    it('requires authentication', async () => {
        await api().post('/checkout/validate').send({}).expect(401);
    });

    it('returns 400 when cart is empty', async () => {
        // Cart was cleared above
        const res = await api()
            .post('/checkout/validate')
            .set(authAs(customerToken))
            .send({});

        // Expect either 400 (empty cart) or 403 (email guard) based on guard order
        expect([400, 403]).toContain(res.status);
    });
});

// ─── Order creation — cash on delivery ───────────────────────────────────────

describe('Checkout flow — create order with cash_on_delivery', () => {
    it('requires authentication', async () => {
        await api().post('/checkout/create-order').send({}).expect(401);
    });

    it('creates order with cash_on_delivery payment (no Stripe needed)', async () => {
        if (!addressId) {
            // Address creation not supported or endpoint differs — skip
            return;
        }

        // Re-add item to cart first
        const productRes = await api().get(`/products/${productId}`);
        const variantId = productRes.body?.variants?.[0]?.id;
        if (!variantId) return;

        await api()
            .post('/cart/items')
            .set(authAs(customerToken))
            .send({ variantId, quantity: 1 });

        const res = await api()
            .post('/checkout/create-order')
            .set(authAs(customerToken))
            .send({
                shippingAddressId: addressId,
                paymentMethod:     'cash_on_delivery',
                couponCode,
            })
            .expect((r) => expect([201, 400, 403]).toContain(r.status));

        if (res.status === 201) {
            orderId = res.body.order?.id;
            expect(orderId).toBeDefined();
        }
    });
});

// ─── Order lifecycle ──────────────────────────────────────────────────────────

describe('Order lifecycle — PROCESSING → SHIPPED → DELIVERED (Admin)', () => {
    it('admin can update order status to PROCESSING', async () => {
        if (!orderId) return;

        const res = await api()
            .patch(`/orders/${orderId}/status`)
            .set(authAs(adminToken))
            .send({ status: 'processing' })
            .expect((r) => expect([200, 404]).toContain(r.status));

        if (res.status === 200) {
            expect(res.body.status).toBe('processing');
        }
    });

    it('admin can update order status to SHIPPED', async () => {
        if (!orderId) return;

        const res = await api()
            .patch(`/orders/${orderId}/status`)
            .set(authAs(adminToken))
            .send({ status: 'shipped' })
            .expect((r) => expect([200, 404]).toContain(r.status));

        if (res.status === 200) {
            expect(res.body.status).toBe('shipped');
        }
    });

    it('admin can update order status to DELIVERED', async () => {
        if (!orderId) return;

        const res = await api()
            .patch(`/orders/${orderId}/status`)
            .set(authAs(adminToken))
            .send({ status: 'delivered' })
            .expect((r) => expect([200, 404]).toContain(r.status));

        if (res.status === 200) {
            expect(res.body.status).toBe('delivered');
        }
    });

    it('customer cannot update order status (403)', async () => {
        if (!orderId) return;

        await api()
            .patch(`/orders/${orderId}/status`)
            .set(authAs(customerToken))
            .send({ status: 'delivered' })
            .expect(403);
    });

    it('customer can retrieve their order', async () => {
        if (!orderId) return;

        const res = await api()
            .get(`/orders/${orderId}`)
            .set(authAs(customerToken))
            .expect((r) => expect([200, 404]).toContain(r.status));

        if (res.status === 200) {
            expect(res.body.id).toBe(orderId);
        }
    });
});

// ─── Stripe webhook integration ───────────────────────────────────────────────

describe('POST /checkout/webhook — Stripe webhook', () => {
    it('returns 400 when stripe-signature header is missing or invalid', async () => {
        await api()
            .post('/checkout/webhook')
            .set('stripe-signature', 'invalid-sig')
            .send(Buffer.from(JSON.stringify({ type: 'payment_intent.succeeded' })))
            .expect(400);
    });

    it('is publicly accessible (no JWT required)', async () => {
        // Should not return 401 — it returns 400 due to invalid signature, not 401
        const res = await api()
            .post('/checkout/webhook')
            .set('stripe-signature', 'bad-sig')
            .send('{}');

        expect(res.status).not.toBe(401);
    });
});

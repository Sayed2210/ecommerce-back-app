import * as fs from 'fs';
import * as path from 'path';
import { compile } from 'handlebars';

/**
 * Compile-time tests for all email templates.
 * These do NOT send any email — they only verify that:
 *   1. The template file exists on disk
 *   2. The template compiles without syntax errors
 *   3. The template renders with representative data without throwing
 */

const templatesDir = path.join(process.cwd(), 'templates', 'emails');

const commonData = {
  appName: 'Test Store',
  supportEmail: 'support@test.com',
  year: 2026,
  logoUrl: '',
};

function render(templateName: string, data: Record<string, any>): string {
  const templatePath = path.join(templatesDir, `${templateName}.hbs`);
  const source = fs.readFileSync(templatePath, 'utf8');
  const template = compile(source);
  return template({ ...commonData, ...data });
}

describe('Email templates — compile and render', () => {
  describe('order-confirmation', () => {
    it('renders with order data', () => {
      const html = render('order-confirmation', {
        orderNumber: 'ORD-001',
        total: '99.99',
        items: [
          {
            productName: 'Blue T-Shirt',
            variantName: 'M / Blue',
            quantity: 2,
            unitPrice: '29.99',
          },
          {
            productName: 'Black Hoodie',
            variantName: null,
            quantity: 1,
            unitPrice: '40.01',
          },
        ],
        shippingAddress: {
          streetAddress: '123 Main St',
          city: 'Cairo',
          state: null,
          postalCode: '11511',
          country: 'Egypt',
        },
      });
      expect(html).toContain('ORD-001');
      expect(html).toContain('Blue T-Shirt');
      expect(html).toContain('99.99');
      expect(html).toContain('123 Main St');
    });
  });

  describe('password-reset', () => {
    it('renders with reset data', () => {
      const html = render('password-reset', {
        name: 'Ahmed',
        resetUrl: 'https://example.com/reset?token=abc123',
        expiresIn: '1 hour',
      });
      expect(html).toContain('Ahmed');
      // Handlebars HTML-encodes '=' as '&#x3D;' in double-brace expressions — correct browser behaviour
      expect(html).toContain('https://example.com/reset?token&#x3D;abc123');
      expect(html).toContain('1 hour');
    });
  });

  describe('verification', () => {
    it('renders with verification url', () => {
      const html = render('verification', {
        name: 'Sara',
        url: 'https://example.com/verify?token=xyz789',
      });
      expect(html).toContain('Sara');
      expect(html).toContain('https://example.com/verify?token&#x3D;xyz789');
    });
  });

  describe('welcome', () => {
    it('renders with subscriber name', () => {
      const html = render('welcome', { name: 'Mohamed' });
      expect(html).toContain('Mohamed');
      expect(html).toContain('Test Store');
    });
  });

  describe('newsletter', () => {
    it('renders with campaign content', () => {
      const html = render('newsletter', {
        subject: 'Summer Sale',
        content: '<p>Up to 50% off!</p>',
        name: 'Layla',
        unsubscribeUrl: 'https://example.com/unsubscribe?token=tok',
      });
      expect(html).toContain('Up to 50% off!');
      expect(html).toContain('Layla');
      expect(html).toContain('Unsubscribe');
    });
  });

  describe('order-shipped', () => {
    it('renders with tracking info', () => {
      const html = render('order-shipped', {
        orderNumber: 'ORD-002',
        carrier: 'FedEx',
        trackingNumber: '1Z999AA10123456784',
      });
      expect(html).toContain('ORD-002');
      expect(html).toContain('FedEx');
      expect(html).toContain('1Z999AA10123456784');
    });
  });

  describe('abandoned-cart', () => {
    it('renders with cart items', () => {
      const html = render('abandoned-cart', {
        name: 'Omar',
        cartItems: [
          {
            variant: {
              product: { name: { en: 'Running Shoes' } },
              name: 'Size 42',
            },
            quantity: 1,
          },
        ],
        cartTotal: '89.99',
        recoveryUrl: 'https://example.com/cart?recovery=cart-id-1',
      });
      expect(html).toContain('Omar');
      expect(html).toContain('Running Shoes');
      expect(html).toContain('89.99');
    });

    it('renders without cart items', () => {
      const html = render('abandoned-cart', {
        name: 'Omar',
        cartItems: [],
        cartTotal: '0',
        recoveryUrl: 'https://example.com/cart',
      });
      expect(html).toContain('Omar');
    });
  });

  describe('abandoned-cart-followup', () => {
    it('renders with discount code', () => {
      const html = render('abandoned-cart-followup', {
        userName: 'Nour',
        cartItems: [
          {
            variant: { product: { name: { en: 'Leather Bag' } }, name: null },
            quantity: 1,
          },
        ],
        cartTotal: '150.00',
        discountCode: 'COMEBACK10',
        recoveryLink: 'https://example.com/cart?recovery=cart-id-2',
      });
      expect(html).toContain('Nour');
      expect(html).toContain('COMEBACK10');
      expect(html).toContain('150.00');
    });
  });

  describe('low-stock-alert', () => {
    it('renders with stock data', () => {
      const html = render('low-stock-alert', {
        productName: 'Blue T-Shirt (M)',
        sku: 'TSH-BLU-M',
        currentStock: 3,
        threshold: 10,
      });
      expect(html).toContain('TSH-BLU-M');
      expect(html).toContain('3');
    });
  });
});

import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService, AccountProfile } from '../account/auth-service';
import { CheckoutService, OrderReceipt } from './checkout-service';
import { CartStore } from './cart-store';
import { apiConfig } from '../api.config';

describe('CheckoutService', () => {
  let service: CheckoutService;
  let cart: CartStore;
  let http: HttpTestingController;
  const user = signal<AccountProfile | null>(null);
  const receipt: OrderReceipt = { orderId: 17, orderDate: '2026-10-16T12:00:00Z', status: 'Pending', recipientName: 'Demo', shippingAddress: 'Example street', lines: [{ productId: 1, name: 'Oranges', quantity: 1, unitPrice: 3.49, lineTotal: 3.49 }], subtotal: 3.49, currency: 'USD' };
  beforeEach(() => {
    user.set({ userId: 1, userName: 'demo', customerId: 1, name: 'Demo', email: 'demo@example.test', phone: null });
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: AuthService, useValue: { user } }] });
    service = TestBed.inject(CheckoutService); cart = TestBed.inject(CartStore); http = TestBed.inject(HttpTestingController);
    TestBed.tick();
    cart.add({ productId: 1, name: 'Oranges', price: 3.49, weightKg: 1 });
    cart.saveCustomer({ name: 'Demo', email: 'demo@example.test', phone: '', recipientName: 'Demo', shippingAddress: 'Example street' });
  });
  afterEach(() => http.verify());
  async function begin() {
    const done = service.place();
    http.expectOne(apiConfig.baseUrl + '/api/auth/csrf').flush({ requestToken: 'test-csrf' });
    await Promise.resolve();
    return { done, request: http.expectOne(apiConfig.baseUrl + '/api/orders') };
  }
  it('sends no caller identity, uses CSRF/cookies, and clears only after success', async () => {
    const { done, request } = await begin();
    expect(request.request.body.customerId).toBeUndefined();
    expect(request.request.body.userId).toBeUndefined();
    expect(request.request.headers.get('X-CSRF-TOKEN')).toBe('test-csrf');
    expect(request.request.withCredentials).toBe(true);
    expect(cart.itemCount()).toBe(1); expect(cart.checkoutLocked()).toBe(true);
    request.flush(receipt); await done;
    expect(service.receipt()?.orderId).toBe(17); expect(cart.itemCount()).toBe(0); expect(cart.checkoutLocked()).toBe(false);
  });
  it('blocks double-click and edits while submitting', async () => {
    const { done, request } = await begin();
    await service.place();
    http.expectNone(apiConfig.baseUrl + '/api/auth/csrf');
    expect(cart.setQuantity(1, 2)).toBe(false);
    expect(cart.add({ productId: 2, name: 'Apples', price: 1, weightKg: 1 })).toBe(false);
    request.flush(receipt); await done;
  });
  it('keeps the same submission ID after an unknown server outcome', async () => {
    const first = await begin();
    const requestId = first.request.request.body.requestId;
    first.request.flush({}, { status: 503, statusText: 'Unavailable' }); await first.done;
    expect(service.uncertain()).toBe(true); expect(cart.itemCount()).toBe(1); expect(cart.checkoutLocked()).toBe(true);
    const retry = await begin(); expect(retry.request.request.body.requestId).toBe(requestId);
    retry.request.flush(receipt); await retry.done;
    expect(service.uncertain()).toBe(false); expect(cart.itemCount()).toBe(0);
  });
  it('requires an explicit price update before sending revised prices', async () => {
    const first = await begin(); const oldId = first.request.request.body.requestId;
    first.request.flush({ code: 'price_changed', lines: [{ productId: 1, name: 'Oranges', quantity: 1, unitPrice: 3.99, lineTotal: 3.99 }] }, { status: 409, statusText: 'Conflict' }); await first.done;
    expect(cart.subtotalCents()).toBe(349); expect(service.receipt()).toBeNull();
    service.useLatestPrices(); expect(cart.subtotalCents()).toBe(399);
    const retry = await begin(); expect(retry.request.request.body.requestId).not.toBe(oldId);
    expect(retry.request.request.body.items[0].expectedUnitPrice).toBe(3.99);
    retry.request.flush({ ...receipt, subtotal: 3.99 }); await retry.done;
  });
  it('does not submit when signed out', async () => {
    user.set(null); TestBed.tick(); await service.place();
    http.expectNone(apiConfig.baseUrl + '/api/auth/csrf'); expect(service.error()).toContain('Sign in');
  });
  it('does not expose a completed receipt after the user signs out mid-request', async () => {
    const { done, request } = await begin();
    user.set(null); TestBed.tick(); request.flush(receipt); await done;
    expect(service.receipt()).toBeNull(); expect(cart.checkoutLocked()).toBe(false);
  });
  it('reports missing migration without clearing or freezing the cart', async () => {
    const { done, request } = await begin();
    request.flush({ code: 'checkout_not_ready' }, { status: 503, statusText: 'Unavailable' }); await done;
    expect(service.error()).toContain('migration 004'); expect(service.uncertain()).toBe(false); expect(cart.itemCount()).toBe(1);
  });
});

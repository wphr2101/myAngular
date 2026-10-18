import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth-service';
import { CartStore } from '../shopping/cart-store';
import { apiConfig } from '../api.config';

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;
  const url = apiConfig.baseUrl + '/api/auth';
  const profile = { userId: 1, userName: 'demo', customerId: 1, name: 'Demo', email: 'demo@example.test', phone: null };
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    auth = TestBed.inject(AuthService); http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  function login() {
    auth.login('demo', 'test-only long passphrase').subscribe();
    const csrf = http.expectOne(url + '/csrf');
    expect(csrf.request.withCredentials).toBe(true);
    csrf.flush({ requestToken: 'csrf-test-token' });
    const request = http.expectOne(url + '/login');
    expect(request.request.headers.get('X-CSRF-TOKEN')).toBe('csrf-test-token');
    expect(request.request.withCredentials).toBe(true);
    request.flush(profile);
  }
  it('logs in with CSRF and cookies, without persisting credentials in browser storage', () => {
    const write = vi.spyOn(Storage.prototype, 'setItem');
    login(); expect(auth.user()).toEqual(profile); expect(write).not.toHaveBeenCalled();
    write.mockRestore();
  });
  it('loads the current profile through credentials', () => {
    auth.refresh().subscribe();
    expect(auth.checking()).toBe(true);
    const request = http.expectOne(url + '/me'); expect(request.request.withCredentials).toBe(true);
    request.flush(profile); expect(auth.user()).toEqual(profile); expect(auth.checking()).toBe(false);
  });
  it('treats anonymous 401 as signed out, but shows service failures', () => {
    auth.refresh().subscribe(); http.expectOne(url + '/me').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.user()).toBeNull(); expect(auth.sessionError()).toBe('');
    auth.refresh().subscribe(); http.expectOne(url + '/me').flush({}, { status: 503, statusText: 'Unavailable' });
    expect(auth.sessionError()).toContain('unavailable');
  });
  it('clears personal drafts and cart after logout and requests a fresh CSRF token', () => {
    login();
    const cart = TestBed.inject(CartStore);
    cart.add({ productId: 1, name: 'Oranges', price: 3.49, weightKg: 1 });
    cart.saveCustomer({ name: 'Demo', email: 'demo@example.test', phone: '', recipientName: 'Demo', shippingAddress: 'Example street' });
    auth.logout().subscribe();
    http.expectOne(url + '/csrf').flush({ requestToken: 'fresh-token' });
    const request = http.expectOne(url + '/logout'); expect(request.request.headers.get('X-CSRF-TOKEN')).toBe('fresh-token');
    request.flush(null);
    expect(auth.user()).toBeNull(); expect(cart.customer()).toBeNull(); expect(cart.itemCount()).toBe(0);
  });
  it('does not falsely sign out when the logout request fails', () => {
    login(); auth.logout().subscribe({ error: () => {} });
    http.expectOne(url + '/csrf').flush({}, { status: 503, statusText: 'Unavailable' });
    expect(auth.user()).toEqual(profile);
  });
  it('does not post credentials if the CSRF request fails', () => {
    auth.login('demo', 'test-only passphrase').subscribe({ error: () => {} });
    http.expectOne(url + '/csrf').flush({}, { status: 503, statusText: 'Unavailable' });
    http.expectNone(url + '/login'); expect(auth.user()).toBeNull();
  });
});

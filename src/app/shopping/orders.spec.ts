import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { Orders } from './orders';
import { AuthService, AccountProfile } from '../account/auth-service';
import { apiConfig } from '../api.config';

describe('Orders', () => {
  let fixture: ComponentFixture<Orders>;
  let http: HttpTestingController;
  const user = signal<AccountProfile | null>(null);
  const checking = signal(false);
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let query: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  const profile = { userId: 1, userName: 'demo', customerId: 1, name: 'Demo', email: 'demo@example.test', phone: null };
  const summary = { orderId: 7, orderDate: '2026-10-17T14:00:00Z', status: 'Pending', itemCount: 2, subtotal: 6.98, currency: 'USD' };
  const receipt = { ...summary, recipientName: 'Demo', shippingAddress: 'Example street', lines: [{ productId: 1, name: 'Oranges', quantity: 2, unitPrice: 3.49, lineTotal: 6.98 }] };
  const url = apiConfig.baseUrl + '/api/orders';
  const render = () => { fixture.detectChanges(); TestBed.tick(); fixture.detectChanges(); };
  beforeEach(() => {
    user.set(profile); checking.set(false);
    params = new BehaviorSubject(convertToParamMap({})); query = new BehaviorSubject(convertToParamMap({}));
    TestBed.configureTestingModule({ imports: [Orders], providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
      { provide: AuthService, useValue: { user, checking, sessionError: signal(''), refresh: () => of(null) } },
      { provide: ActivatedRoute, useValue: { paramMap: params, queryParamMap: query, snapshot: { paramMap: params.value, queryParamMap: query.value } } },
    ] });
    fixture = TestBed.createComponent(Orders); http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => { fixture.destroy(); http.verify(); });
  it('loads private history with cookies and links to the saved order', () => {
    render(); const request = http.expectOne(url);
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.headers.has('X-API-Key')).toBe(false);
    request.flush({ items: [summary], hasMore: false }); render();
    expect(fixture.nativeElement.textContent).toContain('$6.98');
    expect(fixture.nativeElement.querySelector('a[href="/orders/7"]')).toBeTruthy();
  });
  it('does not request orders for a guest or while checking the session', () => {
    checking.set(true); render(); http.expectNone(url);
    checking.set(false); user.set(null); render(); http.expectNone(url);
    expect(fixture.nativeElement.textContent).toContain('Sign in to view your orders');
  });
  it('shows an empty history', () => {
    render(); http.expectOne(url).flush({ items: [], hasMore: false }); render();
    expect(fixture.nativeElement.textContent).toContain('No orders yet');
  });
  it('loads cursor pages and exposes older navigation', () => {
    query.next(convertToParamMap({ beforeId: '20' })); render();
    http.expectOne(url + '?beforeId=20').flush({ items: [summary], hasMore: true }); render();
    expect(fixture.nativeElement.querySelector('a[href="/orders?beforeId=7"]')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Newest orders');
  });
  it('reloads a detail from the API when the component is recreated', () => {
    params.next(convertToParamMap({ id: '7' })); render();
    http.expectOne(url + '/7').flush(receipt); render();
    expect(fixture.nativeElement.textContent).toContain('Example street');
    fixture.destroy(); fixture = TestBed.createComponent(Orders); render();
    http.expectOne(url + '/7').flush(receipt); render();
    expect(fixture.nativeElement.textContent).toContain('Order #7');
  });
  it('cancels an in-flight request on account change and clears old details on logout', () => {
    params.next(convertToParamMap({ id: '7' })); render(); const old = http.expectOne(url + '/7');
    user.set({ ...profile, userId: 2 }); render(); expect(old.cancelled).toBe(true);
    http.expectOne(url + '/7').flush({}, { status: 404, statusText: 'Not found' }); render();
    expect(fixture.nativeElement.textContent).toContain('Order not found');
    user.set(profile); render(); http.expectOne(url + '/7').flush(receipt); render();
    user.set(null); render(); expect(fixture.nativeElement.textContent).not.toContain('Example street');
  });
  it('offers retry after service errors', () => {
    render(); http.expectOne(url).flush({}, { status: 503, statusText: 'Unavailable' }); render();
    expect(fixture.nativeElement.textContent).toContain('Unable to load orders');
    fixture.nativeElement.querySelector('button').click(); render();
    http.expectOne(url).flush({ items: [summary], hasMore: false }); render();
    expect(fixture.nativeElement.textContent).toContain('Order #7');
  });
  it('shows session expiration without retaining order data', () => {
    render(); http.expectOne(url).flush({}, { status: 401, statusText: 'Unauthorized' }); render();
    expect(fixture.nativeElement.textContent).toContain('session has expired');
  });
  it('rejects malformed detail links without a request', () => {
    params.next(convertToParamMap({ id: '-2' })); render(); http.expectNone(() => true);
    expect(fixture.nativeElement.textContent).toContain('Invalid order link');
  });
});

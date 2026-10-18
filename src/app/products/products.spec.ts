import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Products } from './products';
import { apiConfig, apiRequestOptions } from '../api.config';
import { provideRouter } from '@angular/router';
import { CartStore } from '../shopping/cart-store';

describe('Products', () => {
  let fixture: ComponentFixture<Products>;
  let http: HttpTestingController;
  const url = apiConfig.baseUrl + '/api/products';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Products],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(Products);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });
  afterEach(() => http.verify());

  it('loads and renders the catalog using the existing API options', () => {
    expect(fixture.nativeElement.textContent).toContain('Loading products...');
    expect(fixture.nativeElement.querySelector('button').disabled).toBe(true);
    const request = http.expectOne(url);
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('X-API-Key')).toBe(apiRequestOptions.headers['X-API-Key']);
    request.flush([{ productId: 7, name: 'Parcel box', price: 12.5, weightKg: 0.125 }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Parcel box');
    expect(fixture.nativeElement.textContent).toContain('12.50');
    expect(fixture.nativeElement.textContent).toContain('0.125');
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(1);
  });

  it('shows the empty state', () => {
    http.expectOne(url).flush([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No products yet.');
    expect(fixture.nativeElement.querySelector('table')).toBeNull();
  });

  it('retries after a service failure', () => {
    http.expectOne(url).flush({}, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Unable to load products');
    fixture.nativeElement.querySelector('[role="alert"] button').click();
    fixture.detectChanges();
    http.expectOne(url).flush([{ productId: 1, name: 'Tape', price: 0, weightKg: 0.01 }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Tape');
  });

  it('reports denied access separately', () => {
    http.expectOne(url).flush({}, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Access to the product catalog was denied.');
  });

  it('cancels the pending request when leaving the page', () => {
    const request = http.expectOne(url);
    fixture.destroy();
    expect(request.cancelled).toBe(true);
  });

  it('adds a product to the shared cart and announces it', () => {
    http.expectOne(url).flush([{ productId: 1, name: 'Apples', price: 3.99, weightKg: 1 }]);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button[aria-label="Add Apples to cart"]').click();
    fixture.detectChanges();
    expect(TestBed.inject(CartStore).itemCount()).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Apples added to cart.');
  });
});

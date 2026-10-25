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
    for (const [name, value] of Object.entries(apiRequestOptions.headers)) {
      expect(request.request.headers.get(name)).toBe(value);
    }
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

  it('formats product names while keeping stock separate, including zero stock', () => {
    http.expectOne(url).flush([
      { productId: 1, name: 'Apples - 1 kg bag', price: 3.99, weightKg: 1, stockQuantity: 23 },
      { productId: 2, name: 'Whole Milk - 1 L', price: 2.49, weightKg: 1.03, stockQuantity: 0 },
      { productId: 3, name: 'Parcel box', price: 1, weightKg: 1, stockQuantity: null },
      { productId: 4, name: 'Tape', price: 1, weightKg: 0.1 },
    ]);
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('tbody tr') as NodeListOf<HTMLTableRowElement>;
    expect(rows[0].cells[0].textContent).toContain('Apples (1KG Bag)');
    expect(rows[0].querySelector('small')?.textContent).toBe('Stock: 23');
    expect(rows[1].cells[0].textContent).toContain('Whole Milk (1L)');
    expect(rows[1].querySelector('small')?.textContent).toBe('Stock: 0');
    expect(rows[1].querySelector('button')?.disabled).toBe(true);
    expect(rows[2].querySelector('small')).toBeNull();
    expect(rows[3].querySelector('small')).toBeNull();
  });

  it('keeps the original product name in cart data', () => {
    http.expectOne(url).flush([{ productId: 1, name: 'Apples - 1 kg bag', price: 3.99, weightKg: 1, stockQuantity: 23 }]);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('tbody button').click();
    expect(TestBed.inject(CartStore).lines()[0].name).toBe('Apples - 1 kg bag');
  });

  it('renders names as text, not HTML supplied by a pipe', () => {
    http.expectOne(url).flush([{ productId: 1, name: '<img src=x> - 1 kg bag', price: 1, weightKg: 1 }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('tbody img')).toBeNull();
    expect(fixture.nativeElement.querySelector('tbody td').textContent).toContain('<img src=x> (1KG Bag)');
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

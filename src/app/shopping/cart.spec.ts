import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Cart } from './cart';
import { CartStore } from './cart-store';
import { AuthService } from '../account/auth-service';
import { CheckoutService } from './checkout-service';
import { signal } from '@angular/core';

describe('Cart', () => {
  let fixture: ComponentFixture<Cart>;
  let store: CartStore;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Cart], providers: [provideRouter([]),
      { provide: AuthService, useValue: { user: signal(null), checking: signal(false) } },
      { provide: CheckoutService, useValue: { busy: signal(false), uncertain: signal(false), error: signal(''), receipt: signal(null), updatedPrices: signal([]) } },
    ] }).compileComponents();
    store = TestBed.inject(CartStore);
    fixture = TestBed.createComponent(Cart); fixture.detectChanges();
  });
  it('shows the empty cart', () => {
    expect(fixture.nativeElement.textContent).toContain('Your cart is empty');
  });
  it('updates quantities and totals and restores invalid input', () => {
    store.add({ productId: 1, name: 'Apples', price: 3.99, weightKg: 1 }); fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input');
    input.value = '3'; input.dispatchEvent(new Event('change')); fixture.detectChanges();
    expect(store.subtotalCents()).toBe(1197);
    expect(fixture.nativeElement.textContent).toContain('$11.97');
    input.value = '0'; input.dispatchEvent(new Event('change')); fixture.detectChanges();
    expect(input.value).toBe('3');
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('whole number');
  });
  it('removes the final line and shows empty state', () => {
    store.add({ productId: 1, name: 'Apples', price: 3.99, weightKg: 1 }); fixture.detectChanges();
    fixture.nativeElement.querySelector('button[aria-label="Remove Apples"]').click(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Your cart is empty');
  });
  it('sets the stock-based input maximum and restores quantities above stock', () => {
    store.add({ productId: 1, name: 'Apples', price: 3.99, weightKg: 1, stockQuantity: 23 });
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input.max).toBe('23');
    input.value = '23'; input.dispatchEvent(new Event('change')); fixture.detectChanges();
    expect(store.quantityFor(1)).toBe(23);
    expect(fixture.nativeElement.textContent).toContain('$91.77');
    input.value = '96'; input.dispatchEvent(new Event('change')); fixture.detectChanges();
    expect(input.value).toBe('23');
    expect(store.quantityFor(1)).toBe(23);
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('1 to 23');
    input.value = '22'; input.dispatchEvent(new Event('change')); fixture.detectChanges();
    expect(store.quantityFor(1)).toBe(22);
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });
  it('shows the saved customer without treating it as a login', () => {
    store.add({ productId: 1, name: 'Apples', price: 3.99, weightKg: 1 });
    store.saveCustomer({ name: 'Demo Customer', email: 'demo@example.test', phone: '', recipientName: 'Recipient', shippingAddress: 'Example address' }); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Demo Customer');
    expect(fixture.nativeElement.textContent).toContain('Sign in to place an order');
    expect(fixture.nativeElement.querySelector('.checkout .primary').disabled).toBe(true);
  });
});

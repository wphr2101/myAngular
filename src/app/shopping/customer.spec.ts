import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Customer } from './customer';
import { CartStore } from './cart-store';
import { AccountProfile, AuthService } from '../account/auth-service';
import { signal } from '@angular/core';

describe('Customer', () => {
  let fixture: ComponentFixture<Customer>;
  let store: CartStore;
  const sessionUser = signal<AccountProfile | null>(null);
  beforeEach(async () => {
    sessionUser.set(null);
    await TestBed.configureTestingModule({ imports: [Customer], providers: [provideRouter([]), { provide: AuthService, useValue: { user: sessionUser } }] }).compileComponents();
    store = TestBed.inject(CartStore);
    fixture = TestBed.createComponent(Customer); fixture.detectChanges();
  });
  function fill(selector: string, value: string) {
    const input = fixture.nativeElement.querySelector(selector);
    input.value = value; input.dispatchEvent(new Event('input')); fixture.detectChanges();
  }
  function submit() {
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
  }
  it('prefills a signed-in profile without overwriting an edited form', () => {
    sessionUser.set({ userId: 1, userName: 'demo', customerId: 1, name: 'Demo', email: 'demo@example.test', phone: null });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#customer-name').value).toBe('Demo');
    fill('#customer-name', 'Edited');
    sessionUser.update(user => ({ ...user!, name: 'Updated profile' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#customer-name').value).toBe('Edited');
  });
  it('rejects empty and whitespace-only details', () => {
    fill('#customer-name', '   '); submit();
    expect(store.customer()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Check the highlighted customer details.');
  });
  it('validates email and saves trimmed details in memory', () => {
    fill('#customer-name', ' Demo Customer '); fill('#customer-email', 'invalid');
    fill('#recipient', ' Demo Recipient '); fill('#shipping-address', ' 123 Example Street ');
    submit(); expect(store.customer()).toBeNull();
    fill('#customer-email', 'demo@example.test'); submit();
    expect(store.customer()?.name).toBe('Demo Customer');
    expect(store.customer()?.shippingAddress).toBe('123 Example Street');
    expect(fixture.nativeElement.textContent).toContain('Customer draft saved for this session.');
    fill('#customer-name', 'Edited');
    expect(fixture.nativeElement.textContent).not.toContain('Customer draft saved for this session.');
  });
  it('restores saved values on navigation and clears them explicitly', () => {
    store.saveCustomer({ name: 'Demo', email: 'demo@example.test', phone: '', recipientName: 'Demo', shippingAddress: 'Example street' });
    fixture.destroy(); fixture = TestBed.createComponent(Customer); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#customer-name').value).toBe('Demo');
    fixture.nativeElement.querySelector('button[type="button"]').click(); fixture.detectChanges();
    expect(store.customer()).toBeNull();
    expect(fixture.nativeElement.querySelector('#customer-name').value).toBe('');
  });
});

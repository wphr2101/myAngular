import { CartStore } from './cart-store';

describe('CartStore', () => {
  let store: CartStore;
  const apples = { productId: 1, name: 'Apples', price: 3.99, weightKg: 1 };
  beforeEach(() => { store = new CartStore(); });

  it('merges identical products and calculates totals in cents and grams', () => {
    store.add(apples); store.add(apples);
    store.add({ productId: 2, name: 'Milk', price: 2.49, weightKg: 1.03 });
    expect(store.lines().length).toBe(2);
    expect(store.itemCount()).toBe(3);
    expect(store.subtotalCents()).toBe(1047);
    expect(store.totalWeightKg()).toBe(3.03);
  });
  it('rejects invalid quantities without changing the cart', () => {
    store.add(apples);
    for (const quantity of [0, -1, 1.5, 100, NaN, Infinity]) {
      expect(store.setQuantity(1, quantity)).toBe(false);
    }
    expect(store.quantityFor(1)).toBe(1);
    expect(store.setQuantity(99, 2)).toBe(false);
  });
  it('caps repeated additions and permits quantity edits', () => {
    store.add(apples);
    expect(store.setQuantity(1, 99)).toBe(true);
    expect(store.add(apples)).toBe(false);
    expect(store.setQuantity(1, 2)).toBe(true);
    expect(store.subtotalCents()).toBe(798);
  });
  it('removes and clears items', () => {
    store.add(apples); store.remove(1);
    expect(store.itemCount()).toBe(0);
    store.add(apples); store.clearCart();
    expect(store.subtotalCents()).toBe(0);
    expect(store.totalWeightKg()).toBe(0);
  });
  it('rejects malformed products but allows free products', () => {
    expect(store.add({ ...apples, price: NaN })).toBe(false);
    expect(store.add({ ...apples, price: -1 })).toBe(false);
    expect(store.add({ ...apples, weightKg: 0 })).toBe(false);
    expect(store.add({ ...apples, price: 0 })).toBe(true);
  });
  it('copies customer drafts and keeps them independent from cart clearing', () => {
    const customer = { name: 'Demo', email: 'demo@example.test', phone: '', recipientName: 'Demo', shippingAddress: 'Test address' };
    store.saveCustomer(customer); customer.name = 'Changed'; store.clearCart();
    expect(store.customer()?.name).toBe('Demo');
    store.clearCustomer(); expect(store.customer()).toBeNull();
  });
  it('does not persist draft data into a new session', () => {
    store.add(apples);
    expect(new CartStore().itemCount()).toBe(0);
    expect(new CartStore().customer()).toBeNull();
  });
});

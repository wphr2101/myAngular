import { computed, Injectable, signal } from '@angular/core';
import type { Product } from '../products/products';

export interface CustomerDraft {
  name: string;
  email: string;
  phone: string;
  recipientName: string;
  shippingAddress: string;
}

export interface CartLine {
  readonly productId: number;
  readonly name: string;
  readonly unitPriceCents: number;
  readonly weightGrams: number;
  readonly quantity: number;
  readonly stockQuantity?: number | null;
}

@Injectable({ providedIn: 'root' })
export class CartStore {
  readonly checkoutLocked = signal(false);
  readonly maxQuantity = 99;
  private readonly lineState = signal<readonly CartLine[]>([]);
  private readonly customerState = signal<Readonly<CustomerDraft> | null>(null);
  readonly lines = this.lineState.asReadonly();
  readonly customer = this.customerState.asReadonly();
  readonly itemCount = computed(() => this.lines().reduce((sum, line) => sum + line.quantity, 0));
  readonly subtotalCents = computed(() => this.lines().reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0));
  readonly totalWeightKg = computed(() => this.lines().reduce((sum, line) => sum + line.weightGrams * line.quantity, 0) / 1000);

  quantityFor(productId: number) {
    return this.lines().find(line => line.productId === productId)?.quantity ?? 0;
  }

  quantityLimit(productId: number) {
    const stock = this.lines().find(line => line.productId === productId)?.stockQuantity;
    return Math.min(this.maxQuantity, stock ?? this.maxQuantity);
  }

  add(product: Product): boolean {
    if (this.checkoutLocked()) return false;
    const cents = Math.round(product.price * 100);
    const grams = Math.round(product.weightKg * 1000);
    if (!Number.isInteger(product.productId) || product.productId <= 0 || !product.name.trim() ||
        !Number.isSafeInteger(cents) || cents < 0 || !Number.isSafeInteger(grams) || grams <= 0) return false;
    const existing = this.lines().find(line => line.productId === product.productId);
    const stockQuantity = product.stockQuantity ?? existing?.stockQuantity;
    if (stockQuantity != null && (!Number.isSafeInteger(stockQuantity) || stockQuantity < 0)) return false;
    const quantity = existing?.quantity ?? 0;
    if (quantity >= Math.min(this.maxQuantity, stockQuantity ?? this.maxQuantity)) return false;
    this.lineState.update(lines => quantity
      ? lines.map(line => line.productId === product.productId ? { ...line, quantity: quantity + 1, stockQuantity } : line)
      : [...lines, { productId: product.productId, name: product.name, unitPriceCents: cents, weightGrams: grams, quantity: 1, stockQuantity }]);
    return true;
  }

  setQuantity(productId: number, quantity: number): boolean {
    if (this.checkoutLocked()) return false;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > this.quantityLimit(productId) || !this.quantityFor(productId)) return false;
    this.lineState.update(lines => lines.map(line => line.productId === productId ? { ...line, quantity } : line));
    return true;
  }

  remove(productId: number) {
    if (this.checkoutLocked()) return;
    this.lineState.update(lines => lines.filter(line => line.productId !== productId));
  }

  clearCart() { this.lineState.set([]); }
  updatePrices(prices: { productId: number; unitPrice: number }[]): boolean {
    if (this.checkoutLocked() || prices.length !== this.lines().length || this.lines().some(l => !prices.some(p => p.productId === l.productId)) ||
        prices.some(p => !Number.isSafeInteger(Math.round(p.unitPrice * 100)) || p.unitPrice < 0)) return false;
    this.lineState.update(lines => lines.map(l => ({ ...l, unitPriceCents: Math.round(prices.find(p => p.productId === l.productId)!.unitPrice * 100) })));
    return true;
  }
  saveCustomer(customer: CustomerDraft) { this.customerState.set({ ...customer }); }
  clearCustomer() { this.customerState.set(null); }
}

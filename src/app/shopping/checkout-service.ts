import { effect, inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../account/auth-service';
import { apiConfig, apiRequestOptions } from '../api.config';
import { CartStore } from './cart-store';

export interface OrderLine { productId: number; name: string; quantity: number; unitPrice: number; lineTotal: number; }
export interface OrderReceipt {
  orderId: number; orderDate: string; status: string; recipientName: string; shippingAddress: string;
  lines: OrderLine[]; subtotal: number; currency: string;
  paymentStatus?: string; paidAt?: string|null; shippedAt?: string|null;
}
interface OrderRequest {
  requestId: string; recipientName: string; shippingAddress: string;
  items: { productId: number; quantity: number; expectedUnitPrice: number }[];
}

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly cart = inject(CartStore);
  readonly busy = signal(false);
  readonly uncertain = signal(false);
  readonly error = signal('');
  readonly receipt = signal<OrderReceipt | null>(null);
  readonly updatedPrices = signal<OrderLine[]>([]);
  private attempt: { userId: number; fingerprint: string; request: OrderRequest } | null = null;
  private owner: number | null = null;

  constructor() {
    effect(() => {
      const id = this.auth.user()?.userId ?? null;
      if (id !== this.owner) {
        this.owner = id; this.attempt = null; this.receipt.set(null); this.error.set('');
        this.updatedPrices.set([]); this.uncertain.set(false); this.cart.checkoutLocked.set(this.busy());
      }
    });
  }

  async place() {
    if (this.busy()) return;
    const user = this.auth.user();
    const customer = this.cart.customer();
    if (!user || !customer || !this.cart.lines().length) { this.error.set('Sign in and save delivery details before placing an order.'); return; }
    if (!this.uncertain()) {
      const body = {
        recipientName: customer.recipientName, shippingAddress: customer.shippingAddress,
        items: this.cart.lines().map(l => ({ productId: l.productId, quantity: l.quantity, expectedUnitPrice: l.unitPriceCents / 100 })).sort((a, b) => a.productId - b.productId),
      };
      const fingerprint = JSON.stringify(body);
      if (this.attempt?.fingerprint !== fingerprint || this.attempt.userId !== user.userId)
        this.attempt = { userId: user.userId, fingerprint, request: { ...body, requestId: crypto.randomUUID() } };
    }
    const attempt = this.attempt!;
    this.busy.set(true); this.cart.checkoutLocked.set(true); this.error.set(''); this.updatedPrices.set([]);
    let submitted = false;
    try {
      const options = { ...apiRequestOptions, withCredentials: true };
      const csrf = await firstValueFrom(this.http.get<{ requestToken: string }>(apiConfig.baseUrl + '/api/auth/csrf', options));
      if (this.auth.user()?.userId !== user.userId) return;
      submitted = true;
      const receipt = await firstValueFrom(this.http.post<OrderReceipt>(apiConfig.baseUrl + '/api/orders', attempt.request, {
        ...options, headers: new HttpHeaders(apiRequestOptions.headers).set('X-CSRF-TOKEN', csrf.requestToken),
      }));
      if (this.auth.user()?.userId !== user.userId) return;
      this.receipt.set(receipt); this.cart.clearCart(); this.attempt = null; this.uncertain.set(false);
    } catch (unknownError) {
      if (this.auth.user()?.userId !== user.userId) return;
      const e = unknownError as HttpErrorResponse;
      if (e.status === 409 && e.error?.code === 'price_changed') {
        this.updatedPrices.set(e.error.lines ?? []);
        this.error.set('Prices changed. Review and use the latest prices, then place the order again.');
        this.uncertain.set(false); this.attempt = null;
      } else if (e.error?.code === 'checkout_not_ready') {
        this.error.set('Checkout is not ready. Apply database migration 004 and retry.'); this.uncertain.set(false);
      } else if (e.status === 401 || e.status === 403) {
        this.error.set('Your customer session is unavailable. Sign out and sign in again.'); this.uncertain.set(false);
      } else if (e.status === 400 || e.status === 409) {
        this.error.set(e.error?.code === 'insufficient_stock' ? 'Insufficient stock. Reduce the quantity or wait for a restock.' : e.error?.code === 'product_unavailable' ? 'A product is no longer available. Remove it from the cart.' : 'The order could not be accepted. Check the cart and delivery details.');
        this.uncertain.set(false);
      } else {
        // A lost response may follow a successful commit. Keep the same payload and ID for retries.
        this.uncertain.set(this.uncertain() || submitted);
        this.error.set(this.uncertain() ? 'Order status is unconfirmed. Retry this same submission; do not reload or rebuild the cart.' : 'Unable to contact checkout. Your cart is unchanged. Please retry.');
      }
    } finally {
      this.busy.set(false); this.cart.checkoutLocked.set(this.uncertain());
    }
  }

  useLatestPrices() {
    if (this.busy() || !this.updatedPrices().length) return;
    if (this.cart.updatePrices(this.updatedPrices())) { this.updatedPrices.set([]); this.error.set(''); this.attempt = null; }
  }
}

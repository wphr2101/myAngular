import { Component, effect, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../account/auth-service';
import { apiConfig, apiRequestOptions } from '../api.config';
import { OrderReceipt } from './checkout-service';

interface OrderSummary {
  orderId: number; orderDate: string; status: string; itemCount: number; subtotal: number; currency: string;
  paymentStatus?:string;
}
interface OrderPage { items: OrderSummary[]; hasMore: boolean; }

@Component({
  selector: 'app-orders',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './orders.html',
  styleUrls: ['./shopping.css', './orders.css'],
})
export class Orders {
  protected readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });
  private readonly query = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });
  private readonly revision = signal(0);
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly sessionExpired = signal(false);
  protected readonly page = signal<OrderPage | null>(null);
  protected readonly receipt = signal<OrderReceipt | null>(null);
  protected readonly detail = signal(false);
  protected readonly olderPage = signal(false);

  constructor() {
    effect(onCleanup => {
      const user = this.auth.user();
      const checking = this.auth.checking();
      const id = this.params().get('id');
      const before = this.query().get('beforeId');
      this.revision();
      this.page.set(null); this.receipt.set(null); this.error.set(''); this.sessionExpired.set(false);
      this.loading.set(false); this.detail.set(id !== null); this.olderPage.set(before !== null);
      if (checking || !user) return;
      if ((id !== null && !this.validId(id)) || (before !== null && !this.validId(before))) {
        this.error.set('Invalid order link.'); return;
      }
      this.loading.set(true);
      const url = apiConfig.baseUrl + '/api/orders' + (id ? '/' + id : before ? '?beforeId=' + before : '');
      const subscription = this.http.get<OrderReceipt | OrderPage>(url, { ...apiRequestOptions, withCredentials: true }).subscribe({
        next: data => {
          if (id) this.receipt.set(data as OrderReceipt);
          else this.page.set(data as OrderPage);
          this.loading.set(false);
        },
        error: (e: HttpErrorResponse) => {
          this.loading.set(false);
          this.sessionExpired.set(e.status === 401 || e.status === 403);
          this.error.set(e.status === 404 ? 'Order not found or not available to this account.' :
            e.status === 401 || e.status === 403 ? 'Your session has expired. Please sign in again.' :
            'Unable to load orders. Please try again.');
        },
      });
      // Cancel stale requests on navigation, account changes, and component destruction.
      onCleanup(() => subscription.unsubscribe());
    });
  }
  private validId(value: string) { return /^[1-9]\d*$/.test(value) && Number(value) <= 2147483647; }
  protected retry() { this.revision.update(n => n + 1); }
  protected refreshSession() { this.auth.refresh().subscribe(); }
}

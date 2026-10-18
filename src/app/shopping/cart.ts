import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { AuthService } from '../account/auth-service';
import { CheckoutService } from './checkout-service';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartStore } from './cart-store';

@Component({
  selector: 'app-cart',
  imports: [CurrencyPipe, DatePipe, DecimalPipe, RouterLink],
  templateUrl: './cart.html',
  styleUrl: './shopping.css',
})
export class Cart {
  protected readonly auth = inject(AuthService);
  protected readonly checkout = inject(CheckoutService);
  protected readonly cart = inject(CartStore);
  protected readonly quantityError = signal('');

  protected changeQuantity(productId: number, event: Event) {
    const input = event.target as HTMLInputElement;
    if (!this.cart.setQuantity(productId, input.valueAsNumber)) {
      input.value = String(this.cart.quantityFor(productId));
      this.quantityError.set('Quantity must be a whole number from 1 to 99.');
    } else { this.quantityError.set(''); }
  }

  protected remove(productId: number) { this.cart.remove(productId); this.quantityError.set(''); }
  protected clear() { if (!this.cart.checkoutLocked()) this.cart.clearCart(); this.quantityError.set(''); }
}

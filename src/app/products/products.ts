import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartStore } from '../shopping/cart-store';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { apiConfig, apiRequestOptions } from '../api.config';
import { ProductNamePipe } from './product-name-pipe';

export interface Product {
  productId: number;
  name: string;
  price: number;
  weightKg: number;
  stockQuantity?: number|null;
}

@Component({
  selector: 'app-products',
  imports: [CurrencyPipe, DecimalPipe, RouterLink, ProductNamePipe],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products implements OnInit {
  protected readonly cart = inject(CartStore);
  protected readonly cartMessage = signal('');
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly products = signal<Product[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');

  ngOnInit() {
    this.loadProducts();
  }

  protected addToCart(product: Product) {
    if(product.stockQuantity != null && this.cart.quantityFor(product.productId)>=product.stockQuantity){this.cartMessage.set('Insufficient stock for this quantity.');return;}
    this.cartMessage.set(this.cart.add(product)
      ? `${product.name} added to cart.`
      : 'Unable to add this product. Maximum quantity is 99 per product.');
  }

  protected loadProducts() {
    if (this.isLoading()) return;
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.http.get<Product[]>(apiConfig.baseUrl + '/api/products', apiRequestOptions)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (products) => {
          this.products.set(products);
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(error.status === 401 || error.status === 403
            ? 'Access to the product catalog was denied.'
            : 'Unable to load products. Please try again.');
          this.isLoading.set(false);
        },
      });
  }
}

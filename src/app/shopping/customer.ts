import { Component, effect, inject, signal } from '@angular/core';
import { AuthService } from '../account/auth-service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CartStore } from './cart-store';

@Component({
  selector: 'app-customer',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './customer.html',
  styleUrl: './shopping.css',
})
export class Customer {
  protected readonly auth = inject(AuthService);
  protected readonly cart = inject(CartStore);
  protected readonly saved = signal(false);
  protected readonly submitted = signal(false);
  private readonly draft = this.cart.customer();
  protected readonly form = new FormGroup({
    name: new FormControl(this.draft?.name ?? '', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/), Validators.maxLength(150)] }),
    email: new FormControl(this.draft?.email ?? '', { nonNullable: true, validators: [Validators.required, Validators.email, Validators.maxLength(254)] }),
    phone: new FormControl(this.draft?.phone ?? '', { nonNullable: true, validators: [Validators.maxLength(30)] }),
    recipientName: new FormControl(this.draft?.recipientName ?? '', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/), Validators.maxLength(150)] }),
    shippingAddress: new FormControl(this.draft?.shippingAddress ?? '', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/), Validators.maxLength(500)] }),
  });

  constructor() {
    effect(() => {
      const user = this.auth.user();
      if (user && this.form.pristine && !this.cart.customer()) {
        this.form.patchValue({ name: user.name, email: user.email, phone: user.phone ?? '', recipientName: user.name });
      }
    });
  }

  protected save() {
    if (this.cart.checkoutLocked()) return;
    const values = this.form.getRawValue();
    this.form.setValue({ name: values.name.trim(), email: values.email.trim(), phone: values.phone.trim(), recipientName: values.recipientName.trim(), shippingAddress: values.shippingAddress.trim() });
    this.submitted.set(true);
    this.saved.set(false);
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.cart.saveCustomer(this.form.getRawValue());
    this.form.markAsPristine();
    this.saved.set(true);
  }

  protected clear() {
    if (this.cart.checkoutLocked()) return;
    this.cart.clearCustomer();
    this.form.reset({ name: '', email: '', phone: '', recipientName: '', shippingAddress: '' });
    this.saved.set(false);
    this.submitted.set(false);
  }
}

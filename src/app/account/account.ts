import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from './auth-service';

@Component({
  selector: 'app-account',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './account.html',
  styleUrl: './account.css',
})
export class Account {
  protected readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly mode = signal<'login' | 'register'>('login');
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly message = signal('');
  protected readonly loginForm = new FormGroup({
    userName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(128)] }),
  });
  protected readonly registerForm = new FormGroup({
    userName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^[A-Za-z0-9_.-]{3,100}$/)] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(15), Validators.maxLength(128)] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/\S/), Validators.maxLength(150)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email, Validators.maxLength(254)] }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(30)] }),
  });

  protected choose(mode: 'login' | 'register') {
    this.mode.set(mode); this.error.set(''); this.message.set('');
    this.loginForm.controls.password.reset(); this.registerForm.controls.password.reset();
  }
  protected submit() {
    if (this.busy() || this.auth.checking()) return;
    const registering = this.mode() === 'register';
    const form = registering ? this.registerForm : this.loginForm;
    if (form.invalid) { form.markAllAsTouched(); this.error.set('Check the required fields and password length.'); return; }
    this.busy.set(true); this.error.set(''); this.message.set('');
    const values = this.registerForm.getRawValue();
    const request: Observable<unknown> = registering
      ? this.auth.register({ ...values, userName: values.userName.trim(), name: values.name.trim(), email: values.email.trim(), phone: values.phone.trim() })
      : this.auth.login(this.loginForm.controls.userName.value.trim(), this.loginForm.controls.password.value);
    request.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => {
      this.busy.set(false); this.loginForm.controls.password.reset(); this.registerForm.controls.password.reset();
    })).subscribe({
      next: () => {
        if (registering) {
          this.loginForm.controls.userName.setValue(values.userName.trim());
          this.registerForm.reset(); this.mode.set('login');
          this.message.set('Account created. Sign in to continue.');
        }
      },
      error: error => this.error.set(this.auth.errorMessage(error)),
    });
  }
  protected logout() {
    if (this.busy()) return;
    this.busy.set(true); this.error.set(''); this.message.set('');
    this.auth.logout().pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.busy.set(false))).subscribe({
      next: () => { this.loginForm.reset(); this.message.set('Signed out. Customer and cart drafts have been cleared.'); },
      error: error => this.error.set(this.auth.errorMessage(error)),
    });
  }
  protected retry() {
    this.auth.refresh().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }
}

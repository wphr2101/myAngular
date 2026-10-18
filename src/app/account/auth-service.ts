import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { catchError, finalize, of, switchMap, tap } from 'rxjs';
import { apiConfig, apiRequestOptions } from '../api.config';
import { CartStore } from '../shopping/cart-store';

export interface AccountProfile {
  userId: number;
  userName: string;
  customerId: number;
  name: string;
  email: string;
  phone: string | null;
  role?: string;
}
export interface Registration {
  userName: string; password: string; name: string; email: string; phone: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly cart = inject(CartStore);
  private readonly profile = signal<AccountProfile | null>(null);
  readonly user = this.profile.asReadonly();
  readonly checking = signal(false);
  readonly sessionError = signal('');
  private readonly url = apiConfig.baseUrl + '/api/auth';
  private readonly options = { ...apiRequestOptions, withCredentials: true };

  refresh() {
    this.checking.set(true);
    this.sessionError.set('');
    return this.http.get<AccountProfile>(this.url + '/me', this.options).pipe(
      tap(profile => this.setUser(profile)),
      catchError((error: HttpErrorResponse) => {
        this.setUser(null);
        if (error.status !== 401) this.sessionError.set(this.errorMessage(error));
        return of(null);
      }),
      finalize(() => this.checking.set(false)),
    );
  }

  register(body: Registration) { return this.post<{ message: string }>('/register', body); }
  login(userName: string, password: string) {
    return this.post<AccountProfile>('/login', { userName, password }).pipe(tap(profile => {
      this.sessionError.set(''); this.setUser(profile);
    }));
  }
  logout() {
    return this.post<void>('/logout', {}).pipe(tap(() => {
      this.setUser(null); this.cart.clearCustomer(); this.cart.clearCart();
    }));
  }

  private post<T>(path: string, body: unknown) {
    // Fetch a fresh token for the current cookie identity, including after login/logout.
    return this.http.get<{ requestToken: string }>(this.url + '/csrf', this.options).pipe(
      switchMap(csrf => this.http.post<T>(this.url + path, body, {
        ...this.options,
        headers: new HttpHeaders(apiRequestOptions.headers).set('X-CSRF-TOKEN', csrf.requestToken),
      })),
    );
  }

  private setUser(profile: AccountProfile | null) {
    if (this.profile()?.userId !== profile?.userId) this.cart.clearCustomer();
    if (this.profile() && !profile) this.cart.clearCart();
    this.profile.set(profile);
  }

  errorMessage(error: HttpErrorResponse): string {
    if (error.status === 401) return 'Invalid username or password, or your session has expired.';
    if (error.status === 409) return 'Unable to complete this request. For registration, try a different username; otherwise refresh your session.';
    if (error.status === 429) return 'Too many attempts. Wait one minute before trying again.';
    if (error.status === 400) return 'Check your details and try again. Passwords must be 15 to 128 characters.';
    return 'Account service unavailable. Please try again.';
  }
}

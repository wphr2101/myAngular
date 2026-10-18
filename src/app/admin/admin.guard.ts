import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../account/auth-service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.refresh().pipe(map(user => user?.role === 'Admin' ? true : router.createUrlTree([user ? '/' : '/account'])));
};

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAdminUser()) {
    return true;
  }

  if (!authService.isLoggedIn()) {
    void router.navigate(['/login'], {
      queryParams: { returnUrl: state.url },
    });
    return false;
  }

  void router.navigate(['/products']);
  return false;
};

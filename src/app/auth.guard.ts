import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';

/**
 * Prevents access to protected routes when no auth token is present in storage.
 *
 * This guard performs a lightweight presence check only. Token validity and
 * refresh handling should be implemented by a dedicated auth service/interceptor
 * in a production backend integration.
 */
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private readonly router: Router) {}

  /**
   * Allows route activation when an auth token exists; otherwise redirects
   * to `/login`.
   */
  canActivate(): boolean | UrlTree {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        return true;
      }
    } catch {
      // Access to storage can fail in private mode/restricted environments.
    }

    return this.router.parseUrl('/login');
  }
}

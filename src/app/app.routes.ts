import { Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';

/**
 * Application route map.
 *
 * Protected screens (`dashboard`, `summary`, `receipt`) use `AuthGuard` and
 * require an `auth_token` in local storage.
 */
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'summary',
    loadComponent: () => import('./summary/summary.component').then((m) => m.SummaryComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'receipt',
    loadComponent: () => import('./receipt/receipt.component').then((m) => m.ReceiptComponent),
    canActivate: [AuthGuard]
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];

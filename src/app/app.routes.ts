import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [loginGuard],
    loadComponent: () => import('./auth/login/login').then((m) => m.Login),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'users',
        loadComponent: () => import('./users/users-list/users-list').then((m) => m.UsersList),
      },
      {
        path: 'masters',
        loadComponent: () => import('./masters/masters-page/masters-page').then((m) => m.MastersPage),
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  { path: '**', redirectTo: '' },
];

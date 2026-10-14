
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/analyzer/analyzer').then(
        (m) => m.Analyzer,
      ),
  },
  {
    path: 'results/:analysisId',
    loadComponent: () =>
      import('./features/results/results').then(
        (m) => m.Results,
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login').then(
        (m) => m.Login,
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register').then(
        (m) => m.Register,
      ),
  },
  {
    path: 'history',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/history/history')
        .then((m) => m.History),
  },
  {
    path: '**',
    redirectTo: '',
  },
];

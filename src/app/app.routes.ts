import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

// Functional Auth Guard
const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.isAuthenticated() ? true : router.parseUrl('/auth');
};

const redirectIfLoggedIn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.isAuthenticated() ? router.parseUrl('/dashboard') : true;
};

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadComponent: () => import('./components/auth/auth.component').then(m => m.AuthComponent),
    canActivate: [redirectIfLoggedIn]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'plans',
    loadComponent: () => import('./components/plans/plans.component').then(m => m.PlansComponent),
    canActivate: [authGuard]
  },
  {
    path: 'workout/:id',
    loadComponent: () => import('./components/workout/workout.component').then(m => m.WorkoutComponent),
    canActivate: [authGuard]
  },
  {
    path: 'history',
    loadComponent: () => import('./components/history/history.component').then(m => m.HistoryComponent),
    canActivate: [authGuard]
  },
  {
    path: 'friends',
    loadComponent: () => import('./components/friends/friends.component').then(m => m.FriendsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'settings',
    loadComponent: () => import('./components/settings/settings.component').then(m => m.SettingsComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

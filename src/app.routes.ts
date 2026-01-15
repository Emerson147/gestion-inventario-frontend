import { Routes } from '@angular/router';
import { LoginComponent } from './app/features/auth/login.component';
import { RegisterComponent } from './app/features/auth/register.component';
import { UnauthorizedComponent } from './app/shared/components/unauthorized/unauthorized.component';
import { AuthGuard } from './app/core/guards/auth.guard';
import { AppLayout } from './app/shared/components/layout/component/app.layout';
import { NotFoundComponent } from './app/shared/components/not-found/not-found.component';
import { AdminDashboardComponent } from './app/features/admin/dashboard/admin-dashboard.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, data: { animation: 'login' } },
  {
    path: 'register',
    component: RegisterComponent,
    data: { animation: 'register' },
  },
  { path: 'unauthorized', component: UnauthorizedComponent },

  // Rutas protegidas con layout de Sakai NG
  {
    path: '',
    component: AppLayout, // Usa tu componente existente
    canActivate: [AuthGuard],
    children: [
      // Rutas para el administrador
      {
        path: 'admin',
        loadChildren: () =>
          import('./app/features/admin/admin-routing.module').then(
            (m) => m.AdminRoutingModule
          ),
        data: { roles: ['ROLE_ADMIN'] },
      },

      // Rutas para el vendedor
      {
        path: 'ventas',
        loadChildren: () =>
          import('./app/features/ventas/ventas-routing.module').then(
            (m) => m.VentasRoutingModule
          ),
        data: { roles: ['ROLE_ADMIN', 'ROLE_VENTAS'] },
      },

      // Redireccionar inteligente desde dashboard
      {
        path: 'dashboard',
        component: AdminDashboardComponent,
      },

      // Redirección por defecto dentro del layout
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'not-found', component: NotFoundComponent }, // Página para rutas no encontradas
  { path: '**', redirectTo: '/not-found' }, // Redirigir cualquier otra ruta a login
];

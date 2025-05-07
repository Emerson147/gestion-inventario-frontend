import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';

// Importar componentes
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { UsuariosComponent } from './usuarios/usuarios.component';
// Otros componentes...

const routes: Routes = [
  {
    path: 'dashboard',
    component: AdminDashboardComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ROLE_ADMIN'] }
  },
  {
    path: 'usuarios',
    component: UsuariosComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ROLE_ADMIN'] }
  },
  // Otras rutas...
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }

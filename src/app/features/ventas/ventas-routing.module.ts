import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';

// Importar componentes
import { VentasDashboardComponent } from './dashboard/ventas-dashboard.component';
import { RealizarVentaComponent } from './realizar-venta/realizar-venta.component';
// Otros componentes...

const routes: Routes = [
  {
    path: 'dashboard',
    component: VentasDashboardComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ROLE_ADMIN', 'ROLE_VENTAS'] }
  },
  {
    path: 'realizar-venta',
    component: RealizarVentaComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ROLE_ADMIN', 'ROLE_VENTAS'] }
  },
  // Otras rutas...
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VentasRoutingModule { }

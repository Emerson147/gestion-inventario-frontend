import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';

// Importar componentes
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { UsuariosComponent } from './usuarios/usuarios.component';
import { ProductosComponent } from './productos/productos.component';
import { ColoresComponent } from './colores/colores.component';
import { AlmacenesComponent } from './almacenes/almacenes.component';
import { InventarioComponent } from './inventario/inventario.component';
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
  {
    path: 'productos',
    component: ProductosComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ROLE_ADMIN']}
  },
  {
    path: 'colores',
    component: ColoresComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ROLE_ADMIN']}
  },
  {
    path: 'almacenes',
    component: AlmacenesComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ROLE_ADMIN']}
  },
  {
    path: 'inventario',
    component: InventarioComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ROLE_ADMIN']}
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }

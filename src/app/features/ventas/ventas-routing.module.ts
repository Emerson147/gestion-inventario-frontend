import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';

// Importar componentes NUEVOS con routing
import { VentasLayoutComponent } from './ventas-layout/ventas-layout.component';
import { PuntoVentaComponent } from './punto-venta/punto-venta.component';
import { HistorialComponent } from './historial/historial.component';
import { ReportesVentasComponent } from './reportes/reportes.component';
import { ConfiguracionVentasComponent } from './configuracion-ventas/configuracion-ventas.component';

// Importar otros componentes
import { ClientesComponent } from './clientes/clientes.component';

const routes: Routes = [
  {
    path: '',
    component: VentasLayoutComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ROLE_ADMIN', 'ROLE_VENTAS'] },
    children: [
      {
        path: '',
        redirectTo: 'punto-venta',
        pathMatch: 'full'
      },
      {
        path: 'punto-venta',
        component: PuntoVentaComponent,
        data: { 
          title: 'Punto de Venta',
          breadcrumb: 'POS',
          requiresCaja: false
        }
      },
      {
        path: 'historial',
        component: HistorialComponent,
        data: { 
          title: 'Historial de Ventas',
          breadcrumb: 'Historial',
          requiresCaja: false
        }
      },
      {
        path: 'reportes',
        component: ReportesVentasComponent,
        data: { 
          title: 'Reportes y Analytics',
          breadcrumb: 'Reportes',
          requiresCaja: false
        }
      },
      {
        path: 'configuracion',
        component: ConfiguracionVentasComponent,
        data: { 
          title: 'Configuración',
          breadcrumb: 'Configuración',
          requiresCaja: false
        }
      },
      {
        path: 'clientes',
        component: ClientesComponent,
        data: { 
          title: 'Gestión de Clientes',
          breadcrumb: 'Clientes',
          requiresCaja: false
        }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VentasRoutingModule { }

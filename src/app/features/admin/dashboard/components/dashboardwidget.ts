import { Component, OnInit, OnDestroy, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { RouterModule } from "@angular/router";
import { DashboardService, DashboardMetrics } from "../../../../core/services/dashboard.service";
import { Subject, takeUntil } from "rxjs";

@Component({
  standalone: true,
  selector: 'app-dashboard-widget',
  imports: [ButtonModule, CommonModule, CardModule, RouterModule],
  templateUrl: './dashboard-widget.html'
})
export class DashboardWidget implements OnInit, OnDestroy {
  
  private dashboardService = inject(DashboardService);
  private destroy$ = new Subject<void>();

  metrics: DashboardMetrics | null = null;
  loading = false;
  error: string | null = null;

  // Datos para compatibilidad con template actual
  data = {
    category: 0,
    product: 0,
    bill: 0,
    warehouse: 0,
    users: 0
  };

  ngOnInit() {
    console.log('🚀 Inicializando Dashboard Widget...');
    this.cargarDatos();
    
    // Actualización automática deshabilitada por defecto
    // Puedes habilitarla descomentando la siguiente línea:
    // this.dashboardService.iniciarActualizacionAutomatica(30);
    
    // Suscribirse a los cambios de métricas
    this.dashboardService.metrics$
      .pipe(takeUntil(this.destroy$))
      .subscribe(metrics => {
        if (metrics) {
          this.metrics = metrics;
          this.actualizarData(metrics);
        }
      });

    this.dashboardService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => this.loading = loading);

    this.dashboardService.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => this.error = error);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarDatos() {
    this.dashboardService.obtenerMetricasCompletas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (metrics) => {
          console.log('✅ Métricas cargadas:', metrics);
          this.metrics = metrics;
          this.actualizarData(metrics);
        },
        error: (error) => {
          console.error('❌ Error al cargar métricas:', error);
          this.error = 'Error al cargar las métricas del dashboard';
        }
      });
  }

  private actualizarData(metrics: DashboardMetrics) {
    this.data = {
      category: metrics.totalCategorias,
      product: metrics.totalProductos,
      bill: metrics.totalVentas,
      warehouse: metrics.totalAlmacenes,
      users: metrics.usuariosActivos
    };
  }
}

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardWidget } from './components/dashboardwidget';
// import { StatsWidget } from './components/statswidget';
// import { RecentSalesWidget } from './components/recentsaleswidget';
// import { BestSellingWidget } from './components/bestsellingwidget';
// import { RevenueStreamWidget } from './components/revenuestreamwidget';
// import { NotificationsWidget } from './components/notificationswidget';
import { DashboardService, KPIDashboard } from '../../../core/services/dashboard.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    DashboardWidget,
    // StatsWidget,
    // RecentSalesWidget,
    // BestSellingWidget,
    // RevenueStreamWidget,
    // NotificationsWidget
  ],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  
  private dashboardService = inject(DashboardService);
  private destroy$ = new Subject<void>();

  kpis: KPIDashboard[] = [];
  loading = false;
  ultimaActualizacion = new Date();

  ngOnInit() {
    console.log('🚀 Inicializando Dashboard Principal...');
    this.cargarKPIs();

    // Suscribirse a cambios de métricas (sin actualización automática)
    this.dashboardService.metrics$
      .pipe(takeUntil(this.destroy$))
      .subscribe(metrics => {
        if (metrics) {
          this.kpis = this.dashboardService.generarKPIs(metrics);
          this.ultimaActualizacion = new Date();
        }
      });

    this.dashboardService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => this.loading = loading);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarKPIs() {
    this.dashboardService.obtenerMetricasCompletas()
      .pipe(takeUntil(this.destroy$))
      .subscribe(metrics => {
        this.kpis = this.dashboardService.generarKPIs(metrics);
      });
  }

  actualizarDatos() {
    console.log('🔄 Actualizando dashboard manualmente...');
    this.cargarKPIs();
  }

  getIconClass(icon: string): string {
    return `pi ${icon}`;
  }

  getTendenciaIcon(tendencia: 'subida' | 'bajada' | 'neutral'): string {
    switch (tendencia) {
      case 'subida': return 'pi pi-arrow-up';
      case 'bajada': return 'pi pi-arrow-down';
      default: return 'pi pi-minus';
    }
  }

  getTendenciaColor(tendencia: 'subida' | 'bajada' | 'neutral'): string {
    switch (tendencia) {
      case 'subida': return 'text-green-600';
      case 'bajada': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  formatearValor(valor: number, tipo: 'moneda' | 'numero' | 'porcentaje'): string {
    switch (tipo) {
      case 'moneda':
        return `S/. ${valor.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'porcentaje':
        return `${valor.toFixed(1)}%`;
      default:
        return valor.toLocaleString('es-PE');
    }
  }

  trackByKpiId(index: number, kpi: KPIDashboard): string {
    return kpi.id;
  }
}

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { ToastNotificationComponent } from '../../../shared/components/toast-notification/toast-notification.component';
import { ToastService } from '../../../shared/services/toast.service';
import { DashboardWidget } from './components/dashboardwidget';
// import { StatsWidget } from './components/statswidget';
import { RecentSalesWidget } from './components/recentsaleswidget';
import { BestSellingWidget } from './components/bestsellingwidget';
import { RevenueStreamWidget } from './components/revenuestreamwidget';
// import { NotificationsWidget } from './components/notificationswidget';
import {
  DashboardService,
  KPIDashboard,
} from '../../../core/services/dashboard.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    TooltipModule,
    ToastNotificationComponent,
    DashboardWidget,
    // StatsWidget,
    RecentSalesWidget,
    BestSellingWidget,
    RevenueStreamWidget,
    // NotificationsWidget
  ],
  templateUrl: './admin-dashboard.component.html',
  styles: [
    `
      :host ::ng-deep {
        /* Cards más elegantes */
        .card {
          border-radius: 16px !important;
          transition: all 0.3s ease !important;
        }

        /* Botones con sombras */
        button {
          transition: all 0.3s ease !important;
        }

        button:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        /* Animaciones suaves */
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      }

      /* Utilidades CSS personalizadas */
      .line-clamp-1 {
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    `,
  ],
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private dashboardService = inject(DashboardService);
  readonly toastService = inject(ToastService);
  private destroy$ = new Subject<void>();

  kpis: KPIDashboard[] = [];
  loading = false;
  ultimaActualizacion = new Date();
  fechaActual = new Date();
  nombreUsuario: string = '';
  rolUsuario: string = '';

  ngOnInit() {
    console.log('🚀 Inicializando Dashboard Principal...');
    this.cargarKPIs();
    this.obtenerDatosUsuario();

    // Suscribirse a cambios de métricas (sin actualización automática)
    this.dashboardService.metrics$
      .pipe(takeUntil(this.destroy$))
      .subscribe((metrics) => {
        if (metrics) {
          this.kpis = this.dashboardService.generarKPIs(metrics);
          this.ultimaActualizacion = new Date();
        }
      });

    this.dashboardService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe((loading) => (this.loading = loading));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onToastDismissed(id: string): void {
    this.toastService.dismiss(id);
  }

  cargarKPIs() {
    this.dashboardService
      .obtenerMetricasCompletas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (metrics) => {
          this.kpis = this.dashboardService.generarKPIs(metrics);
        },
        error: (error) => {
          console.error('❌ Error al cargar KPIs:', error);
          this.toastService.error(
            'Error',
            'No se pudieron cargar las métricas',
          );
        },
      });
  }

  actualizarDatos() {
    console.log('🔄 Actualizando dashboard manualmente...');
    this.toastService.info('Actualizando', 'Cargando datos del sistema...');
    this.cargarKPIs();
  }

  obtenerDatosUsuario() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.nombreUsuario = payload.sub || payload.username || 'Usuario';
        this.rolUsuario = payload.role || payload.authorities?.[0] || 'Usuario';
      } catch (error) {
        console.error('Error al decodificar token:', error);
        this.nombreUsuario = 'Usuario';
        this.rolUsuario = 'Usuario';
      }
    }
  }

  getIconClass(icon: string): string {
    return `pi ${icon}`;
  }

  getTendenciaIcon(tendencia: 'subida' | 'bajada' | 'neutral'): string {
    switch (tendencia) {
      case 'subida':
        return 'pi pi-arrow-up';
      case 'bajada':
        return 'pi pi-arrow-down';
      default:
        return 'pi pi-minus';
    }
  }

  getTendenciaClasses(tendencia: 'subida' | 'bajada' | 'neutral'): string {
    switch (tendencia) {
      case 'subida':
        return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400';
      case 'bajada':
        return 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400';
      default:
        return 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400';
    }
  }

  getTendenciaColor(tendencia: 'subida' | 'bajada' | 'neutral'): string {
    switch (tendencia) {
      case 'subida':
        return 'text-green-600';
      case 'bajada':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }

  getCurrentDate(): Date {
    return new Date();
  }

  formatearValor(
    valor: number,
    tipo: 'moneda' | 'numero' | 'porcentaje',
  ): string {
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

  /**
   * Exporta los datos del dashboard a Excel
   */
  async exportarDatos(): Promise<void> {
    if (!this.kpis || this.kpis.length === 0) {
      this.toastService.warning('Sin datos', 'No hay métricas para exportar');
      return;
    }

    try {
      const xlsx = await import('xlsx');

      const dataToExport = this.kpis.map((kpi) => ({
        Métrica: kpi.titulo,
        Valor: this.formatearValor(kpi.valor, kpi.tipo),
        Tendencia: kpi.tendencia,
        'Cambio (%)': kpi.porcentajeCambio,
        Descripción: kpi.descripcion,
      }));

      const worksheet = xlsx.utils.json_to_sheet(dataToExport);
      const workbook = {
        Sheets: { Dashboard: worksheet },
        SheetNames: ['Dashboard'],
      };
      const excelBuffer = xlsx.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
      });

      const data = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(data);
      link.download = `dashboard_${new Date().toISOString().slice(0, 10)}.xlsx`;
      link.click();

      this.toastService.success(
        'Exportado',
        'Dashboard exportado correctamente',
      );
      console.log('✅ Dashboard exportado correctamente');
    } catch (error) {
      console.error('❌ Error al exportar dashboard:', error);
      this.toastService.error('Error', 'No se pudo exportar el dashboard');
    }
  }

  /**
   * Muestra estadísticas detalladas
   */
  mostrarEstadisticas(): void {
    console.log('📊 Mostrando estadísticas detalladas...');
    this.toastService.info('Estadísticas', 'Función en desarrollo');
    // Aquí puedes implementar la lógica para mostrar un modal con estadísticas
    // Similar al componente de usuarios
  }
}

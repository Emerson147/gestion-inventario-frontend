import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { debounceTime, Subscription } from 'rxjs';
import { LayoutService } from '../../../../shared/components/layout/service/layout.service';
import { DashboardService } from '../../../../core/services/dashboard.service';

interface ChartDataset {
  type: string;
  label: string;
  backgroundColor: string;
  data: number[];
  barThickness?: number;
  borderRadius?: {
    topLeft: number;
    topRight: number;
    bottomLeft: number;
    bottomRight: number;
  };
  borderSkipped?: boolean;
}

interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

interface ChartOptions {
  maintainAspectRatio: boolean;
  aspectRatio: number;
  plugins: {
    legend: {
      labels: {
        color: string;
        font?: {
          weight: string;
          size: number;
        };
        padding: number;
        usePointStyle: boolean;
      };
    };
    tooltip: {
      backgroundColor: string;
      titleColor: string;
      bodyColor: string;
      borderColor: string;
      borderWidth: number;
      padding: number;
      displayColors: boolean;
    };
  };
  scales: {
    x: {
      stacked: boolean;
      ticks: {
        color: string;
        font?: {
          size: number;
          weight: string;
        };
      };
      grid: {
        color: string;
        borderColor: string;
      };
    };
    y: {
      stacked: boolean;
      ticks: {
        color: string;
        callback?: (value: any) => string;
      };
      grid: {
        color: string;
        borderColor: string;
        drawTicks: boolean;
      };
    };
  };
}

@Component({
  standalone: true,
  selector: 'app-revenue-stream-widget',
  imports: [CommonModule, ChartModule, ButtonModule, MenuModule],
  template: ` <div
    class="rounded-[2rem] bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full"
  >
    <!-- Header Section -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h2
          class="font-bold text-xl text-surface-900 dark:text-surface-0 mb-1 flex items-center gap-2"
        >
          <span
            class="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400"
          >
            <i class="pi pi-chart-bar text-sm"></i>
          </span>
          Flujo de Ingresos
        </h2>
        <p class="text-sm text-surface-500 dark:text-surface-400 ml-10">
          Análisis trimestral por categoría
        </p>
      </div>
      <div class="flex items-center gap-2">
        <div
          class="flex items-center gap-2 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-xl px-3 py-1.5 shadow-sm"
        >
          <i class="pi pi-calendar text-surface-400 text-xs"></i>
          <span
            class="text-sm font-semibold text-surface-700 dark:text-surface-300"
            >{{ currentYear }}</span
          >
        </div>
        <button
          pButton
          type="button"
          icon="pi pi-ellipsis-v"
          class="p-button-rounded p-button-text p-button-secondary hover:bg-surface-100 dark:hover:bg-surface-800"
          (click)="menu.toggle($event)"
        >
          <span class="sr-only">Mostrar opciones</span>
        </button>
        <p-menu #menu [popup]="true" [model]="menuItems"></p-menu>
      </div>
    </div>

    <!-- Statistics Summary -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <!-- Total Revenue -->
      <div
        class="p-4 rounded-[1.5rem] bg-white dark:bg-surface-900 border border-surface-100 dark:border-surface-800 shadow-sm relative overflow-hidden group"
      >
        <div
          class="absolute top-0 right-0 w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        ></div>

        <div class="relative z-10">
          <div class="flex items-center justify-between mb-2">
            <span
              class="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider"
              >Total</span
            >
            <i class="pi pi-chart-line text-indigo-500"></i>
          </div>
          <div class="text-2xl font-bold text-surface-900 dark:text-surface-0">
            S/. {{ getTotalRevenue() | number: '1.0-0' }}
          </div>
          <div
            class="text-xs text-surface-500 dark:text-surface-400 mt-1 flex items-center gap-1"
          >
            <i class="pi pi-check-circle text-[10px] text-emerald-500"></i>
            <span>Acumulado anual</span>
          </div>
        </div>
      </div>

      <!-- Dynamic Category Cards -->
      <div
        *ngFor="let dataset of chartData?.datasets; let i = index"
        class="p-4 rounded-[1.5rem] bg-white dark:bg-surface-900 border border-surface-100 dark:border-surface-800 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md cursor-default"
      >
        <div class="flex items-center justify-between mb-2">
          <span
            class="text-[10px] font-bold uppercase tracking-wider truncate max-w-[70%]"
            [style.color]="dataset.backgroundColor"
          >
            {{ dataset.label }}
          </span>
          <div
            class="w-2 h-2 rounded-full"
            [style.background-color]="dataset.backgroundColor"
          ></div>
        </div>
        <div class="text-xl font-bold text-surface-900 dark:text-surface-0">
          S/. {{ getDatasetTotal(i) | number: '1.0-0' }}
        </div>
        <div
          class="text-xs mt-1 font-medium"
          [style.color]="dataset.backgroundColor"
        >
          {{ getDatasetPercentage(i) }}%
        </div>
      </div>
    </div>

    <!-- Chart Section -->
    <div
      class="bg-white dark:bg-surface-900 rounded-[1.5rem] p-4 border border-surface-100 dark:border-surface-800 relative shadow-sm"
    >
      <div
        *ngIf="loading"
        class="absolute inset-0 z-10 flex items-center justify-center bg-white/60 dark:bg-black/60 backdrop-blur-[2px] rounded-[1.5rem]"
      >
        <i class="pi pi-spin pi-spinner text-3xl text-indigo-500"></i>
      </div>
      <p-chart
        type="bar"
        [data]="chartData"
        [options]="chartOptions"
        class="h-80"
      />
    </div>

    <!-- Quarter Analysis -->
    <div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
      <div
        *ngFor="let quarter of quarters; let i = index"
        class="p-3 rounded-2xl border border-transparent hover:border-surface-200 dark:hover:border-surface-700 hover:bg-white dark:hover:bg-surface-900 transition-all duration-300 group"
      >
        <div class="flex items-center justify-between mb-2">
          <span
            class="text-xs font-bold text-surface-400 dark:text-surface-500 group-hover:text-surface-700 dark:group-hover:text-surface-300 transition-colors"
            >{{ quarter }}</span
          >
          <i class="pi pi-calendar text-surface-300 text-[10px]"></i>
        </div>
        <div
          class="text-lg font-bold text-surface-700 dark:text-surface-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
        >
          S/. {{ getQuarterTotal(i) | number: '1.0-0' }}
        </div>
        <div class="text-[10px] text-surface-500 mt-1">
          <span
            [ngClass]="{
              'text-emerald-500': getQuarterGrowth(i).includes('+'),
              'text-rose-500':
                !getQuarterGrowth(i).includes('+') &&
                getQuarterGrowth(i) !== '0',
            }"
          >
            {{ getQuarterGrowth(i) }}%
          </span>
          vs prev
        </div>
      </div>
    </div>
  </div>`,
})
export class RevenueStreamWidget implements OnInit, OnDestroy {
  chartData: ChartData = { labels: [], datasets: [] };
  chartOptions!: ChartOptions;
  subscription!: Subscription;
  quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  loading = true;
  currentYear = new Date().getFullYear();

  menuItems = [
    { label: 'Ver Detalles', icon: 'pi pi-fw pi-eye' },
    {
      label: 'Actualizar',
      icon: 'pi pi-fw pi-refresh',
      command: () => this.loadData(),
    },
  ];

  private layoutService = inject(LayoutService);
  private dashboardService = inject(DashboardService);
  private cd = inject(ChangeDetectorRef);

  constructor() {
    this.subscription = this.layoutService.configUpdate$
      .pipe(debounceTime(25))
      .subscribe(() => {
        if (this.chartData && this.chartData.datasets.length > 0) {
          this.updateChartOptions();
        }
      });
  }

  ngOnInit() {
    this.updateChartOptions(); // Init options first
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.dashboardService.getFlujoIngresos().subscribe((data) => {
      this.chartData = data;
      this.loading = false;
      this.cd.markForCheck();
    });
  }

  updateChartOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const borderColor = documentStyle.getPropertyValue('--surface-border');
    const textMutedColor = documentStyle.getPropertyValue(
      '--text-color-secondary',
    );

    this.chartOptions = {
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      plugins: {
        legend: {
          labels: {
            color: textColor,
            font: {
              weight: '600',
              size: 12,
            },
            padding: 15,
            usePointStyle: true,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 12,
          displayColors: true,
        },
      },
      scales: {
        x: {
          stacked: true,
          ticks: {
            color: textMutedColor,
            font: {
              size: 12,
              weight: '600',
            },
          },
          grid: {
            color: 'transparent',
            borderColor: 'transparent',
          },
        },
        y: {
          stacked: true,
          ticks: {
            color: textMutedColor,
            callback: function (value: any) {
              return 'S/. ' + value.toLocaleString();
            },
          },
          grid: {
            color: borderColor,
            borderColor: 'transparent',
            drawTicks: false,
          },
        },
      },
    };
  }

  getTotalRevenue(): number {
    if (!this.chartData || !this.chartData.datasets) return 0;
    return this.chartData.datasets.reduce((total, dataset) => {
      return total + dataset.data.reduce((sum, value) => sum + value, 0);
    }, 0);
  }

  getDatasetTotal(datasetIndex: number): number {
    if (!this.chartData || !this.chartData.datasets[datasetIndex]) return 0;
    return this.chartData.datasets[datasetIndex].data.reduce(
      (sum, value) => sum + value,
      0,
    );
  }

  getDatasetPercentage(datasetIndex: number): string {
    const total = this.getTotalRevenue();
    if (total === 0) return '0';
    const datasetTotal = this.getDatasetTotal(datasetIndex);
    return ((datasetTotal / total) * 100).toFixed(1);
  }

  getQuarterTotal(quarterIndex: number): number {
    if (!this.chartData || !this.chartData.datasets) return 0;
    return this.chartData.datasets.reduce((total, dataset) => {
      return total + (dataset.data[quarterIndex] || 0);
    }, 0);
  }

  getQuarterGrowth(quarterIndex: number): string {
    if (quarterIndex === 0) return '0';
    const current = this.getQuarterTotal(quarterIndex);
    const previous = this.getQuarterTotal(quarterIndex - 1);
    if (previous === 0) return current > 0 ? '+100' : '0';
    const growth = ((current - previous) / previous) * 100;
    return growth > 0 ? `+${growth.toFixed(1)}` : growth.toFixed(1);
  }

  hexToRgba(hex: string, alpha: number): string {
    // Simple helper to create background colors from chart colors which are rgba strings
    // If it's already rgba, just replace alpha
    if (hex.startsWith('rgba')) {
      return hex.replace(/[\d\.]+\)$/g, `${alpha})`);
    }
    return hex; // Fallback
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}

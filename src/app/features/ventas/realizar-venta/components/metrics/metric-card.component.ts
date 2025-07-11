import { 
  Component, 
  Input, 
  OnInit, 
  OnDestroy, 
  ChangeDetectionStrategy, 
  computed, 
  signal,
  inject,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { KnobModule } from 'primeng/knob';
import { ProgressBarModule } from 'primeng/progressbar';
import { ChartModule } from 'primeng/chart';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';

import { MetricaVenta } from './metric-card.interface';

@Component({
  selector: 'app-metric-card',
  templateUrl: './metric-card.component.html',
  styleUrls: ['./metric-card.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    TagModule,
    ButtonModule,
    KnobModule,
    ProgressBarModule,
    ChartModule,
    CardModule,
    SkeletonModule,
    TooltipModule,
    BadgeModule
  ]
})
export class MetricCardComponent implements OnInit, OnDestroy {
  @Input() metrica!: MetricaVenta;
  @Input() showRealTime = true;
  @Input() enableAnimations = true;

  private cdr = inject(ChangeDetectorRef);
  private timeInterval?: number;

  // Signals para reactividad optimizada
  private readonly _performanceScore = signal(96);
  private readonly _currentTime = signal(new Date());
  private readonly _isHovered = signal(false);

  // Computed values
  readonly performanceScore = computed(() => this._performanceScore());
  readonly currentTime = computed(() => this._currentTime());
  readonly isHovered = computed(() => this._isHovered());
  
  readonly numericValue = computed(() => {
    if (!this.metrica?.valor) return 0;
    return typeof this.metrica.valor === 'number' 
      ? this.metrica.valor 
      : Number(this.metrica.valor.toString().replace(/[^0-9.-]/g, '')) || 0;
  });

  readonly formattedValue = computed(() => {
    const value = this.numericValue();
    if (this.metrica?.id === 'ingresos-hoy') {
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    }
    return this.metrica?.valor?.toString() || '0';
  });

  // Mapeo de colores optimizado para diseño empresarial
  private readonly colorMappings = {
    success: {
      gradient: 'from-emerald-500 via-green-500 to-emerald-600',
      bg: 'bg-emerald-50/80',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      shadow: 'shadow-emerald-500/20',
      glow: 'shadow-[0_0_30px_rgba(16,185,129,0.15)]',
      ring: 'ring-emerald-400',
      pulse: 'bg-emerald-500/30'
    },
    info: {
      gradient: 'from-blue-500 via-indigo-500 to-blue-600',
      bg: 'bg-blue-50/80',
      text: 'text-blue-700',
      border: 'border-blue-200',
      shadow: 'shadow-blue-500/20',
      glow: 'shadow-[0_0_30px_rgba(59,130,246,0.15)]',
      ring: 'ring-blue-400',
      pulse: 'bg-blue-500/30'
    },
    warning: {
      gradient: 'from-amber-500 via-orange-500 to-amber-600',
      bg: 'bg-amber-50/80',
      text: 'text-amber-700',
      border: 'border-amber-200',
      shadow: 'shadow-amber-500/20',
      glow: 'shadow-[0_0_30px_rgba(245,158,11,0.15)]',
      ring: 'ring-amber-400',
      pulse: 'bg-amber-500/30'
    },
    danger: {
      gradient: 'from-red-500 via-rose-500 to-red-600',
      bg: 'bg-red-50/80',
      text: 'text-red-700',
      border: 'border-red-200',
      shadow: 'shadow-red-500/20',
      glow: 'shadow-[0_0_30px_rgba(239,68,68,0.15)]',
      ring: 'ring-red-400',
      pulse: 'bg-red-500/30'
    },
    secondary: {
      gradient: 'from-slate-500 via-gray-500 to-slate-600',
      bg: 'bg-slate-50/80',
      text: 'text-slate-700',
      border: 'border-slate-200',
      shadow: 'shadow-slate-500/20',
      glow: 'shadow-[0_0_30px_rgba(100,116,139,0.15)]',
      ring: 'ring-slate-400',
      pulse: 'bg-slate-500/30'
    }
  };

  ngOnInit() {
    if (!this.metrica) {
      console.error('MetricCardComponent: metrica es requerida');
      return;
    }

    // Actualización de tiempo en tiempo real
    if (this.showRealTime) {
      this.timeInterval = window.setInterval(() => {
        this._currentTime.set(new Date());
        if (this.metrica.id === 'ingresos-hoy') {
          this.cdr.markForCheck();
        }
      }, 1000);
    }

    // Simular actualización de performance score si es necesario
    if (this.metrica.id === 'performance') {
      this.simulatePerformanceUpdates();
    }
  }

  ngOnDestroy() {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  // Métodos para clases CSS optimizados
  getColorClass(type: keyof typeof this.colorMappings['success']): string {
    return this.colorMappings[this.metrica?.color]?.[type] || this.colorMappings.secondary[type];
  }

  getTendenciaConfig() {
    if (!this.metrica?.tendencia) return null;

    const baseConfig = {
      up: {
        severity: 'success' as const,
        icon: 'pi pi-trending-up',
        prefix: '+',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-100'
      },
      down: {
        severity: 'danger' as const,
        icon: 'pi pi-trending-down',
        prefix: '-',
        color: 'text-red-600',
        bgColor: 'bg-red-100'
      },
      neutral: {
        severity: 'info' as const,
        icon: 'pi pi-minus',
        prefix: '±',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100'
      }
    };

    return baseConfig[this.metrica.tendencia.direccion];
  }

  getChartData() {
    if (!this.metrica?.miniGrafico) return null;

    const { data, labels = [], type = 'line' } = this.metrica.miniGrafico;
    const defaultLabels = Array.from({ length: data.length }, (_, i) => `${i + 1}`);

    return {
      labels: labels.length ? labels : defaultLabels,
      datasets: [{
        data,
        borderColor: `rgb(${this.getColorRgb()})`,
        backgroundColor: type === 'area' ? `rgba(${this.getColorRgb()}, 0.1)` : 'transparent',
        borderWidth: 3,
        fill: type === 'area',
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: `rgb(${this.getColorRgb()})`,
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2
      }]
    };
  }

  getChartOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index' as const
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: `rgb(${this.getColorRgb()})`,
          borderWidth: 1
        }
      },
      scales: {
        x: { 
          display: false,
          grid: { display: false }
        },
        y: { 
          display: false,
          grid: { display: false }
        }
      },
      elements: {
        point: { radius: 0 }
      },
      animation: {
        duration: this.enableAnimations ? 750 : 0
      }
    };
  }

  private getColorRgb(): string {
    const rgbMap = {
      success: '16, 185, 129',
      info: '59, 130, 246',
      warning: '245, 158, 11',
      danger: '239, 68, 68',
      secondary: '100, 116, 139'
    };
    return rgbMap[this.metrica?.color] || rgbMap.secondary;
  }

  private simulatePerformanceUpdates() {
    // Simular pequeñas variaciones en el performance score
    setInterval(() => {
      const currentScore = this._performanceScore();
      const variation = (Math.random() - 0.5) * 2; // ±1 punto
      const newScore = Math.max(90, Math.min(100, currentScore + variation));
      this._performanceScore.set(Math.round(newScore));
    }, 5000);
  }

  // Event handlers
  onCardHover(isHovered: boolean) {
    this._isHovered.set(isHovered);
  }

  onActionClick() {
    if (this.metrica?.accionPrincipal && !this.metrica.accionPrincipal.disabled) {
      try {
        this.metrica.accionPrincipal.callback();
      } catch (error) {
        console.error('Error ejecutando acción:', error);
      }
    }
  }

  // Utility methods
  trackByIndex(index: number): number {
    return index;
  }

  trackByLabel(index: number, item: { label?: string }): string {
    return item.label || index.toString();
  }

  getRelativeTime(): string {
    if (!this.metrica?.ultimaActualizacion) return '';
    
    const now = new Date();
    const diff = now.getTime() - this.metrica.ultimaActualizacion.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Ahora mismo';
    if (minutes < 60) return `Hace ${minutes}m`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours}h`;
    
    const days = Math.floor(hours / 24);
    return `Hace ${days}d`;
  }

  getAlertSeverity(): 'high' | 'medium' | 'low' {
    return this.metrica?.alertaCritica?.nivel === 'alta' ? 'high' :
           this.metrica?.alertaCritica?.nivel === 'media' ? 'medium' : 'low';
  }

  formatNumber(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  }
}
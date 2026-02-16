import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-zen-metric-card',
  standalone: true,
  imports: [CommonModule],
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
  template: `
    <div
      class="min-w-[180px] h-full snap-center bg-white dark:bg-surface-900 rounded-[2rem] p-5 border border-surface-200 dark:border-surface-800 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg group/card cursor-default relative overflow-hidden"
      [ngClass]="getBorderColorClass()"
    >
      <div
        class="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 ease-out pointer-events-none"
        [ngClass]="getGradientOverlay()"
      ></div>

      <div class="relative z-10 flex items-start justify-between mb-4">
        <div
          class="w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 ease-out"
          [ngClass]="getIconBgClass()"
        >
          <i [class]="'pi ' + icon + ' text-base'"></i>
        </div>

        <div
          *ngIf="trend !== undefined"
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border"
          [ngClass]="getTrendClass()"
        >
          <i
            *ngIf="trendIcon"
            [class]="'pi ' + trendIcon + ' text-[9px] font-bold'"
          ></i>
          <span class="text-[11px] font-semibold tracking-wide">{{
            trendLabel || trend + '%'
          }}</span>
        </div>

        <div *ngIf="customBadge" class="flex flex-col items-end gap-0.5">
          <span class="text-[9px] font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">{{
            customBadge.label
          }}</span>
          <span
            class="text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg"
            [ngClass]="getCustomBadgeClass()"
          >
            {{ customBadge.value }}
          </span>
        </div>
      </div>

      <div class="relative z-10">
        <p
          class="text-[10px] font-bold text-surface-400 dark:text-surface-500 uppercase tracking-wider mb-1.5"
        >
          {{ title }}
        </p>
        <p
          class="text-3xl font-bold text-surface-900 dark:text-surface-0 tracking-tight truncate"
        >
          {{ value }}
        </p>
        <p *ngIf="message" class="text-[13px] text-surface-600 dark:text-surface-400 mt-2 font-medium leading-relaxed">
          {{ message }}
        </p>
      </div>
    </div>
  `,
})
export class ZenMetricCardComponent {
  @Input() title: string = '';
  @Input() value: string | number = '';
  @Input() icon: string = 'pi-chart-bar';
  @Input() color: 'emerald' | 'indigo' | 'orange' | 'purple' | 'blue' | 'rose' =
    'indigo'; // Type widened slightly for flexibility

  // Opcionales para tendencias o badges
  @Input() trend?: number | string;
  @Input() trendLabel?: string;
  @Input() trendIcon?: string = 'pi-arrow-up';

  // Opcional para badges personalizados (como Ticket Promedio)
  @Input() customBadge?: { label: string; value: string };

  // Opcional para mensaje descriptivo inferior
  @Input() message?: string;

  getBorderColorClass(): string {
    const colors: Record<string, string> = {
      emerald: 'hover:border-emerald-200 dark:hover:border-emerald-800',
      indigo: 'hover:border-indigo-200 dark:hover:border-indigo-800',
      orange: 'hover:border-amber-200 dark:hover:border-amber-800',
      purple: 'hover:border-violet-200 dark:hover:border-violet-800',
      blue: 'hover:border-sky-200 dark:hover:border-sky-800',
      rose: 'hover:border-rose-200 dark:hover:border-rose-800',
    };
    return colors[this.color] ?? colors['indigo'];
  }

  getGradientOverlay(): string {
    const gradients: Record<string, string> = {
      emerald: 'bg-gradient-to-br from-emerald-50/40 to-surface-0 dark:from-emerald-900/15 dark:to-surface-900/10',
      indigo: 'bg-gradient-to-br from-primary-50/40 to-surface-0 dark:from-primary-900/15 dark:to-surface-900/10',
      orange: 'bg-gradient-to-br from-amber-50/40 to-surface-0 dark:from-amber-900/15 dark:to-surface-900/10',
      purple: 'bg-gradient-to-br from-violet-50/40 to-surface-0 dark:from-violet-900/15 dark:to-surface-900/10',
      blue: 'bg-gradient-to-br from-sky-50/40 to-surface-0 dark:from-sky-900/15 dark:to-surface-900/10',
      rose: 'bg-gradient-to-br from-rose-50/40 to-surface-0 dark:from-rose-900/15 dark:to-surface-900/10',
    };
    return gradients[this.color] ?? gradients['indigo'];
  }

  getIconBgClass(): string {
    const colors: Record<string, string> = {
      emerald:
        'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 shadow-sm',
      indigo:
        'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800/50 shadow-sm',
      orange:
        'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 shadow-sm',
      purple:
        'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800/50 shadow-sm',
      blue:
        'bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/50 shadow-sm',
      rose:
        'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 shadow-sm',
    };
    return colors[this.color] ?? colors['indigo'];
  }

  getTrendClass(): string {
    const colors: Record<string, string> = {
      emerald:
        'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300',
      indigo:
        'bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-800/50 text-primary-700 dark:text-primary-300',
      orange:
        'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300',
      purple:
        'bg-violet-50 dark:bg-violet-900/30 border-violet-200 dark:border-violet-800/50 text-violet-700 dark:text-violet-300',
      blue:
        'bg-sky-50 dark:bg-sky-900/30 border-sky-200 dark:border-sky-800/50 text-sky-700 dark:text-sky-300',
      rose:
        'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300',
    };
    return colors[this.color] ?? colors['indigo'];
  }

  getCustomBadgeClass(): string {
    const colors: Record<string, string> = {
      emerald:
        'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50',
      indigo:
        'text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800/50',
      orange:
        'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50',
      purple:
        'text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800/50',
      blue:
        'text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-800/50',
      rose:
        'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800/50',
    };
    return colors[this.color] ?? colors['indigo'];
  }
}

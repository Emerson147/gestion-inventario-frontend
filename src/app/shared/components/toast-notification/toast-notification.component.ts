import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  actions?: ToastAction[];
  icon?: string;
  persistent?: boolean;
}

export interface ToastAction {
  label: string;
  action: () => void;
  primary?: boolean;
}

@Component({
  selector: 'app-toast-notification',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    .glass-effect {
      background: rgba(var(--surface-card-rgb, 255, 255, 255), 0.8) !important;
      backdrop-filter: blur(16px) saturate(180%);
      -webkit-backdrop-filter: blur(16px) saturate(180%);
    }
    
    @media (prefers-color-scheme: dark) {
      .glass-effect {
        background: rgba(var(--surface-card-rgb, 30, 30, 30), 0.85) !important;
      }
    }
  `],
  template: `
    <div 
      class="fixed top-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none"
      *ngIf="toasts.length > 0"
    >
      <div
        *ngFor="let toast of toasts; trackBy: trackByToastId"
        class="pointer-events-auto transform transition-all duration-300 ease-out"
        [@slideInOut]
      >
        <div 
          class="rounded-2xl p-5 relative overflow-hidden group backdrop-blur-xl"
          [ngClass]="getToastContainerClass(toast)"
          style="background: var(--surface-card); border: 1px solid var(--surface-border); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);"
        >
          
          <div 
            *ngIf="!toast.persistent"
            class="absolute bottom-0 left-0 h-1 transition-all duration-100 ease-linear"
            [class]="getProgressBarClass(toast)"
            [style.width.%]="getProgress(toast)"
          ></div>
          
          <div class="flex items-start gap-4">
            <div 
              class="flex-shrink-0 mt-0.5"
              [class]="getIconColorClass(toast)"
            >
              <i 
                [class]="getIconClass(toast)"
                class="text-xl"
              ></i>
            </div>
            
            <div class="flex-1 min-w-0">
              <h4 class="text-sm font-bold mb-1 leading-tight" style="color: var(--text-color);">
                {{ toast.title }}
              </h4>
              <p class="text-sm font-medium leading-relaxed" style="color: var(--text-color-secondary);">
                {{ toast.message }}
              </p>
              
              <div 
                *ngIf="toast.actions && toast.actions.length > 0"
                class="flex gap-3 mt-4"
              >
                <button
                  *ngFor="let action of toast.actions"
                  (click)="executeAction(action, toast)"
                  class="text-xs font-bold px-3 py-1.5 rounded-lg transition-all duration-200"
                  [class]="getActionButtonClass(action, toast)"
                >
                  {{ action.label }}
                </button>
              </div>
            </div>
            
            <button
              (click)="dismissToast(toast.id)"
              class="flex-shrink-0 transition-colors duration-200 -mt-1 -mr-1 p-1"
              style="color: var(--text-color-secondary);"
              onmouseover="this.style.color='var(--text-color)'"
              onmouseout="this.style.color='var(--text-color-secondary)'"
            >
              <i class="pi pi-times text-xs"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateY(-20px) scale(0.95)', opacity: 0 }),
        animate('300ms cubic-bezier(0.16, 1, 0.3, 1)', style({ transform: 'translateY(0) scale(1)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateY(-10px) scale(0.95)', opacity: 0 }))
      ])
    ])
  ]
})
export class ToastNotificationComponent implements OnInit, OnChanges, OnDestroy {
  @Input() toasts: Toast[] = [];
  @Output() toastDismissed = new EventEmitter<string>();

  // Mantenemos toda tu lógica intacta
  private timers = new Map<string, any>();
  private startTimes = new Map<string, number>();
  private progressIntervals = new Map<string, any>();
  private progressValues = new Map<string, number>();

  constructor(
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.initializeToasts();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['toasts'] && !changes['toasts'].firstChange) {
      this.initializeToasts();
    }
  }

  ngOnDestroy() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    this.progressIntervals.forEach(interval => clearInterval(interval));
    this.progressIntervals.clear();
    this.startTimes.clear();
    this.progressValues.clear();
  }

  private initializeToasts() {
    this.toasts.forEach(toast => {
      if (!toast.persistent && !this.timers.has(toast.id)) {
        this.startTimer(toast);
        this.startProgressUpdater(toast);
      }
    });

    const currentToastIds = new Set(this.toasts.map(t => t.id));
    this.timers.forEach((timer, toastId) => {
      if (!currentToastIds.has(toastId)) {
        clearTimeout(timer);
        this.timers.delete(toastId);
        this.startTimes.delete(toastId);
        this.progressValues.delete(toastId);
      }
    });
    
    this.progressIntervals.forEach((interval, toastId) => {
      if (!currentToastIds.has(toastId)) {
        clearInterval(interval);
        this.progressIntervals.delete(toastId);
      }
    });
  }

  trackByToastId(index: number, toast: Toast): string {
    return toast.id;
  }

  // --- MÉTODOS DE ESTILO ACTUALIZADOS PARA "ZEN" CON PRIMENG ---

  getToastContainerClass(toast: Toast): string {
    // Glassmorfismo sutil solo para errores y warnings (situaciones críticas)
    if (toast.type === 'error' || toast.type === 'warning') {
      return 'glass-effect';
    }
    return '';
  }

  // Eliminamos getIconBackgroundClass porque ya no usamos cajas de fondo
  getIconColorClass(toast: Toast): string {
    switch (toast.type) {
      case 'success': return 'text-emerald-500';
      case 'error':   return 'text-red-500';
      case 'warning': return 'text-amber-500';
      case 'info':    return 'text-gray-900 dark:text-gray-100'; // Info adaptado
      default:        return 'text-gray-400';
    }
  }

  getIconClass(toast: Toast): string {
    if (toast.icon) return toast.icon;
    switch (toast.type) {
      case 'success': return 'pi pi-check-circle';
      case 'error':   return 'pi pi-info-circle'; // Icono más suave que la X
      case 'warning': return 'pi pi-exclamation-circle';
      case 'info':    return 'pi pi-info-circle';
      default:        return 'pi pi-bell';
    }
  }

  getProgressBarClass(toast: Toast): string {
    // La barra es sólida, sin gradientes
    switch (toast.type) {
      case 'success': return 'bg-emerald-500';
      case 'error':   return 'bg-red-500';
      case 'warning': return 'bg-amber-500';
      case 'info':    return 'bg-gray-900 dark:bg-gray-100';
      default:        return 'bg-gray-300';
    }
  }

  getActionButtonClass(action: ToastAction, toast: Toast): string {
    // Botones usando variables de PrimeNG
    if (action.primary) {
      return 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-black dark:hover:bg-gray-100 shadow-sm';
    } else {
      return 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50';
    }
  }

  // --- LÓGICA ORIGINAL INTACTA ---

  getProgress(toast: Toast): number {
    if (this.progressValues.has(toast.id)) {
      return this.progressValues.get(toast.id)!;
    }
    const startTime = this.startTimes.get(toast.id);
    if (!startTime || toast.persistent) return 100;
    
    const duration = toast.duration || 3000;
    const elapsed = Date.now() - startTime;
    const progress = Math.max(0, Math.min(100, ((duration - elapsed) / duration) * 100));
    
    this.progressValues.set(toast.id, progress);
    return progress;
  }

  private startTimer(toast: Toast) {
    const duration = toast.duration || 3000;
    this.startTimes.set(toast.id, Date.now());
    
    const timer = setTimeout(() => {
      this.dismissToast(toast.id);
    }, duration);
    
    this.timers.set(toast.id, timer);
  }

  private startProgressUpdater(toast: Toast) {
    const updateInterval = 50; // Un poco más fluido
    
    const progressInterval = setInterval(() => {
      this.ngZone.runOutsideAngular(() => {
        const currentToast = this.toasts.find(t => t.id === toast.id);
        if (!currentToast || currentToast.persistent) {
          clearInterval(progressInterval);
          this.progressIntervals.delete(toast.id);
          this.progressValues.delete(toast.id);
          return;
        }

        const startTime = this.startTimes.get(toast.id);
        if (!startTime) return;
        
        const duration = toast.duration || 3000;
        const elapsed = Date.now() - startTime;
        const progress = Math.max(0, Math.min(100, ((duration - elapsed) / duration) * 100));
        
        this.progressValues.set(toast.id, progress);
        
        if (progress <= 0) {
          clearInterval(progressInterval);
          this.progressIntervals.delete(toast.id);
          this.progressValues.delete(toast.id);
        } else {
          this.ngZone.run(() => {
            this.cdr.markForCheck();
          });
        }
      });
    }, updateInterval);
    
    this.progressIntervals.set(toast.id, progressInterval);
  }

  dismissToast(toastId: string) {
    const timer = this.timers.get(toastId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(toastId);
    }
    const progressInterval = this.progressIntervals.get(toastId);
    if (progressInterval) {
      clearInterval(progressInterval);
      this.progressIntervals.delete(toastId);
    }
    
    this.startTimes.delete(toastId);
    this.progressValues.delete(toastId);
    this.toastDismissed.emit(toastId);
  }

  executeAction(action: ToastAction, toast: Toast) {
    action.action();
    if (!toast.persistent) {
      this.dismissToast(toast.id);
    }
  }
}
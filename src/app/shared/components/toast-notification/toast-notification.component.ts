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
  template: `
    <!-- Toast Container Moderno -->
    <div 
      class="fixed top-4 right-4 z-[9999] space-y-3 max-w-md"
      *ngIf="toasts.length > 0"
    >
      <div
        *ngFor="let toast of toasts; trackBy: trackByToastId"
        class="transform transition-all duration-500 ease-out"
        [class]="getToastClasses(toast)"
        [@slideInOut]
      >
        <!-- Toast Content con Glassmorphism -->
        <div class="bg-white/90 backdrop-blur-xl rounded-xl p-4 shadow-2xl border border-white/30 relative overflow-hidden">
          <!-- Barra de progreso animada -->
          <div 
            *ngIf="!toast.persistent"
            class="absolute top-0 left-0 h-1.5 bg-gradient-to-r transition-all duration-75 ease-linear rounded-t-xl"
            [class]="getProgressBarClass(toast)"
            [style.width.%]="getProgress(toast)"
          ></div>
          
          <!-- Contenido del Toast -->
          <div class="flex items-start gap-3">
            <!-- Icono con animación -->
            <div 
              class="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center shadow-lg transition-all duration-300"
              [class]="getIconBackgroundClass(toast)"
            >
              <i 
                [class]="getIconClass(toast)"
                class="text-white text-sm drop-shadow-sm transition-transform duration-300 hover:scale-110"
                [class.animate-spin]="toast.type === 'info'"
                [class.animate-bounce]="toast.type === 'success'"
                [class.animate-pulse]="toast.type === 'warning'"
              ></i>
            </div>
            
            <!-- Contenido de texto -->
            <div class="flex-1 min-w-0">
              <h4 class="text-sm font-semibold text-gray-900 mb-1 drop-shadow-sm">
                {{ toast.title }}
              </h4>
              <p class="text-sm text-gray-600/90 leading-relaxed">
                {{ toast.message }}
              </p>
              
              <!-- Acciones del Toast -->
              <div 
                *ngIf="toast.actions && toast.actions.length > 0"
                class="flex gap-2 mt-3"
              >
                <button
                  *ngFor="let action of toast.actions"
                  (click)="executeAction(action, toast)"
                  class="text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
                  [class]="getActionButtonClass(action, toast)"
                >
                  {{ action.label }}
                </button>
              </div>
            </div>
            
            <!-- Botón de cerrar -->
            <button
              (click)="dismissToast(toast.id)"
              class="flex-shrink-0 w-6 h-6 rounded-lg bg-gray-100/80 hover:bg-gray-200/80 backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 group border border-gray-200/50"
            >
              <i class="pi pi-times text-xs text-gray-600 group-hover:text-gray-800 transition-colors"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  animations: [
    trigger('slideInOut', [
      state('in', style({
        transform: 'translateX(0)',
        opacity: 1
      })),
      state('out', style({
        transform: 'translateX(100%)',
        opacity: 0
      })),
      transition('in => out', animate('300ms ease-in')),
      transition('out => in', animate('300ms ease-out')),
      transition(':enter', [
        style({
          transform: 'translateX(100%)',
          opacity: 0
        }),
        animate('300ms ease-out', style({
          transform: 'translateX(0)',
          opacity: 1
        }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({
          transform: 'translateX(100%)',
          opacity: 0
        }))
      ])
    ])
  ]
})
export class ToastNotificationComponent implements OnInit, OnChanges, OnDestroy {
  @Input() toasts: Toast[] = [];
  @Output() toastDismissed = new EventEmitter<string>();

  private timers = new Map<string, any>();
  private startTimes = new Map<string, number>();
  private progressIntervals = new Map<string, any>(); // 🆕 Para actualizar el progreso en tiempo real
  private progressValues = new Map<string, number>(); // 🆕 Cache para valores de progreso

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
    // Limpiar todos los timers e intervalos al destruir el componente
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    this.progressIntervals.forEach(interval => clearInterval(interval)); // 🆕 Limpiar intervalos
    this.progressIntervals.clear();
    this.startTimes.clear();
    this.progressValues.clear(); // 🆕 Limpiar cache de progreso
  }

  private initializeToasts() {
    // Configurar timers solo para toasts nuevos que no sean persistentes
    this.toasts.forEach(toast => {
      if (!toast.persistent && !this.timers.has(toast.id)) {
        this.startTimer(toast);
        this.startProgressUpdater(toast); // 🆕 Iniciar actualizador de progreso
      }
    });

    // Limpiar timers e intervalos para toasts que ya no existen
    const currentToastIds = new Set(this.toasts.map(t => t.id));
    this.timers.forEach((timer, toastId) => {
      if (!currentToastIds.has(toastId)) {
        clearTimeout(timer);
        this.timers.delete(toastId);
        this.startTimes.delete(toastId);
        this.progressValues.delete(toastId); // 🆕 Limpiar cache de progreso
      }
    });
    
    // 🆕 Limpiar intervalos de progreso para toasts que ya no existen
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

  getToastClasses(toast: Toast): string {
    const baseClasses = 'animate-slide-in-right';
    
    switch (toast.type) {
      case 'success':
        return `${baseClasses}`;
      case 'error':
        return `${baseClasses}`;
      case 'warning':
        return `${baseClasses}`;
      case 'info':
        return `${baseClasses}`;
      default:
        return baseClasses;
    }
  }

  getIconBackgroundClass(toast: Toast): string {
    switch (toast.type) {
      case 'success':
        return 'bg-gradient-to-br from-emerald-500/90 to-emerald-600/90 backdrop-blur-sm border border-white/20';
      case 'error':
        return 'bg-gradient-to-br from-red-500/90 to-red-600/90 backdrop-blur-sm border border-white/20';
      case 'warning':
        return 'bg-gradient-to-br from-amber-500/90 to-amber-600/90 backdrop-blur-sm border border-white/20';
      case 'info':
        return 'bg-gradient-to-br from-blue-500/90 to-blue-600/90 backdrop-blur-sm border border-white/20';
      default:
        return 'bg-gradient-to-br from-gray-500/90 to-gray-600/90 backdrop-blur-sm border border-white/20';
    }
  }

  getIconClass(toast: Toast): string {
    if (toast.icon) {
      return toast.icon;
    }
    
    switch (toast.type) {
      case 'success':
        return 'pi pi-check-circle';
      case 'error':
        return 'pi pi-times-circle';
      case 'warning':
        return 'pi pi-exclamation-triangle';
      case 'info':
        return 'pi pi-info-circle';
      default:
        return 'pi pi-bell';
    }
  }

  getProgressBarClass(toast: Toast): string {
    const baseClasses = 'shadow-sm';
    switch (toast.type) {
      case 'success':
        return `${baseClasses} from-emerald-400 to-emerald-600`;
      case 'error':
        return `${baseClasses} from-red-400 to-red-600`;
      case 'warning':
        return `${baseClasses} from-amber-400 to-amber-600`;
      case 'info':
        return `${baseClasses} from-blue-400 to-blue-600`;
      default:
        return `${baseClasses} from-gray-400 to-gray-600`;
    }
  }

  getActionButtonClass(action: ToastAction, toast: Toast): string {
    const baseClasses = 'shadow-md border';
    
    if (action.primary) {
      switch (toast.type) {
        case 'success':
          return `${baseClasses} bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500`;
        case 'error':
          return `${baseClasses} bg-red-600 hover:bg-red-700 text-white border-red-500`;
        case 'warning':
          return `${baseClasses} bg-amber-600 hover:bg-amber-700 text-white border-amber-500`;
        case 'info':
          return `${baseClasses} bg-blue-600 hover:bg-blue-700 text-white border-blue-500`;
        default:
          return `${baseClasses} bg-gray-600 hover:bg-gray-700 text-white border-gray-500`;
      }
    } else {
      return `${baseClasses} bg-white/80 hover:bg-white/90 text-gray-700 border-gray-200/50 backdrop-blur-sm`;
    }
  }

  getProgress(toast: Toast): number {
    // Usar valor cacheado si existe para evitar recálculos durante el ciclo de detección
    if (this.progressValues.has(toast.id)) {
      return this.progressValues.get(toast.id)!;
    }
    
    const startTime = this.startTimes.get(toast.id);
    if (!startTime || toast.persistent) return 100;
    
    const duration = toast.duration || 3000; // Cambiar duración por defecto a 3 segundos
    const elapsed = Date.now() - startTime;
    const progress = Math.max(0, Math.min(100, ((duration - elapsed) / duration) * 100));
    
    // Cachear el valor calculado
    this.progressValues.set(toast.id, progress);
    return progress;
  }

  private startTimer(toast: Toast) {
    const duration = toast.duration || 3000; // Cambiar duración por defecto a 3 segundos
    this.startTimes.set(toast.id, Date.now());
    
    const timer = setTimeout(() => {
      this.dismissToast(toast.id);
    }, duration);
    
    this.timers.set(toast.id, timer);
  }

  // 🆕 Método para actualizar el progreso en tiempo real
  private startProgressUpdater(toast: Toast) {
    const updateInterval = 100; // Reducir frecuencia a 100ms para mejor rendimiento
    
    const progressInterval = setInterval(() => {
      // Ejecutar fuera de la zona de Angular para evitar problemas de detección de cambios
      this.ngZone.runOutsideAngular(() => {
        // Verificar si el toast aún existe
        const currentToast = this.toasts.find(t => t.id === toast.id);
        if (!currentToast || currentToast.persistent) {
          clearInterval(progressInterval);
          this.progressIntervals.delete(toast.id);
          this.progressValues.delete(toast.id);
          return;
        }

        // Calcular el progreso actual
        const startTime = this.startTimes.get(toast.id);
        if (!startTime) return;
        
        const duration = toast.duration || 3000;
        const elapsed = Date.now() - startTime;
        const progress = Math.max(0, Math.min(100, ((duration - elapsed) / duration) * 100));
        
        // Actualizar el cache
        this.progressValues.set(toast.id, progress);
        
        // Si el progreso llegó a 0 o menos, limpiar el intervalo
        if (progress <= 0) {
          clearInterval(progressInterval);
          this.progressIntervals.delete(toast.id);
          this.progressValues.delete(toast.id);
        } else {
          // Ejecutar la detección de cambios dentro de la zona de Angular
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
    
    // 🆕 Limpiar también el intervalo de progreso
    const progressInterval = this.progressIntervals.get(toastId);
    if (progressInterval) {
      clearInterval(progressInterval);
      this.progressIntervals.delete(toastId);
    }
    
    this.startTimes.delete(toastId);
    this.progressValues.delete(toastId); // 🆕 Limpiar cache de progreso
    this.toastDismissed.emit(toastId);
  }

  executeAction(action: ToastAction, toast: Toast) {
    action.action();
    if (!toast.persistent) {
      this.dismissToast(toast.id);
    }
  }
}
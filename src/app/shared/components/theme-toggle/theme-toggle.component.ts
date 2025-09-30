import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService, Theme } from '../../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Toggle de Tema Moderno -->
    <div class="relative">
      <!-- Botón principal -->
      <button
        (click)="showOptions = !showOptions"
        class="group relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95"
        [class]="getButtonClasses()"
      >
        <!-- Icono animado -->
        <i 
          [class]="themeService.getThemeIcon()"
          class="text-sm transition-all duration-300 group-hover:scale-110"
          [class.animate-spin]="themeService.theme() === 'auto'"
        ></i>
        
        <!-- Texto (opcional) -->
        <span 
          *ngIf="showLabel" 
          class="text-xs font-medium transition-all duration-200"
        >
          {{ themeService.getThemeLabel() }}
        </span>
        
        <!-- Indicador de dropdown -->
        <i 
          class="pi pi-chevron-down text-xs transition-transform duration-200"
          [class.rotate-180]="showOptions"
        ></i>
        
        <!-- Efecto de ripple -->
        <div 
          *ngIf="rippleActive"
          class="absolute inset-0 rounded-lg bg-white/20 animate-ping"
        ></div>
      </button>

      <!-- Menú de opciones -->
      <div
        *ngIf="showOptions"
        class="absolute top-full right-0 mt-2 w-48 rounded-lg shadow-2xl border overflow-hidden z-50 animate-slide-in-down"
        [class]="getMenuClasses()"
        (click)="$event.stopPropagation()"
      >
        <!-- Opción Automático -->
        <button
          (click)="selectTheme('auto')"
          class="w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 hover:scale-[1.02]"
          [class]="getOptionClasses('auto')"
        >
          <div class="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
               [class]="getOptionIconBackground('auto')">
            <i class="pi pi-palette text-white text-sm drop-shadow-sm"></i>
          </div>
          <div class="flex-1">
            <div class="font-medium text-sm">Automático</div>
            <div class="text-xs opacity-75">Sigue el sistema</div>
          </div>
          <i 
            *ngIf="themeService.theme() === 'auto'"
            class="pi pi-check text-sm font-bold animate-bounce"
          ></i>
        </button>

        <!-- Opción Claro -->
        <button
          (click)="selectTheme('light')"
          class="w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 hover:scale-[1.02]"
          [class]="getOptionClasses('light')"
        >
          <div class="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
               [class]="getOptionIconBackground('light')">
            <i class="pi pi-sun text-white text-sm drop-shadow-sm"></i>
          </div>
          <div class="flex-1">
            <div class="font-medium text-sm">Modo Claro</div>
            <div class="text-xs opacity-75">Tema brillante</div>
          </div>
          <i 
            *ngIf="themeService.theme() === 'light'"
            class="pi pi-check text-sm font-bold animate-bounce"
          ></i>
        </button>

        <!-- Opción Oscuro -->
        <button
          (click)="selectTheme('dark')"
          class="w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 hover:scale-[1.02]"
          [class]="getOptionClasses('dark')"
        >
          <div class="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
               [class]="getOptionIconBackground('dark')">
            <i class="pi pi-moon text-white text-sm drop-shadow-sm"></i>
          </div>
          <div class="flex-1">
            <div class="font-medium text-sm">Modo Oscuro</div>
            <div class="text-xs opacity-75">Tema nocturno</div>
          </div>
          <i 
            *ngIf="themeService.theme() === 'dark'"
            class="pi pi-check text-sm font-bold animate-bounce"
          ></i>
        </button>

        <!-- Divider -->
        <div class="border-t mx-2 my-1" [class]="getDividerClass()"></div>

        <!-- Toggle rápido -->
        <button
          (click)="quickToggle()"
          class="w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 hover:scale-[1.02]"
          [class]="getQuickToggleClasses()"
        >
          <div class="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
               [class]="getQuickToggleIconBackground()">
            <i class="pi pi-refresh text-white text-sm drop-shadow-sm animate-spin"></i>
          </div>
          <div class="flex-1">
            <div class="font-medium text-sm">Alternar Rápido</div>
            <div class="text-xs opacity-75">Cambiar tema al instante</div>
          </div>
          <kbd class="px-2 py-1 rounded text-xs font-mono font-bold opacity-75 border">
            Ctrl+D
          </kbd>
        </button>
      </div>

      <!-- Overlay para cerrar -->
      <div
        *ngIf="showOptions"
        class="fixed inset-0 z-40"
        (click)="showOptions = false"
      ></div>
    </div>
  `,
  styles: [`
    @keyframes slide-in-down {
      from {
        opacity: 0;
        transform: translateY(-10px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    
    .animate-slide-in-down {
      animation: slide-in-down 0.2s ease-out;
    }
  `]
})
export class ThemeToggleComponent {
  public themeService = inject(ThemeService);
  
  showOptions = false;
  showLabel = false;
  rippleActive = false;

  constructor() {
    // Escuchar Ctrl+D para toggle rápido
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        this.quickToggle();
      }
    });
  }

  selectTheme(theme: Theme): void {
    this.triggerRipple();
    this.themeService.setTheme(theme);
    setTimeout(() => {
      this.showOptions = false;
    }, 150);
  }

  quickToggle(): void {
    this.triggerRipple();
    this.themeService.toggle();
    this.showOptions = false;
  }

  private triggerRipple(): void {
    this.rippleActive = true;
    setTimeout(() => {
      this.rippleActive = false;
    }, 300);
  }

  getButtonClasses(): string {
    const colors = this.themeService.getThemeColors();
    return `${colors.glass} ${colors.text} shadow-lg border hover:shadow-xl`;
  }

  getMenuClasses(): string {
    const colors = this.themeService.getThemeColors();
    return `${colors.surface} ${colors.border} backdrop-blur-xl`;
  }

  getOptionClasses(theme: Theme): string {
    const colors = this.themeService.getThemeColors();
    const isSelected = this.themeService.theme() === theme;
    
    return `${colors.text} ${colors.hover} ${isSelected ? colors.active : ''}`;
  }

  getOptionIconBackground(theme: Theme): string {
    const isSelected = this.themeService.theme() === theme;
    
    switch (theme) {
      case 'auto':
        return isSelected 
          ? 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg scale-110' 
          : 'bg-gradient-to-br from-purple-400/80 to-purple-500/80';
      case 'light':
        return isSelected 
          ? 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg scale-110' 
          : 'bg-gradient-to-br from-amber-400/80 to-amber-500/80';
      case 'dark':
        return isSelected 
          ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg scale-110' 
          : 'bg-gradient-to-br from-indigo-400/80 to-indigo-500/80';
      default:
        return 'bg-gradient-to-br from-gray-400/80 to-gray-500/80';
    }
  }

  getQuickToggleClasses(): string {
    const colors = this.themeService.getThemeColors();
    return `${colors.text} hover:bg-blue-500/10 border-t ${colors.borderLight}`;
  }

  getQuickToggleIconBackground(): string {
    return 'bg-gradient-to-br from-blue-500/80 to-blue-600/80';
  }

  getDividerClass(): string {
    const colors = this.themeService.getThemeColors();
    return colors.borderLight;
  }
}
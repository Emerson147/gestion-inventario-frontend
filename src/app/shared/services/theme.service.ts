import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark' | 'auto';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Señales reactivas para el tema
  private themeSignal = signal<Theme>('auto');
  private isDarkSignal = signal<boolean>(false);

  // Getters públicos para las señales
  public theme = this.themeSignal.asReadonly();
  public isDark = this.isDarkSignal.asReadonly();

  constructor() {
    // Cargar tema guardado o usar 'auto' por defecto
    const savedTheme = localStorage.getItem('theme') as Theme || 'auto';
    this.themeSignal.set(savedTheme);

    // Detectar preferencia del sistema
    this.detectSystemTheme();

    // Efecto que aplica el tema cuando cambia
    effect(() => {
      this.applyTheme();
    });

    // Escuchar cambios en la preferencia del sistema
    this.setupSystemThemeListener();
  }

  /**
   * Cambia el tema de la aplicación
   */
  setTheme(theme: Theme): void {
    this.themeSignal.set(theme);
    localStorage.setItem('theme', theme);
  }

  /**
   * Alterna entre modo claro y oscuro
   */
  toggle(): void {
    const currentTheme = this.themeSignal();
    if (currentTheme === 'auto') {
      // Si está en auto, cambiar a dark o light según el estado actual
      this.setTheme(this.isDarkSignal() ? 'light' : 'dark');
    } else {
      // Si está manual, alternar
      this.setTheme(currentTheme === 'light' ? 'dark' : 'light');
    }
  }

  /**
   * Detecta la preferencia del sistema
   */
  private detectSystemTheme(): void {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.updateDarkMode(prefersDark);
  }

  /**
   * Configura el listener para cambios en la preferencia del sistema
   */
  private setupSystemThemeListener(): void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    mediaQuery.addEventListener('change', (e) => {
      if (this.themeSignal() === 'auto') {
        this.updateDarkMode(e.matches);
      }
    });
  }

  /**
   * Actualiza el estado del modo oscuro
   */
  private updateDarkMode(isDark: boolean): void {
    this.isDarkSignal.set(isDark);
  }

  /**
   * Aplica el tema actual al documento
   */
  private applyTheme(): void {
    const theme = this.themeSignal();
    const isDark = this.shouldUseDarkMode(theme);
    
    this.updateDarkMode(isDark);
    
    // Aplicar clase al documento
    const root = document.documentElement;
    
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }

    // Actualizar meta theme-color para móviles
    this.updateThemeColor(isDark);
  }

  /**
   * Determina si debe usar modo oscuro basado en el tema seleccionado
   */
  private shouldUseDarkMode(theme: Theme): boolean {
    switch (theme) {
      case 'dark':
        return true;
      case 'light':
        return false;
      case 'auto':
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      default:
        return false;
    }
  }

  /**
   * Actualiza el theme-color meta tag para móviles
   */
  private updateThemeColor(isDark: boolean): void {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const color = isDark ? '#1f2937' : '#ffffff'; // gray-800 : white
    
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', color);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = color;
      document.head.appendChild(meta);
    }
  }

  /**
   * Obtiene las clases CSS para el tema actual
   */
  getThemeClasses(): string {
    const isDark = this.isDarkSignal();
    
    return isDark 
      ? 'dark bg-gray-900 text-white'
      : 'light bg-gray-50 text-gray-900';
  }

  /**
   * Obtiene colores contextuales para el tema actual
   */
  getThemeColors() {
    const isDark = this.isDarkSignal();
    
    return {
      // Fondos
      background: isDark ? 'bg-gray-900' : 'bg-gray-50',
      surface: isDark ? 'bg-gray-800' : 'bg-white',
      card: isDark ? 'bg-gray-800/90' : 'bg-white/90',
      
      // Bordes
      border: isDark ? 'border-gray-700' : 'border-gray-200',
      borderLight: isDark ? 'border-gray-600/50' : 'border-gray-200/50',
      
      // Texto
      text: isDark ? 'text-white' : 'text-gray-900',
      textSecondary: isDark ? 'text-gray-300' : 'text-gray-600',
      textMuted: isDark ? 'text-gray-400' : 'text-gray-500',
      
      // Estados
      hover: isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100',
      active: isDark ? 'bg-gray-600' : 'bg-gray-200',
      
      // Efectos Glassmorphism
      glass: isDark 
        ? 'bg-gray-800/80 backdrop-blur-xl border-gray-700/50' 
        : 'bg-white/80 backdrop-blur-xl border-white/30',
        
      glassSecondary: isDark
        ? 'bg-gray-700/60 backdrop-blur-lg border-gray-600/30'
        : 'bg-white/70 backdrop-blur-lg border-gray-200/50'
    };
  }

  /**
   * Obtiene el icono apropiado para el toggle del tema
   */
  getThemeIcon(): string {
    const theme = this.themeSignal();
    const isDark = this.isDarkSignal();
    
    switch (theme) {
      case 'dark':
        return 'pi pi-moon';
      case 'light':
        return 'pi pi-sun';
      case 'auto':
        return isDark ? 'pi pi-moon' : 'pi pi-sun';
      default:
        return 'pi pi-palette';
    }
  }

  /**
   * Obtiene el texto descriptivo del tema actual
   */
  getThemeLabel(): string {
    const theme = this.themeSignal();
    const isDark = this.isDarkSignal();
    
    switch (theme) {
      case 'dark':
        return 'Modo Oscuro';
      case 'light':
        return 'Modo Claro';
      case 'auto':
        return `Automático (${isDark ? 'Oscuro' : 'Claro'})`;
      default:
        return 'Tema';
    }
  }
}
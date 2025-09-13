import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { ColorPickerModule } from 'primeng/colorpicker';
import { ChipsModule } from 'primeng/chips';
import { PanelModule } from 'primeng/panel'; // 👈 Nuevo import
import { TooltipModule } from 'primeng/tooltip'; // 👈 Nuevo import
import { AvatarModule } from 'primeng/avatar'; // 👈 Nuevo import
import { CardModule } from 'primeng/card'; // 👈 Nuevo import
import { ChipModule } from 'primeng/chip'; // 👈 Nuevo import
import { BadgeModule } from 'primeng/badge'; // 👈 Nuevo import
import { TabViewModule } from 'primeng/tabview'; // 👈 Nuevo import
import { SelectButtonModule } from 'primeng/selectbutton'; // 👈 Nuevo import
import { OverlayPanelModule } from 'primeng/overlaypanel'; // 👈 Nuevo import
import { SliderModule } from 'primeng/slider'; // 👈 Nuevo import

import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { Color, Talla } from '../../../core/models/colors.model';
import { Producto } from '../../../core/models/product.model';
import { ColorService } from '../../../core/services/colores.service';
import { ProductoService } from '../../../core/services/producto.service';
import { PermissionService, PermissionType } from '../../../core/services/permission.service';
import { finalize, forkJoin, catchError, of, firstValueFrom } from 'rxjs';

interface ViewOption {
  label: string;
  value: 'table' | 'palette' | 'grid';
  icon: string;
}

interface TallaCategory {
  label: string;
  value: string;
  sizes: string[];
  icon: string;
  color: string;
}

interface ColorStats {
  totalColores: number;
  totalTallas: number;
  combinaciones: number;
  coloresPopulares: { color: Color, count: number }[];
  tallasPopulares: { talla: string, count: number }[];
  distribucionTallas: { categoria: string, count: number }[];
}

@Component({
  selector: 'app-colores',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    ChipsModule,
    ColorPickerModule,
    ConfirmDialogModule,
    DialogModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    ToastModule,
    ToolbarModule,
    PanelModule, // 👈 Nuevo import
    TooltipModule, // 👈 Nuevo import
    AvatarModule, // 👈 Nuevo import
    CardModule, // 👈 Nuevo import
    ChipModule, // 👈 Nuevo import
    BadgeModule, // 👈 Nuevo import
    TabViewModule, // 👈 Nuevo import
    SelectButtonModule, // 👈 Nuevo import
    OverlayPanelModule, // 👈 Nuevo import
    SliderModule, // 👈 Nuevo import
    HasPermissionDirective
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './colores.component.html',
  styles: [`
    :host ::ng-deep {
      /* Paleta de colores moderna */
      .color-palette-item {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
      }
      
      .color-palette-item:hover {
        transform: scale(1.05);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      }
      
      /* Color picker personalizado */
      .p-colorpicker-input {
        border-radius: 12px !important;
        border: 2px solid #e5e7eb !important;
        transition: all 0.3s ease !important;
      }
      
      .p-colorpicker-input:focus {
        border-color: #8b5cf6 !important;
        box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1) !important;
      }
      
      /* Chips de tallas modernos */
      .p-chip {
        border-radius: 20px !important;
        padding: 0.5rem 0.75rem !important;
        font-weight: 600 !important;
        transition: all 0.3s ease !important;
      }
      
      .p-chip:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      
      /* Tabs modernos */
      .p-tabview .p-tabview-nav li .p-tabview-nav-link {
        border-radius: 12px 12px 0 0 !important;
        transition: all 0.3s ease !important;
      }
      
      /* Cards con efectos */
      .p-card {
        border-radius: 16px !important;
        transition: all 0.3s ease !important;
        border: 1px solid #f3f4f6 !important;
      }
      
      .p-card:hover {
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1) !important;
      }
      
      /* Dialogs modernos */
      .color-dialog-header .p-dialog-header {
        background: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%) !important;
        color: white !important;
        border: none !important;
        border-radius: 16px 16px 0 0 !important;
      }
      
      /* Botones con efectos modernos */
      .p-button {
        border-radius: 12px !important;
        transition: all 0.3s ease !important;
      }
      
      .p-button:hover {
        transform: translateY(-1px);
      }
      
      /* Sliders modernos */
      .p-slider .p-slider-handle {
        border-radius: 50% !important;
        transition: all 0.3s ease !important;
      }
    }

    /* 👇 Utilidades CSS personalizadas */
    .color-preview {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
    }

    .color-preview:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.25);
    }

    .talla-chip {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .talla-chip:hover {
      transform: translateY(-1px);
    }

    .gradient-bg {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .palette-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }

    .size-chart {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
      gap: 0.5rem;
    }

    /* Animaciones de entrada */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .fade-in-up {
      animation: fadeInUp 0.6s ease-out;
    }

    /* Color wheel efecto */
    .color-wheel {
      background: conic-gradient(
        hsl(360, 100%, 50%),
        hsl(315, 100%, 50%),
        hsl(270, 100%, 50%),
        hsl(225, 100%, 50%),
        hsl(180, 100%, 50%),
        hsl(135, 100%, 50%),
        hsl(90, 100%, 50%),
        hsl(45, 100%, 50%),
        hsl(0, 100%, 50%)
      );
      border-radius: 50%;
    }
  `]
})
export class ColoresComponent implements OnInit, AfterViewInit {
  @ViewChild('coloresTable') coloresTable!: ElementRef;

  // ========== DATOS Y ESTADO ==========
  colores: Color[] = [];
  coloresFiltrados: Color[] = [];
  selectedColores: Color[] = [];
  productos: Producto[] = [];
  tallasDisponibles: string[] = [];

  // ========== FILTROS ==========
  productoSeleccionadoFiltro: Producto | null = null;
  filtroTexto = '';
  filtroTalla = '';

  // ========== FORMULARIO ==========
  color: Color = this.initColor();
  productoSeleccionado: Producto | null = null;
  tallas: Talla[] = [];
  nuevaTalla = '';

  // ========== ESTADO UI ==========
  visible = false;
  editMode = false;
  loading = false;
  submitted = false;
  currentView: 'table' | 'palette' | 'grid' = 'palette';
  
  // 👇 Nuevas propiedades para el diseño moderno
  estadisticasDialog = false;
  detalleColorDialog = false;
  colorDetalle: Color | null = null;
  filtrosPanelCollapsed = true;
  activeTab = 0; // 0: Colores, 1: Tallas, 2: Combinaciones
  
  // Color picker avanzado
  brightness = 100;
  saturation = 100;
  selectedColorPreset = '';

  // ========== PERMISOS ==========
  permissionTypes = PermissionType;

  // ========== CONFIGURACIÓN ==========
  viewOptions: ViewOption[] = [
    { label: 'Paleta', value: 'palette', icon: 'pi pi-palette' },
    { label: 'Tabla', value: 'table', icon: 'pi pi-list' }
  ];

  // Categorías de tallas mejoradas
  tallaCategories: TallaCategory[] = [
    {
      label: 'Ropa General',
      value: 'ropa',
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
      icon: 'pi pi-user',
      color: 'blue'
    },
    {
      label: 'Tallas Numéricas',
      value: 'numericas',
      sizes: ['32', '34', '36', '38', '40', '42', '44', '46', '48'],
      icon: 'pi pi-hashtag',
      color: 'green'
    },
    {
      label: 'Calzado',
      value: 'calzado',
      sizes: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
      icon: 'pi pi-map',
      color: 'orange'
    },
    {
      label: 'Niños',
      value: 'ninos',
      sizes: ['2T', '3T', '4T', '5T', '6', '7', '8', '10', '12', '14', '16'],
      icon: 'pi pi-heart',
      color: 'pink'
    }
  ];

  // Colores preset populares
  coloresPreset = [
    { nombre: 'Rojo', hex: '#ef4444', popular: true },
    { nombre: 'Azul', hex: '#3b82f6', popular: true },
    { nombre: 'Verde', hex: '#10b981', popular: true },
    { nombre: 'Amarillo', hex: '#f59e0b', popular: true },
    { nombre: 'Morado', hex: '#8b5cf6', popular: true },
    { nombre: 'Rosa', hex: '#ec4899', popular: true },
    { nombre: 'Negro', hex: '#000000', popular: true },
    { nombre: 'Blanco', hex: '#ffffff', popular: true },
    { nombre: 'Gris', hex: '#6b7280', popular: false },
    { nombre: 'Marrón', hex: '#92400e', popular: false },
    { nombre: 'Naranja', hex: '#ea580c', popular: false },
    { nombre: 'Índigo', hex: '#4f46e5', popular: false }
  ];

  private readonly colorService: ColorService = inject(ColorService);
  private readonly productoService: ProductoService = inject(ProductoService);
  private readonly messageService: MessageService = inject(MessageService);
  private readonly confirmationService: ConfirmationService = inject(ConfirmationService);
  private readonly permissionService: PermissionService = inject(PermissionService);

  
  ngOnInit(): void {
    this.loadProductos();
  }

  ngAfterViewInit(): void {
    // Animaciones de entrada
    if (this.coloresTable) {
      setTimeout(() => {
        const elements = document.querySelectorAll('.fade-in-up');
        elements.forEach((el, index) => {
          (el as HTMLElement).style.animationDelay = `${index * 0.1}s`;
        });
      }, 100);
    }
  }

  // ========== NUEVOS MÉTODOS PARA EL DISEÑO MODERNO ==========

  /**
   * 👇 Calcula métricas avanzadas del sistema de colores y tallas
   */
  calcularEstadisticas(): ColorStats {
    const totalColores = this.coloresFiltrados?.length || 0;
    const totalTallas = this.getTotalTallas();
    const combinaciones = this.getTotalCombinaciones();
    
    // Colores más populares (simulado - podrías obtenerlo del backend)
    const coloresPopulares = this.coloresFiltrados
      .map(color => ({ color, count: color.tallas?.length || 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Tallas más populares
    const tallasMap = new Map<string, number>();
    this.coloresFiltrados.forEach(color => {
      color.tallas?.forEach(talla => {
        const count = tallasMap.get(talla.numero) || 0;
        tallasMap.set(talla.numero, count + 1);
      });
    });

    const tallasPopulares = Array.from(tallasMap.entries())
      .map(([talla, count]) => ({ talla, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Distribución por categorías
    const distribucionTallas = this.tallaCategories.map(categoria => ({
      categoria: categoria.label,
      count: this.getTallasPorCategoria(categoria.sizes)
    }));

    return {
      totalColores,
      totalTallas,
      combinaciones,
      coloresPopulares,
      tallasPopulares,
      distribucionTallas
    };
  }

  /**
   * 👇 Obtiene total de tallas únicas
   */
  getTotalTallas(): number {
    const tallasUnicas = new Set<string>();
    this.coloresFiltrados.forEach(color => {
      color.tallas?.forEach(talla => tallasUnicas.add(talla.numero));
    });
    return tallasUnicas.size;
  }

  /**
   * 👇 Obtiene total de combinaciones color-talla
   */
  getTotalCombinaciones(): number {
    return this.coloresFiltrados.reduce((total, color) => 
      total + (color.tallas?.length || 0), 0
    );
  }

  /**
   * 👇 Cuenta tallas por categoría
   */
  getTallasPorCategoria(sizesCategoria: string[]): number {
    const tallasEnCategoria = new Set<string>();
    this.coloresFiltrados.forEach(color => {
      color.tallas?.forEach(talla => {
        if (sizesCategoria.includes(talla.numero)) {
          tallasEnCategoria.add(talla.numero);
        }
      });
    });
    return tallasEnCategoria.size;
  }

  /**
   * 👇 Tracking para mejor performance en ngFor
   */
  trackByColor(index: number, color: Color): number | undefined {
    return color.id || index;
  }

  /**
   * 👇 Muestra detalles del color en modal
   */
  verDetallesColor(color: Color): void {
    this.colorDetalle = { ...color };
    this.detalleColorDialog = true;
  }

  /**
   * 👇 Muestra estadísticas completas
   */
  mostrarEstadisticas(): void {
    this.estadisticasDialog = true;
  }

  /**
   * �343 Aplica color preset seleccionado
   */
  aplicarColorPreset(colorPreset: { hex: string; nombre: string }): void {
    this.color.codigoHex = colorPreset.hex;
    if (!this.color.nombre.trim()) {
      this.color.nombre = colorPreset.nombre;
    }
  }

  /**
   * 👇 Genera color aleatorio
   */
  generarColorAleatorio(): void {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    this.color.codigoHex = color;
  }

  /**
   * 👇 Convierte HEX a RGB
   */
  hexToRgb(hex: string): { r: number, g: number, b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * 👇 Obtiene colores similares
   */
  getColoresSimilares(color: Color): Color[] {
    if (!color.codigoHex) return [];
    
    const targetRgb = this.hexToRgb(color.codigoHex);
    if (!targetRgb) return [];

    return this.coloresFiltrados
      .filter(c => c.id !== color.id && c.codigoHex)
      .filter(c => {
        const rgb = this.hexToRgb(c.codigoHex!);
        if (!rgb) return false;
        
        const distance = Math.sqrt(
          Math.pow(targetRgb.r - rgb.r, 2) +
          Math.pow(targetRgb.g - rgb.g, 2) +
          Math.pow(targetRgb.b - rgb.b, 2)
        );
        
        return distance < 100; // Umbral de similitud
      })
      .slice(0, 3);
  }

  /**
   * 👇 Obtiene nombre del color basado en HSL
   */
  getNombreColorSugerido(hex: string): string {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return 'Color personalizado';

    const { r, g, b } = rgb;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    
    if (diff < 30) {
      if (max < 50) return 'Negro';
      if (max > 200) return 'Blanco';
      return 'Gris';
    }

    let hue = 0;
    if (max === r) hue = ((g - b) / diff) % 6;
    else if (max === g) hue = (b - r) / diff + 2;
    else hue = (r - g) / diff + 4;
    
    hue = Math.round(hue * 60);
    if (hue < 0) hue += 360;

    if (hue < 30 || hue >= 330) return 'Rojo';
    if (hue < 90) return 'Amarillo';
    if (hue < 150) return 'Verde';
    if (hue < 210) return 'Cian';
    if (hue < 270) return 'Azul';
    return 'Magenta';
  }

  /**
   * 👇 Agregar múltiples tallas de una categoría
   */
  agregarTallasCategoria(categoria: TallaCategory): void {
    let agregadas = 0;
    categoria.sizes.forEach(size => {
      if (!this.tallas.some(t => t.numero === size)) {
        this.tallas.push({ numero: size });
        agregadas++;
      }
    });
    
    if (agregadas > 0) {
      this.showSuccess(`${agregadas} tallas agregadas de ${categoria.label}`);
    } else {
      this.showWarning(`Todas las tallas de ${categoria.label} ya están agregadas`);
    }
  }

  /**
   * 👇 Cierra modales
   */
  hideDetalleColorDialog(): void {
    this.detalleColorDialog = false;
    this.colorDetalle = null;
  }

  hideEstadisticasDialog(): void {
    this.estadisticasDialog = false;
  }

  /**
   * 👇 Cuenta filtros activos
   */
  getTotalFiltrosActivos(): number {
    let count = 0;
    if (this.filtroTexto?.trim()) count++;
    if (this.filtroTalla?.trim()) count++;
    if (this.productoSeleccionadoFiltro) count++;
    return count;
  }

  // ========== MÉTODOS DE CARGA (Manteniendo funcionalidad original) ==========

  loadProductos(): void {
    this.productoService.getProducts(0, 1000).subscribe({
      next: (response) => {
        this.productos = response.contenido || [];
      },
      error: (error) => this.handleError(error, 'No se pudo cargar los productos')
    });
  }

  cargarColoresPorProducto(): void {
    if (!this.productoSeleccionadoFiltro?.id) {
      this.colores = []; // 👈 Limpiar array principal
      this.coloresFiltrados = [];
      this.selectedColores = [];
      return;
    }
    
    this.loading = true;
    this.colorService.getColoresPorProducto(this.productoSeleccionadoFiltro.id).subscribe({
      next: (response) => {
        console.log('Colores cargados:', response); // 👈 Debug temporal
        this.colores = response || []; // 👈 Actualizar array principal
        this.coloresFiltrados = [...this.colores]; // 👈 Copiar al filtrado
        this.aplicarFiltrosTexto(); // 👈 Aplicar filtros existentes
      },
      error: (error) => {
        this.handleError(error, 'No se pudieron cargar los colores para este producto');
        this.colores = []; // 👈 Limpiar en caso de error
        this.coloresFiltrados = [];
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  debugColores(): void {
    console.log('=== DEBUG COLORES ===');
    console.log('Producto seleccionado:', this.productoSeleccionadoFiltro);
    console.log('Array colores (principal):', this.colores);
    console.log('Array coloresFiltrados:', this.coloresFiltrados);
    console.log('Loading:', this.loading);
    console.log('Vista actual:', this.currentView);
  }

  // ========== FILTROS MEJORADOS ==========

  aplicarFiltrosTexto(): void {
    // 👈 Usar el array principal 'colores' en lugar de verificar producto
    let coloresFiltrados = [...this.colores];
  
    // Filtro por texto (nombre del color)
    if (this.filtroTexto?.trim()) {
      const texto = this.filtroTexto.toLowerCase();
      coloresFiltrados = coloresFiltrados.filter(color => 
        color.nombre?.toLowerCase().includes(texto)
      );
    }
  
    // Filtro por talla
    if (this.filtroTalla?.trim()) {
      coloresFiltrados = coloresFiltrados.filter(color => 
        color.tallas?.some(talla => 
          talla.numero.toLowerCase().includes(this.filtroTalla.toLowerCase())
        )
      );
    }
  
    this.coloresFiltrados = coloresFiltrados;
  }

  limpiarFiltros(): void {
    this.productoSeleccionadoFiltro = null;
    this.filtroTexto = '';
    this.filtroTalla = '';
    this.coloresFiltrados = [];
    this.selectedColores = [];
  }

  // ========== CRUD (Manteniendo funcionalidad original mejorada) ==========

  openNew(): void {
    if (!this.permissionService.canCreate('colores')) {
      this.showError('No tiene permisos para crear colores');
      return;
    }

    this.editMode = false;
    this.color = this.initColor();
    this.productoSeleccionado = this.productoSeleccionadoFiltro;
    this.tallas = [];
    this.nuevaTalla = '';
    this.submitted = false;
    this.visible = true;
    this.brightness = 100;
    this.saturation = 100;
  }

  editColor(color: Color): void {
    if (!this.permissionService.canEdit('colores')) {
      this.showError('No tiene permisos para editar colores');
      return;
    }

    this.editMode = true;
    this.color = { ...color };
    this.productoSeleccionado = this.productoSeleccionadoFiltro;
    this.tallas = [...(color.tallas || [])];
    this.submitted = false;
    this.visible = true;
  }

  guardarColor(): void {
    this.submitted = true;
    
    if (!this.isValidColor()) {
      return;
    }
    
    const colorRequest = {
      nombre: this.color.nombre.trim(),
      codigoHex: this.color.codigoHex,
      tallas: this.tallas.map(t => ({ numero: t.numero }))
    };
    
    this.loading = true;

    if (this.editMode && this.color.id) {
      this.colorService.actualizarColor(this.color.id, colorRequest)
        .pipe(finalize(() => this.loading = false))
        .subscribe({
          next: () => {
            this.showSuccess('Color actualizado correctamente');
            this.hideDialog();
            this.cargarColoresPorProducto();
          },
          error: (error) => this.handleError(error, 'No se pudo actualizar el color')
        });
    } else {
      const productoId = this.productoSeleccionado?.id || this.productoSeleccionadoFiltro?.id;
      
      if (!productoId) {
        this.showError('Debe seleccionar un producto');
        this.loading = false;
        return;
      }
      
      this.colorService.crearColor(productoId, colorRequest)
        .pipe(finalize(() => this.loading = false))
        .subscribe({
          next: () => {
            this.showSuccess('Color creado correctamente');
            this.hideDialog();
            this.cargarColoresPorProducto();
          },
          error: (error) => this.handleError(error, 'No se pudo crear el color')
        });
    }
  }

  eliminarColor(color: Color): void {
    if (!this.permissionService.canDelete('colores')) {
      this.showError('No tiene permisos para eliminar colores');
      return;
    }

    if (!color.id) return;
    
    this.confirmationService.confirm({
      message: `¿Está seguro que desea eliminar el color "${color.nombre}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.loading = true;
        this.colorService.eliminarColor(color.id!)
          .pipe(finalize(() => this.loading = false))
          .subscribe({
            next: () => {
              this.showSuccess('Color eliminado correctamente');
              this.cargarColoresPorProducto();
              this.selectedColores = [];
            },
            error: (error) => this.handleError(error, 'No se pudo eliminar el color, tiene inventario asociado')
          });
      }
    });
  }

  eliminarColoresSeleccionados(): void {
    if (!this.permissionService.canDelete('colores')) {
      this.showError('No tiene permisos para eliminar colores');
      return;
    }

    if (!this.selectedColores.length) return;
    
    this.confirmationService.confirm({
      message: `¿Está seguro que desea eliminar los ${this.selectedColores.length} colores seleccionados?`,
      header: 'Confirmar eliminación múltiple',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.processMultipleDelete()
    });
  }

  // ========== GESTIÓN DE TALLAS (Manteniendo funcionalidad original) ==========

  agregarTalla(): void {
    if (!this.nuevaTalla?.trim()) return;
    
    const tallaNumero = this.nuevaTalla.trim().toUpperCase();
    
    if (this.tallas.some(t => t.numero === tallaNumero)) {
      this.showWarning(`La talla ${tallaNumero} ya existe en este color`);
      return;
    }
    
    this.tallas.push({ numero: tallaNumero });
    this.nuevaTalla = '';
  }

  agregarTallaComun(talla: string): void {
    if (this.tallas.some(t => t.numero === talla)) {
      this.showWarning(`La talla ${talla} ya existe en este color`);
      return;
    }
    
    this.tallas.push({ numero: talla });
  }

  eliminarTalla(index: number): void {
    this.tallas.splice(index, 1);
  }

  eliminarTallaPorId(tallaId: number | undefined): void {
    if (!tallaId) return;
    this.tallas = this.tallas.filter(talla => talla.id !== tallaId);
  }

  // ========== VALIDACIONES (Manteniendo funcionalidad original) ==========

  private isValidColor(): boolean {
    if (!this.color.nombre?.trim()) {
      this.showError('El nombre del color es obligatorio');
      return false;
    }

    if (this.color.nombre.length < 2) {
      this.showError('El nombre debe tener al menos 2 caracteres');
      return false;
    }

    if (!this.editMode && !this.productoSeleccionado && !this.productoSeleccionadoFiltro) {
      this.showError('Debe seleccionar un producto');
      return false;
    }

    if (this.tallas.length === 0) {
      this.showError('Debe agregar al menos una talla');
      return false;
    }

    return true;
  }

  private async processMultipleDelete(): Promise<void> {
    this.loading = true;
    
    try {
      const deleteOperations = this.selectedColores
        .filter(color => color.id)
        .map(color => 
          this.colorService.eliminarColor(color.id!)
            .pipe(catchError(() => of(false)))
        );
        
      if (deleteOperations.length === 0) {
        this.loading = false;
        return;
      }

      const results = await firstValueFrom(forkJoin(deleteOperations));
      const successful = results.filter(result => result !== false).length;
      const failed = results.length - successful;

      this.showDeleteResults(successful, failed);
      this.cargarColoresPorProducto();
      this.selectedColores = [];
    } catch (error) {
      this.handleError(error, 'No se pudieron eliminar algunos colores');
    } finally {
      this.loading = false;
    }
  }

  private showDeleteResults(successful: number, failed: number): void {
    if (successful > 0) {
      this.showSuccess(`${successful} colores eliminados correctamente`);
    }
    
    if (failed > 0) {
      this.showWarning(`${failed} colores no pudieron ser eliminados (pueden tener inventario asociado)`);
    }
  }

  // ========== UTILIDADES (Manteniendo y expandiendo funcionalidad original) ==========

  hideDialog(): void {
    this.visible = false;
    this.submitted = false;
    this.color = this.initColor();
    this.tallas = [];
    this.nuevaTalla = '';
  }

  onGlobalFilter(dt: { filterGlobal: (value: string, filterType: string) => void }, event: Event): void {
    const element = event.target as HTMLInputElement;
    dt.filterGlobal(element.value, 'contains');
  }

  trackByTalla(index: number, talla: Talla): number | undefined {
    return talla.id || index;
  }

  // ========== EXPORTACIÓN (Manteniendo y expandiendo funcionalidad original) ==========

  exportarExcel(): void {
    if (!this.coloresFiltrados?.length) {
      this.showWarning('No hay datos para exportar');
      return;
    }

    import('xlsx').then(xlsx => {
      const dataToExport = this.coloresFiltrados.map(color => ({
        'Color': color.nombre || '',
        'Código Hex': color.codigoHex || '',
        'Producto': this.productoSeleccionadoFiltro?.nombre || '',
        'Tallas': color.tallas?.map(t => t.numero).join(', ') || '',
        'Total Tallas': color.tallas?.length || 0
      }));
      
      const worksheet = xlsx.utils.json_to_sheet(dataToExport);
      const workbook = { Sheets: { 'Colores': worksheet }, SheetNames: ['Colores'] };
      const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
      this.guardarArchivo(excelBuffer, 'colores_tallas');
    }).catch(() => {
      this.showError('Error al cargar la biblioteca de exportación');
    });
  }

  /**
   * 👇 Exporta estadísticas de colores y tallas
   */
  async exportarEstadisticas(): Promise<void> {
    if (!this.coloresFiltrados?.length) {
      this.showWarning('No hay datos para exportar estadísticas');
      return;
    }

    try {
      const xlsx = await import('xlsx');
      const stats = this.calcularEstadisticas();
      
      // Datos de resumen
      const resumenData = [
        ['ESTADÍSTICAS DE COLORES Y TALLAS', ''],
        ['Total de Colores', stats.totalColores],
        ['Total de Tallas Únicas', stats.totalTallas],
        ['Total de Combinaciones', stats.combinaciones],
        ['Producto', this.productoSeleccionadoFiltro?.nombre || 'Todos'],
        ['', ''],
        ['COLORES MÁS POPULARES', ''],
        ['Color', 'Cantidad de Tallas'],
        ...stats.coloresPopulares.map(item => [item.color.nombre, item.count])
      ];

      // Datos de tallas populares
      const tallasData = [
        ['TALLAS MÁS POPULARES', ''],
        ['Talla', 'Cantidad de Colores'],
        ...stats.tallasPopulares.map(item => [item.talla, item.count])
      ];

      // Crear hojas
      const resumenSheet = xlsx.utils.aoa_to_sheet(resumenData);
      const tallasSheet = xlsx.utils.aoa_to_sheet(tallasData);
      
      const workbook = {
        Sheets: {
          'Resumen': resumenSheet,
          'Tallas Populares': tallasSheet
        },
        SheetNames: ['Resumen', 'Tallas Populares']
      };

      const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
      this.guardarArchivo(excelBuffer, 'estadisticas_colores_tallas');
      
      this.showSuccess('Estadísticas exportadas correctamente');
      this.hideEstadisticasDialog();
    } catch (error) {
      this.handleError(error, 'Error al exportar estadísticas');
    }
  }

  private guardarArchivo(buffer: ArrayBuffer, fileName: string): void {
    const data = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(data);
    link.download = `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    link.click();
  }

  // ========== INICIALIZACIÓN (Manteniendo funcionalidad original) ==========

  private initColor(): Color {
    return {
      id: undefined,
      nombre: '',
      codigoHex: '#000000',
      tallas: []
    };
  }

  // ========== MENSAJES (Manteniendo funcionalidad original) ==========

  private showSuccess(message: string): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: message,
      life: 3000
    });
  }

  private showWarning(message: string): void {
    this.messageService.add({
      severity: 'warn',
      summary: 'Advertencia',
      detail: message,
      life: 3000
    });
  }

  private showError(message: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      life: 5000
    });
  }

  private handleError(error: unknown, defaultMessage: string): void {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 
                       typeof error === 'string' ? error : 
                       defaultMessage;
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
      life: 5000
    });
  }

  // ========== UTILIDADES ADICIONALES (Manteniendo funcionalidad original) ==========

  isTallaAdded(tallaNumero: string): boolean {
    return this.tallas.some(t => t.numero === tallaNumero);
  }

  getContrastColor(hexColor: string | undefined): string {
    if (!hexColor) return '#000000';
    
    // Remover el # si existe
    const color = hexColor.replace('#', '');
    
    // Convertir a RGB
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    
    // Calcular luminancia
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Retornar color contrastante
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }
}
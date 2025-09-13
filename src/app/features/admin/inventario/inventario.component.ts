import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { PanelModule } from 'primeng/panel'; 
import { TooltipModule } from 'primeng/tooltip'; 
import { AvatarModule } from 'primeng/avatar'; 
import { CardModule } from 'primeng/card'; 
import { ChipModule } from 'primeng/chip'; 
import { BadgeModule } from 'primeng/badge'; 
import { TabViewModule } from 'primeng/tabview'; 
import { SelectButtonModule } from 'primeng/selectbutton'; 
import { OverlayPanelModule } from 'primeng/overlaypanel'; 
import { SliderModule } from 'primeng/slider'; 
import { ProgressBarModule } from 'primeng/progressbar'; 
import { KnobModule } from 'primeng/knob'; 
import { ChartModule } from 'primeng/chart'; 
import { CalendarModule } from 'primeng/calendar'; 
import { CheckboxModule } from 'primeng/checkbox'; 
import { RatingModule } from 'primeng/rating'; 
import { AccordionModule } from 'primeng/accordion'; 
import { SplitterModule } from 'primeng/splitter'; 
import { TimelineModule } from 'primeng/timeline'; 
import { DataViewModule } from 'primeng/dataview'; 
import { OrganizationChartModule } from 'primeng/organizationchart'; 
import { TreeTableModule } from 'primeng/treetable'; 
import { ScrollerModule } from 'primeng/scroller'; 

import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { Inventario, EstadoInventario, InventarioRequest } from '../../../core/models/inventario.model';
import { Producto } from '../../../core/models/product.model';
import { Color, Talla } from '../../../core/models/colors.model';
import { Almacen } from '../../../core/models/almacen.model';
import { InventarioService } from '../../../core/services/inventario.service';
import { ProductoService } from '../../../core/services/producto.service';
import { ColorService } from '../../../core/services/colores.service';
import { AlmacenService } from '../../../core/services/almacen.service';
import { MovimientoInventarioService } from '../../../core/services/movimiento-inventario.service';
import { PagedResponse, MovimientoResponse, MovimientoRequest, TipoMovimiento } from '../../../core/models/movimientos-inventario.model';
import { PermissionService, PermissionType } from '../../../core/services/permission.service';
import { finalize, forkJoin, catchError, of, firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { jwtDecode } from 'jwt-decode';

interface ViewOption {
  label: string;
  value: 'dashboard' | 'cards' | 'table' | 'analytics' | 'movements' | 'abc' | 'alerts';
  icon: string;
}

interface InventarioStats {
  totalProductos: number;
  valorTotalInventario: number;
  stockCritico: number;
  productosAgotados: number;
  rotacionPromedio: number;
  movimientosDelMes: number;
  eficienciaStock: number;
  valorEnRiesgo: number;
  zonasDemanda: { zona: string, demanda: number, color: string }[];
  tendenciasStock: { mes: string, entrada: number, salida: number, saldo: number }[];
  alertasCriticas: InventarioAlerta[];
  analisisABC: { categoria: 'A' | 'B' | 'C', productos: number, valor: number, porcentaje: number }[];
}

interface InventarioAlerta {
  id: number;
  tipo: 'STOCK_CRITICO' | 'AGOTADO' | 'VENCIMIENTO' | 'SOBRESTOCK' | 'MOVIMIENTO_ANOMALO';
  producto: string;
  mensaje: string;
  severidad: 'high' | 'medium' | 'low';
  fechaAlerta: Date;
  accionRecomendada: string;
  urgente: boolean;
}

interface FiltrosInventario {
  producto: string;
  almacen: string | null;
  estado: EstadoInventario | null;
  stockMin: number | null;
  stockMax: number | null;
  color: string | null;
  talla: string | null;
  fechaDesde: Date | null;
  fechaHasta: Date | null;
  soloStockCritico: boolean;
  soloAgotados: boolean;
  valorMin: number | null;
  valorMax: number | null;
}

interface InventarioExtendido extends Inventario {
  valorUnitario?: number;
  valorTotal?: number;
  rotacion?: number;
  diasSinMovimiento?: number;
  stockMinimo?: number;
  stockMaximo?: number;
  puntoReorden?: number;
  categoriaABC?: 'A' | 'B' | 'C';
  tendencia?: 'SUBIENDO' | 'BAJANDO' | 'ESTABLE';
  prediccionDemanda?: number;
  fechaUltimoMovimiento?: Date;
  proveedorPrincipal?: string;
  tiempoReposicion?: number;
  costo?: number;
  margen?: number;
  ubicacionAlmacen?: string;
  lote?: string;
  fechaVencimiento?: Date;
  movimientos?: MovimientoResponse[];
}

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    ConfirmDialogModule,
    DialogModule,
    IconFieldModule,
    InputIconModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    ToastModule,
    ToolbarModule,
    PanelModule, 
    TooltipModule, 
    AvatarModule, 
    CardModule, 
    ChipModule, 
    BadgeModule,
    TabViewModule, 
    SelectButtonModule, 
    OverlayPanelModule, 
    SliderModule, 
    ProgressBarModule, 
    KnobModule,
    ChartModule, 
    CalendarModule, 
    CheckboxModule, 
    RatingModule, 
    AccordionModule, 
    SplitterModule,
    TimelineModule, 
    DataViewModule, 
    OrganizationChartModule, 
    TreeTableModule, 
    ScrollerModule,
    HasPermissionDirective
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './inventario.component.html',
  styles: [`
    :host ::ng-deep {
      /* Inventory cards con efectos 3D */
      .inventory-card {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
        position: relative;
        overflow: hidden;
      }
      
      .inventory-card:hover {
        transform: translateY(-8px) rotateX(2deg);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      }
      
      .inventory-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        transition: left 0.5s;
      }
      
      .inventory-card:hover::before {
        left: 100%;
      }
      
      /* Stock level indicators */
      .stock-indicator {
        position: relative;
        overflow: hidden;
        border-radius: 8px;
      }
      
      .stock-indicator::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%);
        animation: stock-shine 3s infinite;
      }
      
      @keyframes stock-shine {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      
      /* Status indicators mejorados */
      .status-indicator {
        position: relative;
        display: inline-block;
      }
      
      .status-indicator::after {
        content: '';
        position: absolute;
        top: -2px;
        right: -2px;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        animation: status-pulse 2s infinite;
      }
      
      .status-disponible::after { background: #10b981; }
      .status-agotado::after { background: #ef4444; }
      .status-bajo-stock::after { background: #f59e0b; }
      .status-reservado::after { background: #3b82f6; }
      
      @keyframes status-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      
      /* ABC Analysis colors */
      .abc-a { 
        background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
        color: white;
      }
      .abc-b { 
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
        color: white;
      }
      .abc-c { 
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); 
        color: white;
      }
      
      /* Movement timeline */
      .movement-timeline {
        position: relative;
      }
      
      .movement-timeline::before {
        content: '';
        position: absolute;
        left: 20px;
        top: 0;
        bottom: 0;
        width: 2px;
        background: linear-gradient(to bottom, #3b82f6, #10b981);
      }
      
      .movement-item {
        position: relative;
        padding-left: 50px;
        margin-bottom: 20px;
      }
      
      .movement-item::before {
        content: '';
        position: absolute;
        left: 14px;
        top: 10px;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #3b82f6;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      /* Charts responsivos mejorados */
      .p-chart {
        border-radius: 16px !important;
        overflow: hidden;
      }
      
      .chart-container {
        position: relative;
      }
      
      .chart-container::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
        border-radius: 16px;
        pointer-events: none;
      }
      
      /* Alert cards */
      .alert-card {
        position: relative;
        overflow: hidden;
        transition: all 0.3s ease;
      }
      
      .alert-card:hover {
        transform: translateX(4px);
      }
      
      .alert-high {
        border-left: 4px solid #ef4444;
        background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
      }
      
      .alert-medium {
        border-left: 4px solid #f59e0b;
        background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
      }
      
      .alert-low {
        border-left: 4px solid #3b82f6;
        background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      }
      
      /* Data visualization */
      .data-viz {
        background: linear-gradient(135deg, #f8fafc 0%, white 100%);
        border-radius: 16px;
        padding: 20px;
        border: 1px solid rgba(0,0,0,0.05);
      }
      
      /* Progress rings */
      .progress-ring {
        position: relative;
        display: inline-block;
      }
      
      .progress-ring svg {
        transform: rotate(-90deg);
      }
      
      .progress-ring circle {
        fill: none;
        stroke-width: 8;
        stroke-linecap: round;
        transition: stroke-dasharray 0.5s ease;
      }
      
      /* Virtual scroller optimizations */
      .p-virtualscroller {
        height: 400px;
      }
      
      .virtual-item {
        transition: all 0.3s ease;
      }
      
      .virtual-item:hover {
        background: rgba(59, 130, 246, 0.05);
      }
    }

    /* Utilidades CSS personalizadas */
    .inventory-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 2rem;
    }
    
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }
    
    .analytics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }
    
    .stock-critical { 
      background: linear-gradient(135deg, #fee2e2 0%, #ef4444 100%); 
      color: #991b1b;
    }
    
    .stock-low { 
      background: linear-gradient(135deg, #fef3c7 0%, #f59e0b 100%); 
      color: #92400e;
    }
    
    .stock-good { 
      background: linear-gradient(135deg, #d1fae5 0%, #10b981 100%); 
      color: #065f46;
    }
    
    .stock-high { 
      background: linear-gradient(135deg, #dbeafe 0%, #3b82f6 100%); 
      color: #1e40af;
    }
    
    /* Animaciones */
    @keyframes inventory-entrance {
      from {
        opacity: 0;
        transform: translateY(30px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    
    .inventory-entrance {
      animation: inventory-entrance 0.6s ease-out;
    }
    
    @keyframes pulse-value {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    
    .pulse-value {
      animation: pulse-value 2s ease-in-out infinite;
    }
    
    @keyframes slide-in-right {
      from {
        opacity: 0;
        transform: translateX(30px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    .slide-in-right {
      animation: slide-in-right 0.5s ease-out;
    }

  `]
})
export class InventarioComponent implements OnInit, AfterViewInit {
  // Make Math available in template
  Math = Math;
  isLoadingProductos = false;
  new: string|string[]|Set<string>|Record<string, unknown>|null|undefined;
  
  // Helper method for calculating width percentage
  calculateWidthPercentage(current: number, max: number): number {
    if (!max) return 0;
    return Math.min((current / max) * 100, 100);
  }
  
  // Helper method for ABC analysis
  getAnalisisABCByCategoria(categoria: 'A' | 'B' | 'C') {
    const analisis = this.calcularEstadisticas().analisisABC;
    return analisis.find(a => a.categoria === categoria) || { productos: 0, valor: 0, porcentaje: 0 };
  }
  @ViewChild('inventoryTable') inventoryTable!: ElementRef;

  // ========== DATOS Y ESTADO ==========
  inventarios: InventarioExtendido[] = [];
  inventariosFiltrados: InventarioExtendido[] = [];
  selectedInventarios: InventarioExtendido[] = [];
  productos: Producto[] = [];
  colores: Color[] = [];
  tallas: Talla[] = [];
  almacenes: Almacen[] = [];
  movimientoDialog = false;
  newMovimientosDialog = false;


  inventariosTotales: InventarioExtendido[] = [];

  movimiento!: MovimientoResponse;

  // ========== FILTROS ==========
  productoSeleccionadoFiltro: Producto | null = null;

  // ========== FORMULARIO ==========
  inventario: InventarioExtendido = this.initInventario();
  productoSeleccionado: Producto | null = null;
  colorSeleccionado: Color | null = null;
  tallaSeleccionada: Talla | null = null;
  almacenSeleccionado: Almacen | null = null;
  inventarioSeleccionado: Inventario | null = null;
  inventarioDestinoSeleccionado: Inventario | null = null;

  // ========== ESTADO UI ==========
  inventarioDialog = false;
  editMode = false;
  loading = false;
  submitted = false;
  currentView: 'dashboard' | 'cards' | 'table' | 'analytics' | 'movements' | 'abc' | 'alerts' = 'dashboard';

  // 👇 Nuevas propiedades para el diseño moderno
  detalleInventarioDialog = false;
  movimientosDialog = false;
  estadisticasDialog = false;
  alertasDialog = false;
  filtrosDialog = false;
  analisisAbcDialog = false;
  activeTab = 0; // 0: Info, 1: Movimientos, 2: Analytics, 3: Configuración

  // Filtros avanzados
  filtrosInventario: FiltrosInventario = {
    producto: '',
    almacen: null,
    estado: null,
    stockMin: null,
    stockMax: null,
    color: null,
    talla: null,
    fechaDesde: null,
    fechaHasta: null,
    soloStockCritico: false,
    soloAgotados: false,
    valorMin: null,
    valorMax: null
  };

  // Datos para gráficos y estadísticas
  chartData: Record<string, unknown> = {};
  chartOptions: Record<string, unknown> = {};
  trendData: Record<string, unknown> = {};
  abcData: Record<string, unknown> = {};

  // ========== PERMISOS ==========
  permissionTypes = PermissionType;

  // ========== CONFIGURACIÓN ==========
  viewOptions: ViewOption[] = [
    { label: 'Dashboard', value: 'dashboard', icon: 'pi pi-chart-pie' },
    { label: 'Vista Cards', value: 'cards', icon: 'pi pi-th-large' },
    { label: 'Tabla', value: 'table', icon: 'pi pi-list' },
    { label: 'Analytics', value: 'analytics', icon: 'pi pi-chart-bar' },
    { label: 'Movimientos', value: 'movements', icon: 'pi pi-history' },
  ];

  estadosInventario: { label: string, value: EstadoInventario, color: string, icon: string }[] = [
    { label: 'Disponible', value: EstadoInventario.DISPONIBLE, color: 'success', icon: 'pi pi-check-circle' },
    { label: 'Agotado', value: EstadoInventario.AGOTADO, color: 'danger', icon: 'pi pi-times-circle' },
    { label: 'Bajo Stock', value: EstadoInventario.BAJO_STOCK, color: 'warning', icon: 'pi pi-exclamation-triangle' },
    { label: 'Reservado', value: EstadoInventario.RESERVADO, color: 'info', icon: 'pi pi-lock' }
  ];

  tiposMovimiento = [
    { label: 'Entrada', value: 'ENTRADA', icon: 'pi pi-arrow-down', color: '#10b981' },
    { label: 'Salida', value: 'SALIDA', icon: 'pi pi-arrow-up', color: '#ef4444' },
    { label: 'Ajuste', value: 'AJUSTE', icon: 'pi pi-wrench', color: '#f59e0b' },
    { label: 'Transferencia', value: 'TRANSFERENCIA', icon: 'pi pi-arrows-h', color: '#3b82f6' }
  ];

  categoriasABC = [
    { categoria: 'A', label: 'Categoría A', descripcion: 'Alto valor/rotación', color: '#10b981' },
    { categoria: 'B', label: 'Categoría B', descripcion: 'Valor/rotación media', color: '#f59e0b' },
    { categoria: 'C', label: 'Categoría C', descripcion: 'Bajo valor/rotación', color: '#ef4444' }
  ];

  // UTILIDADES
  private createEmptyMovimientoResponse(): MovimientoResponse {
    return {
      id: 0,
      inventarioId: 0,
      cantidad: 0,
      tipo: TipoMovimiento.ENTRADA,
      descripcion: '',
      referencia: '',
      usuario: '',
      fechaMovimiento: new Date().toISOString(),
      // Campos opcionales
      inventarioDestinoId: undefined,
      estadoResultante: undefined,
      almacenDestinoNombre: undefined,
      producto: undefined,
      color: undefined,
      talla: undefined
    };
  }

  private getCurrentUsername(): string {
      const token = this.authService.getToken();
      if (!token) return 'sistema';
      
      try {
        const decodedToken = jwtDecode<{ sub: string }>(token);
        return decodedToken.sub;
      } catch (error) {
        console.error('Error al decodificar el token:', error);
        return 'sistema';
      }
    }


  // Computed properties for inventory statistics
  get totalUnidades(): number {
    return this.inventariosFiltrados?.reduce((sum, inv) => sum + (inv.cantidad || 0), 0) || 0;
  }

  get totalVariantes(): number {
    return this.inventariosFiltrados?.length || 0;
  }

  get stockBajoCount(): number {
    return this.inventariosFiltrados?.filter(inv => inv.cantidad <= 10).length || 0;
  }


  get agotadosCount(): number {
    return this.inventariosFiltrados.filter(i => i.estado === EstadoInventario.AGOTADO).length;
  }

  // Helper methods for template calculations
  getRandomInt(min: number, max: number): number {
    // Usar valores consistentes en lugar de Math.random()
    // Esto evita el error ExpressionChangedAfterItHasBeenCheckedError
    return Math.floor(min + ((max - min) * 0.6)); // Valor fijo en el 60% del rango
  }

  getRandomFloat(min: number, max: number, decimals = 1): string {
    // Usar valores consistentes basados en la categoría en lugar de Math.random()
    // Esto evita el error ExpressionChangedAfterItHasBeenCheckedError
    const baseValue = min + ((max - min) * 0.6); // Valor fijo en el 60% del rango
    return baseValue.toFixed(decimals);
  }

  getInventariosByCategoria(categoria: 'A' | 'B' | 'C'): InventarioExtendido[] {
    return this.inventariosFiltrados.filter(inv => inv.categoriaABC === categoria);
  }
  
  // Método mejorado para el template
  getInventariosPorCategoria(categoriaInput: { categoria: 'A' | 'B' | 'C' } | 'A' | 'B' | 'C' | { categoria: string; label: string; descripcion: string; color: string }): InventarioExtendido[] {
    // Extraer y validar la categoría
    const cat = typeof categoriaInput === 'object' ? categoriaInput.categoria : categoriaInput;
    
    // Validar que sea una categoría válida
    if (!['A', 'B', 'C'].includes(cat)) {
      console.warn('Categoría inválida en getInventariosPorCategoria:', cat);
      return []; // Retornar array vacío si la categoría no es válida
    }
  
    return this.getInventariosByCategoria(cat as 'A' | 'B' | 'C');
  }

  // Get ABC analysis data for a specific category
  getABCData(categoria: 'A' | 'B' | 'C'): { productos: number; valor: number; porcentaje: number } {
    const data = this.calcularEstadisticas().analisisABC.find(a => a.categoria === categoria);
    return data || { productos: 0, valor: 0, porcentaje: 0 };
  }

  // Helper methods for template bindings
  getDisponiblesCount(): number {
    return this.inventariosFiltrados.filter(i => i.estado === EstadoInventario.DISPONIBLE).length;
  }

  getAlertasBySeverity(severity: 'high' | 'medium' | 'low'): number {
    return this.calcularEstadisticas().alertasCriticas.filter(a => a.severidad === severity).length;
  }

  // ... (rest of the code remains the same)

    private readonly inventarioService: InventarioService = inject(InventarioService);
    private readonly productoService: ProductoService = inject(ProductoService);
    private readonly colorService: ColorService = inject(ColorService);
    private readonly almacenService: AlmacenService = inject(AlmacenService);
    private readonly movimientoService: MovimientoInventarioService = inject(MovimientoInventarioService);
    private readonly messageService: MessageService = inject(MessageService);
    private readonly confirmationService: ConfirmationService = inject(ConfirmationService);
    private readonly authService: AuthService = inject(AuthService);
    public permissionService: PermissionService = inject(PermissionService);

  constructor(
    
  ) {
    this.initChartOptions();
  }

  ngOnInit(): void {
    this.movimiento = this.createEmptyMovimientoResponse();
    this.loadProductos();
    this.loadAlmacenes();
    this.generarDatosSimulados();
  }

  ngAfterViewInit(): void {
    // Animaciones de entrada
    setTimeout(() => {
      const elements = document.querySelectorAll('.inventory-entrance');
      elements.forEach((el, index) => {
        (el as HTMLElement).style.animationDelay = `${index * 0.1}s`;
      });
    }, 100);
  }

  // ========== NUEVOS MÉTODOS PARA EL DISEÑO MODERNO ==========

  /**
   * 👇 Inicializa opciones de gráficos
   */
  initChartOptions(): void {
    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 20
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0,0,0,0.1)'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    };
  }

  /**
   * 👇 Genera datos simulados para demostración (con valores consistentes)
   */
  generarDatosSimulados(): void {
    // Simular datos extendidos para los inventarios existentes
    this.inventariosFiltrados = this.inventariosFiltrados.map((inventario, index) => {
      // Usar índice para generar valores consistentes
      const seed = index * 12345;
      
      return {
        ...inventario,
        valorUnitario: 20 + (seed % 100),
        rotacion: 1 + (seed % 12),
        diasSinMovimiento: seed % 90,
        stockMinimo: Math.floor(inventario.cantidad * 0.2),
        stockMaximo: Math.floor(inventario.cantidad * 2),
        puntoReorden: Math.floor(inventario.cantidad * 0.3),
        categoriaABC: ['A', 'B', 'C'][index % 3] as 'A' | 'B' | 'C',
        tendencia: ['SUBIENDO', 'BAJANDO', 'ESTABLE'][index % 3] as 'SUBIENDO' | 'BAJANDO' | 'ESTABLE',
        prediccionDemanda: 10 + (seed % 50),
        fechaUltimoMovimiento: new Date(Date.now() - (seed % 30) * 24 * 60 * 60 * 1000),
        proveedorPrincipal: ['Proveedor A', 'Proveedor B', 'Proveedor C'][index % 3],
        tiempoReposicion: 5 + (seed % 15),
        costo: 10 + (seed % 80),
        margen: 20 + (seed % 50),
        ubicacionAlmacen: `Pasillo ${index + 1}-Estante ${(seed % 10) + 1}`,
        lote: `LT${String(index + 1).padStart(4, '0')}`,
        fechaVencimiento: new Date(Date.now() + (seed % 365) * 24 * 60 * 60 * 1000),
        movimientos: []
      };
    });

    // Calcular valor total para cada inventario
    this.inventariosFiltrados.forEach(inventario => {
      if (inventario.valorUnitario) {
        inventario.valorTotal = inventario.cantidad * inventario.valorUnitario;
      }
    });

    this.updateChartData();
  }

  /**
   * 👇 Calcula estadísticas generales de inventarios
   */
  calcularEstadisticas(): InventarioStats {
    const inventarios = this.inventariosFiltrados;
    const valorTotal = inventarios.reduce((sum, inv) => sum + (inv.valorTotal || 0), 0);
    const stockCritico = inventarios.filter(inv => inv.cantidad <= (inv.stockMinimo || 5)).length;
    const agotados = inventarios.filter(inv => inv.cantidad === 0).length;
    const rotacionPromedio = inventarios.reduce((sum, inv) => sum + (inv.rotacion || 0), 0) / inventarios.length;
    const movimientosDelMes = inventarios.reduce((sum, inv) => sum + (inv.movimientos?.length || 0), 0);
    const eficienciaStock = valorTotal / (valorTotal + stockCritico);


    return {
      totalProductos: inventarios.length,
      valorTotalInventario: valorTotal,
      stockCritico,
      productosAgotados: agotados,
      rotacionPromedio,
      movimientosDelMes,
      eficienciaStock,
      valorEnRiesgo: valorTotal * 0.15, // Simulado
      zonasDemanda: this.getZonasDemanda(),
      tendenciasStock: this.getTendenciasStock(),
      alertasCriticas: this.getAlertasCriticas(),
      analisisABC: this.getAnalisisABC()
    };
  }

  /**
   * 👇 Obtiene zonas de demanda
   */
  getZonasDemanda(): { zona: string, demanda: number, color: string }[] {
    return [
      { zona: 'Norte', demanda: 35, color: '#10b981' },
      { zona: 'Sur', demanda: 28, color: '#3b82f6' },
      { zona: 'Centro', demanda: 22, color: '#f59e0b' },
      { zona: 'Este', demanda: 15, color: '#ef4444' }
    ];
  }

  /**
   * 👇 Obtiene tendencias de stock (con valores consistentes)
   */
  getTendenciasStock(): { mes: string, entrada: number, salida: number, saldo: number }[] {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    return meses.map((mes, index) => {
      const seed = index * 12345; // Semilla para valores consistentes
      return {
        mes,
        entrada: 500 + (seed % 1000),
        salida: 400 + (seed % 800),
        saldo: 200 + (seed % 500)
      };
    });
  }

  /**
   * 👇 Genera alertas críticas
   */
  getAlertasCriticas(): InventarioAlerta[] {
    const alertas: InventarioAlerta[] = [];
    
    this.inventariosFiltrados.forEach((inventario, index) => {
      if (inventario.cantidad <= (inventario.stockMinimo || 5)) {
        alertas.push({
          id: index + 1,
          tipo: inventario.cantidad === 0 ? 'AGOTADO' : 'STOCK_CRITICO',
          producto: `${inventario.producto?.nombre} - ${inventario.color?.nombre} - ${inventario.talla?.numero}`,
          mensaje: inventario.cantidad === 0 ? 'Producto agotado' : 'Stock por debajo del mínimo',
          severidad: inventario.cantidad === 0 ? 'high' : 'medium',
          fechaAlerta: new Date(),
          accionRecomendada: inventario.cantidad === 0 ? 'Reposición urgente' : 'Programar reposición',
          urgente: inventario.cantidad === 0
        });
      }
    });

    return alertas.slice(0, 10); // Limitar a 10 alertas
  }

  /**
   * 👇 Obtiene análisis ABC
   */
  getAnalisisABC(): { categoria: 'A' | 'B' | 'C', productos: number, valor: number, porcentaje: number }[] {
    const valorTotal = this.inventariosFiltrados.reduce((sum, inv) => sum + (inv.valorTotal || 0), 0);
    
    const categorias = ['A', 'B', 'C'] as const;
    return categorias.map(categoria => {
      const productos = this.inventariosFiltrados.filter(inv => inv.categoriaABC === categoria);
      const valor = productos.reduce((sum, inv) => sum + (inv.valorTotal || 0), 0);
      const porcentaje = valorTotal > 0 ? (valor / valorTotal) * 100 : 0;
      
      return {
        categoria,
        productos: productos.length,
        valor,
        porcentaje
      };
    });
  }

  /**
   * 👇 Actualiza datos de gráficos
   */
  updateChartData(): void {
    const estados = Object.values(EstadoInventario);
    const distribucionEstados = estados.map(estado => ({
      estado,
      cantidad: this.inventariosFiltrados.filter(inv => inv.estado === estado).length
    }));

    this.chartData = {
      labels: distribucionEstados.map(d => d.estado),
      datasets: [{
        data: distribucionEstados.map(d => d.cantidad),
        backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };

    // Datos de tendencias
    const tendencias = this.getTendenciasStock();
    this.trendData = {
      labels: tendencias.map(t => t.mes),
      datasets: [
        {
          label: 'Entradas',
          data: tendencias.map(t => t.entrada),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4
        },
        {
          label: 'Salidas',
          data: tendencias.map(t => t.salida),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4
        }
      ]
    };

    // Datos ABC
    const abc = this.getAnalisisABC();
    this.abcData = {
      labels: abc.map(a => `Categoría ${a.categoria}`),
      datasets: [{
        data: abc.map(a => a.porcentaje),
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 0
      }]
    };
  }

  /**
   * 👇 Obtiene clase CSS para el nivel de stock
   */
  getStockLevel(inventario: InventarioExtendido): 'critical' | 'low' | 'good' | 'high' {
    const cantidad = inventario.cantidad;
    const minimo = inventario.stockMinimo || 5;
    const maximo = inventario.stockMaximo || cantidad * 2;

    if (cantidad === 0) return 'critical';
    if (cantidad <= minimo) return 'low';
    if (cantidad >= maximo) return 'high';
    return 'good';
  }

  /**
   * 👇 Obtiene clase CSS para el stock
   */
  getStockClass(inventario: InventarioExtendido): string {
    const level = this.getStockLevel(inventario);
    return `stock-${level}`;
  }

  /**
   * 👇 Obtiene icono del estado
   */
  getEstadoIcon(estado: EstadoInventario): string {
    const iconMap = {
      [EstadoInventario.DISPONIBLE]: 'pi pi-check-circle',
      [EstadoInventario.AGOTADO]: 'pi pi-times-circle',
      [EstadoInventario.BAJO_STOCK]: 'pi pi-exclamation-triangle',
      [EstadoInventario.RESERVADO]: 'pi pi-lock'
    };
    return iconMap[estado] || 'pi pi-circle';
  }

  /**
   * 👇 Obtiene color del estado
   */
  getEstadoColor(estado: EstadoInventario): string {
    const colorMap = {
      [EstadoInventario.DISPONIBLE]: 'success',
      [EstadoInventario.AGOTADO]: 'danger',
      [EstadoInventario.BAJO_STOCK]: 'warning',
      [EstadoInventario.RESERVADO]: 'info'
    };
    return colorMap[estado] || 'secondary';
  }

  /**
   * 👇 Obtiene icono de tendencia
   */
  getTendenciaIcon(tendencia: 'SUBIENDO' | 'BAJANDO' | 'ESTABLE'): string {
    const iconMap = {
      'SUBIENDO': 'pi pi-arrow-up',
      'BAJANDO': 'pi pi-arrow-down',
      'ESTABLE': 'pi pi-minus'
    };
    return iconMap[tendencia] || 'pi pi-minus';
  }

  /**
   * 👇 Obtiene color de tendencia
   */
  getTendenciaColor(tendencia: 'SUBIENDO' | 'BAJANDO' | 'ESTABLE'): string {
    const colorMap = {
      'SUBIENDO': '#10b981',
      'BAJANDO': '#ef4444',
      'ESTABLE': '#6b7280'
    };
    return colorMap[tendencia] || '#6b7280';
  }

  /**
   * 👇 Tracking para mejor performance
   */
  trackByInventario(index: number, inventario: InventarioExtendido): number | undefined {
    return inventario.id || index;
  }

  trackByAlerta(index: number, alerta: InventarioAlerta): number | undefined {
    return alerta.id || index;
  }

  trackByMovimiento(index: number, movimiento: MovimientoResponse): number | undefined {
    return movimiento.id || index;
  }

  /**
   * 👇 Muestra detalle de inventario
   */
  mostrarDetalle(inventario: InventarioExtendido): void {
    this.inventario = { ...inventario };
    this.detalleInventarioDialog = true;
  }

  /**
   * 👇 Muestra y carga los movimientos del inventario
   */
  mostrarMovimientos(inventario?: Inventario): void {
    if (inventario) {
      this.inventario = inventario;
      this.loading = true;
      
      // Usar el endpoint correcto con filtro por inventario
      this.movimientoService.buscarMovimientos(
        inventario.id, // inventarioId - filtra por inventario específico
        undefined,     // productoId
        undefined,     // colorId
        undefined,     // tallaId
        undefined,     // tipo
        undefined,     // fechaInicio
        undefined,     // fechaFin
        0,            // page
        100,          // size
        'fechaMovimiento', // sortBy
        'desc'        // sortDir
      )
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (response: PagedResponse<MovimientoResponse>) => {
          if (response && response.contenido) {
            // Ya vienen filtrados del backend por inventarioId
            this.inventario.movimientos = response.contenido.map((mov: MovimientoResponse) => ({
              ...mov,
              // El backend ya envía fechaMovimiento como string ISO, no necesita conversión
            }));
            
            if (this.inventario.movimientos.length === 0) {
              this.showWarning('No se encontraron movimientos para este inventario');
            }
          } else {
            this.inventario.movimientos = [];
            this.showWarning('No se encontraron movimientos para este inventario');
          }
        },
        error: (error: unknown) => {
          console.error('Error al cargar movimientos:', error);
          this.handleError(error, 'Error al cargar el historial de movimientos');
          this.inventario.movimientos = [];
        }
      });
    }
    
    this.movimientosDialog = true;
  }

  /**
   * 👇 Muestra estadísticas detalladas
   */
  mostrarEstadisticas(): void {
    this.updateChartData();
    this.estadisticasDialog = true;
  }

  /**
   * 👇 Muestra alertas
   */
  mostrarAlertas(): void {
    this.alertasDialog = true;
  }

  /**
   * 👇 Muestra filtros avanzados
   */
  mostrarFiltros(): void {
    this.filtrosDialog = true;
  }

  /**
   * 👇 Muestra análisis ABC
   */
  mostrarAnalisisAbc(): void {
    this.analisisAbcDialog = true;
  }

  /**
   * 👇 Cierra modales
   */
  hideDetalleDialog(): void {
    this.detalleInventarioDialog = false;
  }

  hideMovimientosDialog(): void {
    this.movimientosDialog = false;
  }

  hideEstadisticasDialog(): void {
    this.estadisticasDialog = false;
  }

  hideAlertasDialog(): void {
    this.alertasDialog = false;
  }

  hideFiltrosDialog(): void {
    this.filtrosDialog = false;
  }

  hideAnalisisAbcDialog(): void {
    this.analisisAbcDialog = false;
  }

  // ========== MÉTODOS DE CARGA (Manteniendo funcionalidad original) ==========

  loadProductos(): void {
    this.isLoadingProductos = true;
    this.productoService.getProducts(0, 1000).subscribe({
      next: (response) => {
        this.productos = response.contenido || [];
        this.isLoadingProductos = false;
      },
      error: (error) => {
        this.handleError(error, 'No se pudo cargar los productos');
        this.isLoadingProductos = false;
      }
    });
  }

  loadAlmacenes(): void {
    this.almacenService.getAlmacenes().subscribe({
      next: (response) => {
        // Check if response is an array or a paged response
        if (Array.isArray(response)) {
          this.almacenes = response;
        } else {
          this.almacenes = response.contenido || [];
        }
      },
      error: (error: unknown) => this.handleError(error, 'No se pudieron cargar los almacenes')
    });
  }

  loadColoresPorProducto(productoId: number, colorId?: number, tallaId?: number): void {
    this.colores = [];
    this.tallas = [];
    
    this.colorService.getColoresPorProducto(productoId).subscribe({
      next: (coloresRes) => {
        this.colores = coloresRes || [];
        
        if (colorId) {
          const foundColor = this.colores.find(c => c.id === colorId);
          if (foundColor) {
            this.colorSeleccionado = foundColor;
            this.tallas = foundColor.tallas || [];
            
            if (tallaId) {
              this.tallaSeleccionada = this.tallas.find(t => t.id === tallaId) || null;
            }
          }
        }
      },
      error: (error) => this.handleError(error, 'No se pudieron cargar los colores')
    });
  }

  loadTallasPorColor(colorId: number): void {
    const colorSeleccionado = this.colores.find(c => c.id === colorId);
    this.tallas = colorSeleccionado?.tallas || [];
    this.tallaSeleccionada = null;
  }

  // ========== FILTROS (Manteniendo y expandiendo funcionalidad original) ==========

  filtrarInventarioPorProducto(): void {
    this.selectedInventarios = [];
    
    if (this.productoSeleccionadoFiltro) {
      this.loading = true;
      
      this.inventarioService.obtenerInventarioPorProducto(this.productoSeleccionadoFiltro.id!).subscribe({
        next: (inventarios) => {
          this.inventariosFiltrados = Array.isArray(inventarios) ? inventarios : [inventarios];
          this.generarDatosSimulados(); // Enriquecer con datos simulados
          this.loading = false;
        },
        error: (error) => {
          this.handleError(error, 'No se pudo cargar el inventario de este producto');
          this.inventariosFiltrados = [];
          this.loading = false;
        }
      });
    } else {
      this.inventariosFiltrados = [];
    }
  }

  limpiarFiltros(): void {
    this.productoSeleccionadoFiltro = null;
    this.inventariosFiltrados = [];
    this.selectedInventarios = [];
    this.filtrosInventario = {
      producto: '',
      almacen: null,
      estado: null,
      stockMin: null,
      stockMax: null,
      color: null,
      talla: null,
      fechaDesde: null,
      fechaHasta: null,
      soloStockCritico: false,
      soloAgotados: false,
      valorMin: null,
      valorMax: null
    };
  }

  // === MOVIMIENTOS INVENTARIO
  guardarMovimiento(): void {
      this.submitted = true;
    
      if (!this.isValidMovimiento()) {
        return;
      }
    
      this.loading = true;
    
      const movimientoData: Omit<MovimientoRequest, 'id' | 'fechaMovimiento' | 'usuario'> = {
        inventarioId: this.inventarioSeleccionado?.id ?? 0,
        inventarioDestinoId: this.movimiento.tipo === 'TRASLADO' ? this.inventarioDestinoSeleccionado?.id ?? 0 : undefined,
        tipo: this.movimiento.tipo,
        cantidad: this.movimiento.cantidad,
        referencia: this.movimiento.referencia?.trim() || `MOV-${Date.now()}`,
        descripcion: this.movimiento.descripcion,
        // El usuario se maneja en el backend basado en el token de autenticación
      };
    
      if (this.editMode && this.movimiento.id) {
        this.showWarning('Funcionalidad de actualización en desarrollo');
        this.loading = false;
        this.hideDialog();
      } else {
        this.movimientoService.createMovimiento(movimientoData)
          .pipe(finalize(() => this.loading = false))
          .subscribe({
            next: (result) => {
              if (this.inventario.movimientos) {
                this.inventario.movimientos.unshift(result);
              }
              // this.filtrarMovimientosPorInventario(); // Actualizar la lista filtrada
              this.showSuccess('Movimiento creado exitosamente');
              this.hideDialog();
            },
            error: (error: unknown) => {
              this.handleError(error, 'Error creando movimiento');
            }
          });
      }
    }

  // ========== VALIDACIONES ==========
  isValidMovimiento(): boolean {
    if (!this.inventarioSeleccionado) {
      this.showError('Debe seleccionar un inventario');
      return false;
    }

    if (!this.movimiento.tipo) {
      this.showError('Debe seleccionar un tipo de movimiento');
      return false;
    }

    if (!this.movimiento.cantidad || this.movimiento.cantidad <= 0) {
      this.showError('La cantidad debe ser mayor a 0');
      return false;
    }

    if (!this.movimiento.descripcion?.trim()) {
      this.showError('La descripción es obligatoria');
      return false;
    }

    if (!this.movimiento.referencia?.trim()) {
      this.showError('La referencia es obligatoria');
      return false;
    }

    // Validar stock suficiente para salidas
    if (this.movimiento.tipo === 'SALIDA') {
      const stockDisponible = this.inventarioSeleccionado.cantidad;
      if (this.movimiento.cantidad > stockDisponible) {
        this.showError(`Stock insuficiente. Disponible: ${stockDisponible}`);
        return false;
      }
    }

    // Validar inventario destino para traslados
    if (this.movimiento.tipo === 'TRASLADO') {
      if (!this.inventarioDestinoSeleccionado) {
        this.showError('Debe seleccionar un inventario de destino para el traslado');
        return false;
      }
      
      if (this.inventarioDestinoSeleccionado.id === this.inventarioSeleccionado.id) {
        this.showError('El inventario de destino no puede ser el mismo que el de origen');
        return false;
      }
    }

    return true;
  }

  
  // ========== CRUD (Manteniendo funcionalidad original) ==========

  openNew(): void {
    if (!this.permissionService.canCreate('inventario')) {
      this.showError('No tiene permisos para crear inventarios');
      return;
    }

    this.editMode = false;
    this.inventario = this.initInventario();
    this.productoSeleccionado = this.productoSeleccionadoFiltro;
    this.resetSelections();
    
    if (this.productoSeleccionadoFiltro) {
      this.loadColoresPorProducto(this.productoSeleccionadoFiltro.id!);
    }
    
    this.submitted = false;
    this.inventarioDialog = true;
  }

  editInventario(inventario: InventarioExtendido): void {
    console.log('Editando inventario:', inventario);
    console.log('Almacén del inventario:', inventario.almacen);

    if (!this.permissionService.canEdit('inventario')) {
      this.showError('No tiene permisos para editar inventarios');
      return;
    }

    this.editMode = true;
    this.inventario = { ...inventario };
    this.productoSeleccionado = inventario.producto;
    this.almacenSeleccionado = inventario.almacen;

    console.log('Edit mode:', this.editMode);
    console.log('Almacén seleccionado:', this.almacenSeleccionado)
    
    const originalColorId = inventario.color?.id;
    const originalTallaId = inventario.talla?.id;
    
    this.resetSelections();
    
    if (this.productoSeleccionado?.id) {
      this.loadColoresPorProducto(this.productoSeleccionado.id, originalColorId, originalTallaId);
    }
    
    this.submitted = false;
    this.inventarioDialog = true;
  }

  guardarInventario(): void {
    this.submitted = true;
    
    if (!this.isValidInventario()) {
      return;
    }
    
    const inventarioRequest: InventarioRequest = {
      productoId: this.productoSeleccionado!.id!,
      colorId: this.colorSeleccionado!.id!,
      tallaId: this.tallaSeleccionada!.id!,
      almacenId: this.almacenSeleccionado!.id!,
      cantidad: this.inventario.cantidad,
      estado: this.inventario.estado || EstadoInventario.DISPONIBLE,
    };
    
    this.loading = true;

    if (this.editMode && this.inventario.id) {
      this.inventarioService.actualizarInventario(this.inventario.id, inventarioRequest)
        .pipe(finalize(() => this.loading = false))
        .subscribe({
          next: () => {
            this.showSuccess('Inventario actualizado correctamente');
            this.hideDialog();
            this.filtrarInventarioPorProducto();
          },
          error: (error) => this.handleError(error, 'No se pudo actualizar el inventario')
        });
    } else {
      this.inventarioService.crearInventario(inventarioRequest)
        .pipe(finalize(() => this.loading = false))
        .subscribe({
          next: () => {
            this.showSuccess('Inventario creado correctamente');
            this.hideDialog();
            this.filtrarInventarioPorProducto();
          },
          error: (error) => this.handleError(error, 'No se pudo crear el inventario')
        });
    }
  }

  eliminarInventario(inventario: InventarioExtendido): void {
    if (!this.permissionService.canDelete('inventario')) {
      this.showError('No tiene permisos para eliminar inventarios');
      return;
    }

    if (!inventario.id) return;
    
    this.confirmationService.confirm({
      message: `¿Está seguro que desea eliminar el inventario de ${inventario.producto?.nombre} - ${inventario.color?.nombre} - Talla ${inventario.talla?.numero}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.loading = true;
        this.inventarioService.eliminarInventario(inventario.id!)
          .pipe(finalize(() => this.loading = false))
          .subscribe({
            next: () => {
              this.showSuccess('Inventario eliminado correctamente');
              this.filtrarInventarioPorProducto();
              this.selectedInventarios = [];
            },
            error: (error) => this.handleError(error, 'No se pudo eliminar el inventario')
          });
      }
    });
  }

  deleteSelectedInventarios(): void {
    if (!this.permissionService.canDelete('inventario')) {
      this.showError('No tiene permisos para eliminar inventarios');
      return;
    }

    if (!this.selectedInventarios.length) return;
    
    this.confirmationService.confirm({
      message: `¿Está seguro que desea eliminar los ${this.selectedInventarios.length} registros seleccionados?`,
      header: 'Confirmar eliminación múltiple',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.processMultipleDelete()
    });
  }

  // ========== VALIDACIONES (Manteniendo funcionalidad original) ==========

  private isValidInventario(): boolean {
    if (!this.productoSeleccionado) {
      this.showError('Debe seleccionar un producto');
      return false;
    }

    if (!this.colorSeleccionado) {
      this.showError('Debe seleccionar un color');
      return false;
    }

    if (!this.tallaSeleccionada) {
      this.showError('Debe seleccionar una talla');
      return false;
    }

    if (!this.almacenSeleccionado) {
      this.showError('Debe seleccionar un almacén');
      return false;
    }

    if (this.inventario.cantidad < 0) {
      this.showError('La cantidad debe ser mayor o igual a 0');
      return false;
    }

    return true;
  }

  private async processMultipleDelete(): Promise<void> {
    this.loading = true;
    
    try {
      const deleteOperations = this.selectedInventarios
        .filter(inventario => inventario.id)
        .map(inventario => 
          this.inventarioService.eliminarInventario(inventario.id!)
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
      this.filtrarInventarioPorProducto();
      this.selectedInventarios = [];
    } catch (error) {
      this.handleError(error, 'No se pudieron eliminar algunos inventarios');
    } finally {
      this.loading = false;
    }
  }

  private showDeleteResults(successful: number, failed: number): void {
    if (successful > 0) {
      this.showSuccess(`${successful} inventarios eliminados correctamente`);
    }
    
    if (failed > 0) {
      this.showWarning(`${failed} inventarios no pudieron ser eliminados`);
    }
  }

  // ========== UTILIDADES (Manteniendo y expandiendo funcionalidad original) ==========

  hideDialog(): void {
    this.inventarioDialog = false;
    this.submitted = false;
    this.inventario = this.initInventario();
    this.resetSelections();
  }

  private resetSelections(): void {
    this.colorSeleccionado = null;
    this.tallaSeleccionada = null;
    this.almacenSeleccionado = null;
    this.colores = [];
    this.tallas = [];
  }

  onGlobalFilter(dt: { filterGlobal: (value: string, filterMatchMode: string) => void }, event: Event): void {
    const element = event.target as HTMLInputElement;
    dt.filterGlobal(element.value, 'contains');
  }

  getEstadoSeverity(estado: EstadoInventario | string): 'success' | 'danger' | 'warning' | 'info' | 'secondary' {
    const severityMap: Record<EstadoInventario, 'success' | 'danger' | 'warning' | 'info'> = {
      [EstadoInventario.DISPONIBLE]: 'success',
      [EstadoInventario.AGOTADO]: 'danger',
      [EstadoInventario.BAJO_STOCK]: 'warning',
      [EstadoInventario.RESERVADO]: 'info'
    };

    if (Object.values(EstadoInventario).includes(estado as EstadoInventario)) {
      return severityMap[estado as EstadoInventario];
    }
    
    return 'secondary';
  }

  // ========== EXPORTACIÓN (Manteniendo y expandiendo funcionalidad original) ==========

  exportarExcel(): void {
    if (!this.inventariosFiltrados?.length) {
      this.showWarning('No hay datos para exportar');
      return;
    }

    import('xlsx').then(xlsx => {
      const dataToExport = this.inventariosFiltrados.map(inventario => ({
        'Serie': inventario.serie || '',
        'Producto': inventario.producto?.nombre || '',
        'Código': inventario.producto?.codigo || '',
        'Color': inventario.color?.nombre || '',
        'Talla': inventario.talla?.numero || '',
        'Almacén': inventario.almacen?.nombre || '',
        'Cantidad': inventario.cantidad,
        'Estado': inventario.estado,
        'Valor Unitario': inventario.valorUnitario || 0,
        'Valor Total': inventario.valorTotal || 0,
        'Stock Mínimo': inventario.stockMinimo || 0,
        'Categoría ABC': inventario.categoriaABC || '',
        'Rotación': inventario.rotacion || 0,
        'Ubicación': inventario.ubicacionAlmacen || '',
        'Lote': inventario.lote || '',
        'Fecha Vencimiento': inventario.fechaVencimiento ? new Date(inventario.fechaVencimiento).toLocaleDateString() : '',
        'Última Actualización': new Date(inventario.fechaActualizacion).toLocaleString()
      }));
      
      const worksheet = xlsx.utils.json_to_sheet(dataToExport);
      const workbook = { Sheets: { 'Inventario': worksheet }, SheetNames: ['Inventario'] };
      const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
      this.guardarArchivo(excelBuffer, 'inventario_detallado');
    }).catch(() => {
      this.showError('Error al cargar la biblioteca de exportación');
    });
  }

  private guardarArchivo(buffer: ArrayBuffer, fileName: string): void {
    const data = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(data);
    link.download = `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    link.click();
  }

  // ========== INICIALIZACIÓN (Manteniendo funcionalidad original) ==========

  private initInventario(): InventarioExtendido {
    return {
      id: undefined,
      serie: '',
      producto: null,
      color: null,
      talla: null,
      almacen: null,
      cantidad: 0,
      estado: EstadoInventario.DISPONIBLE,
      fechaActualizacion: new Date().toISOString(),
      fechaCreacion: new Date().toISOString(),
      valorUnitario: 0,
      valorTotal: 0,
      rotacion: 0,
      diasSinMovimiento: 0,
      stockMinimo: 0,
      stockMaximo: 0,
      puntoReorden: 0,
      categoriaABC: 'C',
      tendencia: 'ESTABLE',
      prediccionDemanda: 0,
      movimientos: []
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
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: (error && typeof error === 'object' && 'error' in error && error.error && typeof error.error === 'object' && 'message' in error.error) 
        ? String(error.error.message) 
        : defaultMessage,
      life: 5000
    });
  }

  getDatosCategoria(categoriaInput: unknown) {
    let cat: string;
    
    if (typeof categoriaInput === 'object' && categoriaInput !== null && 'categoria' in categoriaInput) {
      cat = (categoriaInput as { categoria: string }).categoria;
    } else if (typeof categoriaInput === 'string') {
      cat = categoriaInput;
    } else {
      console.warn('Input inválido:', categoriaInput);
      return { productos: 0, valor: 0, porcentaje: 0 };
    }
    
    if (!['A', 'B', 'C'].includes(cat)) {
      console.warn('Categoría inválida:', cat);
      return { productos: 0, valor: 0, porcentaje: 0 };
    }
  
    const estadisticas = this.calcularEstadisticas();
    const analisis = estadisticas.analisisABC.find(a => a.categoria === cat);
    
    return {
      productos: analisis?.productos || 0,
      valor: analisis?.valor || 0,
      porcentaje: analisis?.porcentaje || 0
    };
  }

  getEstadoLabel(estado: EstadoInventario): string {
    return this.estadosInventario?.find(e => e.value === estado)?.label || '';
  }

  getStockPercentage(inventario: { cantidad: number; stockMaximo?: number }): number {
    return this.calculateWidthPercentage(inventario.cantidad, inventario.stockMaximo || 100);
  }

  getCategoriaColor(categoria: string): string {
    return this.categoriasABC?.find(c => c.categoria === categoria)?.color || '';
  }

  getCategoriaBackgroundColor(categoria: string): string {
    const color = this.categoriasABC?.find(c => c.categoria === categoria)?.color || '#000';
    return color + '10'; // Agregar transparencia
  }

  getProductosPorCategoria(categoriaInput: unknown): number {
    let cat: string;
    
    if (typeof categoriaInput === 'string') {
      cat = categoriaInput;
    } else if (typeof categoriaInput === 'object' && categoriaInput !== null && 'categoria' in categoriaInput) {
      cat = (categoriaInput as { categoria: string }).categoria;
    } else {
      console.warn('Input inválido en getProductosPorCategoria:', categoriaInput);
      return 0;
    }
    
    if (!['A', 'B', 'C'].includes(cat)) {
      console.warn('Categoría inválida en getProductosPorCategoria:', cat);
      return 0;
    }
  
    const estadisticas = this.calcularEstadisticas();
    return estadisticas.analisisABC.find(a => a.categoria === cat)?.productos || 0;
  }

  getValorPorCategoria(categoriaInput: unknown): number {
    let cat: string;
    
    if (typeof categoriaInput === 'string') {
      cat = categoriaInput;
    } else if (typeof categoriaInput === 'object' && categoriaInput !== null && 'categoria' in categoriaInput) {
      cat = (categoriaInput as { categoria: string }).categoria;
    } else {
      console.warn('Input inválido en getValorPorCategoria:', categoriaInput);
      return 0;
    }
    
    if (!['A', 'B', 'C'].includes(cat)) {
      console.warn('Categoría inválida en getValorPorCategoria:', cat);
      return 0;
    }
  
    const estadisticas = this.calcularEstadisticas();
    return estadisticas.analisisABC.find(a => a.categoria === cat)?.valor || 0 ;
  }

  getPorcentajePorCategoria(categoriaInput: unknown): number {
    let cat: string;
    
    if (typeof categoriaInput === 'string') {
      cat = categoriaInput;
    } else if (typeof categoriaInput === 'object' && categoriaInput !== null && 'categoria' in categoriaInput) {
      cat = (categoriaInput as { categoria: string }).categoria;
    } else {
      console.warn('Input inválido en getPorcentajePorCategoria:', categoriaInput);
      return 0;
    }
    
    if (!['A', 'B', 'C'].includes(cat)) {
      console.warn('Categoría inválida en getPorcentajePorCategoria:', cat);
      return 0;
    }
  
    const estadisticas = this.calcularEstadisticas();
    return estadisticas.analisisABC.find(a => a.categoria === cat)?.porcentaje || 0;
  }

  

  getDateClass(fechaVencimiento: string | Date): string {
    const fechaVenc = typeof fechaVencimiento === 'string' ? new Date(fechaVencimiento) : fechaVencimiento;
    const hoy = new Date();
    const treintaDias = 30 * 24 * 60 * 60 * 1000;
  
    if (fechaVenc < hoy) {
      return 'text-red-600'; // Vencido
    } else if (fechaVenc.getTime() - hoy.getTime() < treintaDias) {
      return 'text-orange-600'; // Próximo a vencer (menos de 30 días)
    } else {
      return 'text-green-600'; // Vigente
    }
  }
  
  isExpired(fechaVencimiento: string | Date): boolean {
    const fechaVenc = typeof fechaVencimiento === 'string' ? new Date(fechaVencimiento) : fechaVencimiento;
    return fechaVenc < new Date();
  }
  
  isNearExpiry(fechaVencimiento: string | Date): boolean {
    const fechaVenc = typeof fechaVencimiento === 'string' ? new Date(fechaVencimiento) : fechaVencimiento;
    const hoy = new Date();
    const treintaDias = 30 * 24 * 60 * 60 * 1000;
    return fechaVenc.getTime() - hoy.getTime() < treintaDias && fechaVenc >= hoy;
  }

   /**
   * Abre modal para nuevo movimiento
   */
   abrirNuevoMovimiento(): void {
    this.newMovimientosDialog = true;
    this.movimiento = this.createEmptyMovimientoResponse();
    this.submitted = false;
    this.resetSelections();
  }

    /**
   * Exporta movimientos a Excel
   */
    exportarMovimientos(): void {
      const todosMovimientos = this.inventariosFiltrados
        .flatMap(inv => inv.movimientos || [])
        .sort((a, b) => new Date(b.fechaMovimiento).getTime() - new Date(a.fechaMovimiento).getTime());
    
      if (!todosMovimientos.length) {
        this.showWarning('No hay movimientos para exportar');
        return;
      }
    
      this.showInfo('Generando reporte de movimientos...');
    
      import('xlsx').then(xlsx => {
        const dataToExport = todosMovimientos.map(mov => ({
          'ID Movimiento': mov.id,
          'Tipo': mov.tipo,
          'Inventario ID': mov.inventarioId,
          'Producto': mov.producto?.nombre || 'N/A',
          'Código Producto': mov.producto?.codigo || 'N/A',
          'Color': mov.color?.nombre || 'N/A',
          'Talla': mov.talla?.numero || 'N/A',
          'Cantidad': mov.cantidad,
          'Descripción': mov.descripcion,
          'Referencia': mov.referencia || '',
          'Usuario': mov.usuario,
          'Fecha': new Date(mov.fechaMovimiento).toLocaleString('es-PE'),
          'Inventario Destino ID': mov.inventarioDestinoId || '',
          'Almacén Destino': mov.almacenDestinoNombre || '',
          'Estado Resultante': mov.estadoResultante || ''
        }));
        
        const worksheet = xlsx.utils.json_to_sheet(dataToExport);
        
        const colWidths = [
          { wch: 12 }, // ID Movimiento
          { wch: 12 }, // Tipo
          { wch: 12 }, // Inventario ID
          { wch: 25 }, // Producto
          { wch: 15 }, // Código Producto
          { wch: 12 }, // Color
          { wch: 8 },  // Talla
          { wch: 10 }, // Cantidad
          { wch: 30 }, // Descripción
          { wch: 15 }, // Referencia
          { wch: 12 }, // Usuario
          { wch: 18 }, // Fecha
          { wch: 15 }, // Inventario Destino ID
          { wch: 15 }, // Almacén Destino
          { wch: 15 }  // Estado Resultante
        ];
        worksheet['!cols'] = colWidths;
        
        const workbook = { 
          Sheets: { 'Movimientos': worksheet }, 
          SheetNames: ['Movimientos'] 
        };
        
        const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
        this.guardarArchivo(excelBuffer, 'movimientos_inventario');
        
        this.showSuccess('Reporte de movimientos generado correctamente');
      }).catch(() => {
        this.showError('Error al generar el reporte de movimientos');
      });
    }

      /**
   * Aplica filtros avanzados
   */
  aplicarFiltros(): void {
    let filtrados = [...this.inventarios];
    
    // Aplicar filtro de producto seleccionado
    if (this.productoSeleccionadoFiltro) {
      filtrados = filtrados.filter(inv => 
        inv.producto?.id === this.productoSeleccionadoFiltro?.id
      );
    }
    
    // Aplicar filtros adicionales del objeto filtrosInventario
    if (this.filtrosInventario.estado) {
      filtrados = filtrados.filter(inv => inv.estado === this.filtrosInventario.estado);
    }
    
    if (this.filtrosInventario.almacen) {
      filtrados = filtrados.filter(inv => 
        inv.almacen?.nombre?.toLowerCase().includes(this.filtrosInventario.almacen!.toLowerCase())
      );
    }
    
    if (this.filtrosInventario.stockMin !== null && this.filtrosInventario.stockMin !== undefined) {
      filtrados = filtrados.filter(inv => inv.cantidad >= this.filtrosInventario.stockMin!);
    }
    
    if (this.filtrosInventario.stockMax !== null && this.filtrosInventario.stockMax !== undefined) {
      filtrados = filtrados.filter(inv => inv.cantidad <= this.filtrosInventario.stockMax!);
    }
    
    if (this.filtrosInventario.soloStockCritico) {
      filtrados = filtrados.filter(inv => 
        inv.cantidad <= (inv.stockMinimo || 5) && inv.cantidad > 0
      );
    }
    
    if (this.filtrosInventario.soloAgotados) {
      filtrados = filtrados.filter(inv => inv.cantidad === 0);
    }

    if (this.filtrosInventario.valorMin !== null && this.filtrosInventario.valorMin !== undefined) {
      filtrados = filtrados.filter(inv => (inv.valorTotal || 0) >= this.filtrosInventario.valorMin!);
    }

    if (this.filtrosInventario.valorMax !== null && this.filtrosInventario.valorMax !== undefined) {
      filtrados = filtrados.filter(inv => (inv.valorTotal || 0) <= this.filtrosInventario.valorMax!);
    }
    
    this.inventariosFiltrados = filtrados;
    this.updateChartData();
  }

     /**
   * Verifica si hay filtros activos
   */
  hayFiltrosActivos(): boolean {
    return !!(
      this.filtrosInventario.producto ||
      this.filtrosInventario.estado ||
      this.filtrosInventario.almacen ||
      this.filtrosInventario.soloStockCritico ||
      this.filtrosInventario.soloAgotados ||
      this.filtrosInventario.stockMin ||
      this.filtrosInventario.stockMax ||
      this.filtrosInventario.valorMin ||
      this.filtrosInventario.valorMax
    );
  }

   /**
   * Cuenta resultados de filtros
   */
   contarResultadosFiltros(): number {
    return this.inventariosFiltrados.length;
  }

   /**
   * Remueve un filtro específico
   */
   removerFiltro(filtro: string): void {
    switch (filtro) {
      case 'producto':
        this.productoSeleccionadoFiltro = null;
        break;
      case 'estado':
        this.filtrosInventario.estado = null;
        break;
      case 'stockCritico':
        this.filtrosInventario.soloStockCritico = false;
        break;
      case 'agotados':
        this.filtrosInventario.soloAgotados = false;
        break;
    }
    this.aplicarFiltros();
  }

    /**
   * Limpia todos los filtros
   */
    limpiarTodosFiltros(): void {
      this.filtrosInventario = {
        producto: '',
        almacen: null,
        estado: null,
        stockMin: null,
        stockMax: null,
        color: null,
        talla: null,
        fechaDesde: null,
        fechaHasta: null,
        soloStockCritico: false,
        soloAgotados: false,
        valorMin: null,
        valorMax: null
      };
      this.productoSeleccionadoFiltro = null;
      this.inventariosFiltrados = [...this.inventarios];
      this.updateChartData();
    }

   /**
   * Configura alertas del sistema
   */
  configurarAlertas(): void {
    this.showInfo('Abriendo configuración de alertas...');
    // Aquí se implementaría la lógica de configuración de alertas
    setTimeout(() => {
      this.showSuccess('Configuración de alertas lista para implementar');
    }, 1000);
  }

    /**
   * Recalcula análisis ABC
   */
    recalcularABC(): void {
      this.showInfo('Recalculando análisis ABC...');
      this.loading = true;
      
      // Simular recálculo con lógica más sofisticada
      setTimeout(() => {
        // Ordenar inventarios por valor total descendente
        const inventariosOrdenados = [...this.inventariosFiltrados]
          .sort((a, b) => (b.valorTotal || 0) - (a.valorTotal || 0));
  
        const totalInventarios = inventariosOrdenados.length;
        const limiteCategoriaA = Math.ceil(totalInventarios * 0.2); // 20% superior
        const limiteCategoriaB = Math.ceil(totalInventarios * 0.5); // 30% medio (20% + 30%)
  
        // Reasignar categorías ABC basado en valor
        inventariosOrdenados.forEach((inventario, index) => {
          if (index < limiteCategoriaA) {
            inventario.categoriaABC = 'A';
          } else if (index < limiteCategoriaB) {
            inventario.categoriaABC = 'B';
          } else {
            inventario.categoriaABC = 'C';
          }
        });
  
        this.updateChartData();
        this.loading = false;
        
        this.showSuccess('Análisis ABC recalculado correctamente');
      }, 2000);
    }

     /**
   * Exporta análisis ABC a Excel
   */
  exportarAnalisisABC(): void {
    const analisisABC = this.getAnalisisABC();
    
    if (!analisisABC.length) {
      this.showWarning('No hay datos ABC para exportar');
      return;
    }

    this.showInfo('Generando análisis ABC...');

    import('xlsx').then(xlsx => {
      // Hoja 1: Resumen ABC
      const resumenData = analisisABC.map(categoria => ({
        'Categoría': categoria.categoria,
        'Número de Productos': categoria.productos,
        'Valor Total': categoria.valor,
        'Porcentaje del Total': `${categoria.porcentaje.toFixed(2)}%`,
        'Valor Promedio por Producto': categoria.productos > 0 ? 
          (categoria.valor / categoria.productos).toFixed(2) : 0
      }));

      // Hoja 2: Detalle por producto
      const detalleData = this.inventariosFiltrados.map(inv => ({
        'Producto': inv.producto?.nombre || '',
        'Color': inv.color?.nombre || '',
        'Talla': inv.talla?.numero || '',
        'Categoría ABC': inv.categoriaABC || '',
        'Cantidad': inv.cantidad,
        'Valor Unitario': inv.valorUnitario || 0,
        'Valor Total': inv.valorTotal || 0,
        'Rotación': inv.rotacion || 0,
        'Porcentaje del Inventario': this.calcularEstadisticas().valorTotalInventario > 0 ? 
          (((inv.valorTotal || 0) / this.calcularEstadisticas().valorTotalInventario) * 100).toFixed(4) + '%' : '0%'
      })).sort((a, b) => {
        const ordenABC = { 'A': 1, 'B': 2, 'C': 3 };
        return (ordenABC[a['Categoría ABC'] as keyof typeof ordenABC] || 4) - 
               (ordenABC[b['Categoría ABC'] as keyof typeof ordenABC] || 4);
      });

      const resumenSheet = xlsx.utils.json_to_sheet(resumenData);
      const detalleSheet = xlsx.utils.json_to_sheet(detalleData);
      
      const workbook = { 
        Sheets: { 
          'Resumen_ABC': resumenSheet,
          'Detalle_por_Producto': detalleSheet
        }, 
        SheetNames: ['Resumen_ABC', 'Detalle_por_Producto'] 
      };
      
      const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
      this.guardarArchivo(excelBuffer, 'analisis_abc_detallado');
      
      this.showSuccess('Análisis ABC exportado correctamente');
    }).catch(() => {
      this.showError('Error al generar el análisis ABC');
    });
  }

  selectedFilter = 'all';
  rangeValues: number[] = [2, 15];

  /**
   * Muestra mensaje informativo
   */
  private showInfo(message: string): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Información',
      detail: message,
      life: 3000
    });
  }

}
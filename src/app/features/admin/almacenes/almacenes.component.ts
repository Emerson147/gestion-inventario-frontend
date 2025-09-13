import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
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
import { ProgressBarModule } from 'primeng/progressbar'; // 👈 Nuevo import
import { KnobModule } from 'primeng/knob';
import { MultiSelectModule } from 'primeng/multiselect'; // 👈 Nuevo import
import { ChartModule } from 'primeng/chart'; // 👈 Nuevo import
import { SelectModule } from 'primeng/select'; // 👈 Nuevo import
import { InputNumberModule } from 'primeng/inputnumber'; // 👈 Nuevo import
import { CalendarModule } from 'primeng/calendar'; // 👈 Nuevo import
import { CheckboxModule } from 'primeng/checkbox'; // 👈 Nuevo import
import { TagModule } from 'primeng/tag'; // 👈 Nuevo import
import { RatingModule } from 'primeng/rating'; // 👈 Nuevo import
import { AccordionModule } from 'primeng/accordion'; // 👈 Nuevo import
import { SplitterModule } from 'primeng/splitter'; // 👈 Nuevo import

import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { Almacen } from '../../../core/models/almacen.model';
import { AlmacenService } from '../../../core/services/almacen.service';
import { PermissionService, PermissionType } from '../../../core/services/permission.service';
import { finalize, forkJoin, catchError, of, firstValueFrom } from 'rxjs';

interface ViewOption {
  label: string;
  value: 'map' | 'grid' | 'list' | 'analytics' | 'zones';
  icon: string;
}

interface AlmacenStats {
  totalAlmacenes: number;
  capacidadTotal: number;
  capacidadUtilizada: number;
  porcentajeOcupacion: number;
  almacenesActivos: number;
  almacenesInactivos: number;
  zonasTotal: number;
  distribucionCapacidad: { almacen: string, capacidad: number, utilizada: number, porcentaje: number }[];
  alertasCapacidad: { almacen: string, mensaje: string, severidad: string }[];
  eficienciaPromedio: number;
  valorInventarioTotal: number;
}

interface ZonaAlmacen {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  capacidad: number;
  ocupacion: number;
  tipo: 'RECEPCION' | 'ALMACENAMIENTO' | 'PICKING' | 'DESPACHO' | 'DEVOLUCION';
  estado: 'ACTIVA' | 'MANTENIMIENTO' | 'FUERA_SERVICIO';
  coordenadas?: { x: number, y: number, width: number, height: number };
}

interface UbicacionGeografica {
  latitud: number;
  longitud: number;
  direccion: string;
  ciudad: string;
  pais: string;
  codigoPostal?: string;
}

interface AlmacenExtendido extends Almacen {
  capacidadMaxima?: number;
  capacidadUtilizada?: number;
  porcentajeOcupacion?: number;
  estado?: 'ACTIVO' | 'INACTIVO' | 'MANTENIMIENTO';
  responsable?: string;
  telefono?: string;
  email?: string | string[]; // Allow both string and string[] for email
  horarioOperacion?: string;
  tipoAlmacen?: 'PRINCIPAL' | 'SUCURSAL' | 'TEMPORAL' | 'DEPOSITO';
  ubicacionGeografica?: UbicacionGeografica;
  zonas?: ZonaAlmacen[];
  fechaUltimaInspeccion?: Date;
  proximaInspeccion?: Date;
  certificaciones?: string[];
  temperatura?: { min: number, max: number, actual: number };
  humedad?: { min: number, max: number, actual: number };
  seguridad?: {
    camaras: number;
    accesosControlados: number;
    sistemasIncendio: boolean;
    alarmas: boolean;
  };
  kpis?: {
    rotacionInventario: number;
    preciscionInventario: number;
    tiempoPromedioPicking: number;
    eficienciaEspacio: number;
  };
}

interface FiltrosAlmacenes {
  nombre: string;
  ubicacion: string;
  estado: string | null;
  tipoAlmacen: string | null;
  capacidadMin: number | null;
  capacidadMax: number | null;
  ocupacionMin: number | null;
  ocupacionMax: number | null;
  responsable: string;
  ciudad: string;
}

@Component({
  selector: 'app-almacenes',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    ConfirmDialogModule,
    DialogModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    TableModule,
    TextareaModule,
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
    MultiSelectModule, 
    ChartModule, 
    SelectModule, 
    InputNumberModule, 
    CalendarModule, 
    CheckboxModule, 
    TagModule, 
    RatingModule, 
    AccordionModule, 
    SplitterModule,
    CheckboxModule, // 👈 Nuevo import
    TagModule, // 👈 Nuevo import
    RatingModule, // 👈 Nuevo import
    AccordionModule, // 👈 Nuevo import
    SplitterModule, // 👈 Nuevo import
    HasPermissionDirective
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './almacenes.component.html',
  styles: [`
    :host ::ng-deep {
      /* Warehouse cards con efectos 3D */
      .warehouse-card {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
        position: relative;
        overflow: hidden;
      }
      
      .warehouse-card:hover {
        transform: translateY(-8px) rotateX(2deg);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      }
      
      .warehouse-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        transition: left 0.5s;
      }
      
      .warehouse-card:hover::before {
        left: 100%;
      }
      
      /* Capacity indicators con animaciones */
      .capacity-ring {
        position: relative;
        overflow: hidden;
      }
      
      .capacity-ring::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: conic-gradient(from 0deg, #10b981 0deg, #10b981 var(--percentage), #e5e7eb var(--percentage), #e5e7eb 360deg);
        border-radius: 50%;
        transition: all 0.3s ease;
      }
      
      /* Map markers animados */
      .map-marker {
        animation: pulse-marker 2s infinite;
      }
      
      @keyframes pulse-marker {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.8; }
      }
      
      /* Zone layouts */
      .zone-layout {
        background: 
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 20px,
            rgba(0,0,0,.03) 20px,
            rgba(0,0,0,.03) 21px
          ),
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 20px,
            rgba(0,0,0,.03) 20px,
            rgba(0,0,0,.03) 21px
          );
      }
      
      .zone-block {
        transition: all 0.3s ease;
        cursor: pointer;
      }
      
      .zone-block:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
      
      /* KPI cards mejorados */
      .kpi-card {
        background: linear-gradient(135deg, white 0%, #f8fafc 100%);
        border: 1px solid rgba(0, 0, 0, 0.05);
        transition: all 0.3s ease;
      }
      
      .kpi-card:hover {
        background: linear-gradient(135deg, #f8fafc 0%, white 100%);
        border-color: rgba(16, 185, 129, 0.2);
      }
      
      /* Progress bars mejorados */
      .p-progressbar {
        border-radius: 25px !important;
        height: 12px !important;
        background: rgba(0,0,0,0.05) !important;
        overflow: hidden;
      }
      
      .p-progressbar .p-progressbar-value {
        border-radius: 25px !important;
        transition: all 0.5s ease !important;
        position: relative;
      }
      
      .p-progressbar .p-progressbar-value::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%);
        animation: progress-shine 2s infinite;
      }
      
      @keyframes progress-shine {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      
      /* Dialogs mejorados */
      .warehouse-dialog .p-dialog-header {
        background: linear-gradient(135deg, #059669 0%, #10b981 100%) !important;
        color: white !important;
        border-radius: 16px 16px 0 0 !important;
      }
      
      .warehouse-dialog .p-dialog-content {
        background: linear-gradient(135deg, #f8fafc 0%, white 100%) !important;
      }
      
      /* Status indicators */
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
      
      .status-active::after { background: #10b981; }
      .status-inactive::after { background: #ef4444; }
      .status-maintenance::after { background: #f59e0b; }
      
      @keyframes status-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    }

    /* Utilidades CSS personalizadas */
    .warehouse-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 2rem;
    }
    
    .analytics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }
    
    .zone-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }
    
    .capacity-high { 
      background: linear-gradient(135deg, #fee2e2 0%, #ef4444 100%); 
      color: #991b1b;
    }
    
    .capacity-medium { 
      background: linear-gradient(135deg, #fef3c7 0%, #f59e0b 100%); 
      color: #92400e;
    }
    
    .capacity-low { 
      background: linear-gradient(135deg, #d1fae5 0%, #10b981 100%); 
      color: #065f46;
    }
    
    /* Animaciones */
    @keyframes warehouse-entrance {
      from {
        opacity: 0;
        transform: translateY(30px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    
    .warehouse-entrance {
      animation: warehouse-entrance 0.6s ease-out;
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
    
    .float-animation {
      animation: float 3s ease-in-out infinite;
    }
  `]
})
export class AlmacenesComponent implements OnInit, AfterViewInit {
  // Make Math available in template
  Math = Math;
  
  @ViewChild('warehouseTable') warehouseTable!: ElementRef;

  // ========== DATOS Y ESTADO ==========
  almacenes: AlmacenExtendido[] = [];
  selectedAlmacenes: AlmacenExtendido[] = [];
  almacen: AlmacenExtendido = this.initAlmacen();

  // Cache para estadísticas (evita recálculos innecesarios)
  private _cachedStats: AlmacenStats | null = null;
  private _lastAlmacenesLength = 0;

  // ========== ESTADO UI ==========
  almacenDialog = false;
  editMode = false;
  loading = false;
  submitted = false;
  currentView: 'map' | 'grid' | 'list' | 'analytics' | 'zones' = 'grid';

  // 👇 Nuevas propiedades para el diseño moderno
  estadisticasDialog = false;
  zonasDialog = false;
  mapaDialog = false;
  filtrosDialog = false;
  detalleAlmacenDialog = false;
  activeTab = 0; // 0: Info, 1: Zonas, 2: KPIs, 3: Histórico

  // Filtros y búsqueda
  filtrosVisibles = false;
  filtros: FiltrosAlmacenes = {
    nombre: '',
    ubicacion: '',
    estado: null,
    tipoAlmacen: null,
    capacidadMin: null,
    capacidadMax: null,
    ocupacionMin: null,
    ocupacionMax: null,
    responsable: '',
    ciudad: ''
  };

  // Gráficos y estadísticas
  chartData: {
    labels: string[];
    datasets: {
      data: number[];
      backgroundColor: string[];
      borderWidth: number;
      borderColor: string;
    }[];
  } = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [],
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  };
  // Chart options with proper typing
  // Using type assertion to bypass TypeScript errors for Chart.js options
  // since the type definitions might be stricter than the actual library
  chartOptions: Record<string, unknown> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#495057',
          usePointStyle: true
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#6c757d'
        },
        grid: {
          color: '#e9ecef',
          drawBorder: false,
          display: true
        }
      },
      y: {
        ticks: {
          color: '#6c757d'
        },
        grid: {
          color: '#e9ecef',
          drawBorder: false,
          display: true
        }
      }
    }
  };
  
  // Configuración de mapas (simulado)
  mapaConfig = {
    centro: { lat: -12.0464, lng: -77.0428 }, // Lima, Perú
    zoom: 10,
    marcadores: []
  };

  // ========== PERMISOS ==========
  permissionTypes = PermissionType;

  // ========== CONFIGURACIÓN ==========
  viewOptions: ViewOption[] = [
    { label: 'Vista Grid', value: 'grid', icon: 'pi pi-th-large' },
    { label: 'Mapa', value: 'map', icon: 'pi pi-map' },
    { label: 'Lista', value: 'list', icon: 'pi pi-list' },
    { label: 'Analytics', value: 'analytics', icon: 'pi pi-chart-bar' },
    { label: 'Zonas', value: 'zones', icon: 'pi pi-sitemap' }
  ];

  estadosAlmacen = [
    { label: 'Activo', value: 'ACTIVO', color: 'success', icon: 'pi pi-check-circle' },
    { label: 'Inactivo', value: 'INACTIVO', color: 'danger', icon: 'pi pi-times-circle' },
    { label: 'Mantenimiento', value: 'MANTENIMIENTO', color: 'warning', icon: 'pi pi-wrench' }
  ];

  tiposAlmacen = [
    { label: 'Principal', value: 'PRINCIPAL', icon: 'pi pi-building' },
    { label: 'Sucursal', value: 'SUCURSAL', icon: 'pi pi-home' },
    { label: 'Temporal', value: 'TEMPORAL', icon: 'pi pi-clock' },
    { label: 'Depósito', value: 'DEPOSITO', icon: 'pi pi-box' }
  ];

  tiposZona = [
    { label: 'Recepción', value: 'RECEPCION', icon: 'pi pi-sign-in', color: '#3b82f6' },
    { label: 'Almacenamiento', value: 'ALMACENAMIENTO', icon: 'pi pi-database', color: '#10b981' },
    { label: 'Picking', value: 'PICKING', icon: 'pi pi-shopping-cart', color: '#f59e0b' },
    { label: 'Despacho', value: 'DESPACHO', icon: 'pi pi-send', color: '#ef4444' },
    { label: 'Devolución', value: 'DEVOLUCION', icon: 'pi pi-replay', color: '#8b5cf6' }
  ];

  estadosZona = [
    { label: 'Activa', value: 'ACTIVA', color: 'success', icon: 'pi pi-check' },
    { label: 'Mantenimiento', value: 'MANTENIMIENTO', color: 'warning', icon: 'pi pi-wrench' },
    { label: 'Fuera de Servicio', value: 'FUERA_SERVICIO', color: 'danger', icon: 'pi pi-ban' }
  ];

  // 👇 Returns estadosAlmacen with an 'All' option
  get estadosAlmacenConTodos() {
    return [
      { label: 'Todos', value: null },
      ...this.estadosAlmacen
    ];
  }

  // 👇 Returns tiposAlmacen with an 'All' option
  get tiposAlmacenConTodos() {
    return [
      { label: 'Todos', value: null },
      ...this.tiposAlmacen
    ];
  }

  currentDate: Date = new Date();

  private readonly almacenService: AlmacenService = inject(AlmacenService);
  private readonly messageService: MessageService = inject(MessageService);
  private readonly confirmationService: ConfirmationService = inject(ConfirmationService);
  private readonly permissionService: PermissionService = inject(PermissionService);

  constructor(
   
  ) {
    this.initChartOptions();
  }

  // Helper method to generate random numbers for demo purposes
  getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Safe method to get almacenes count by estado
  getAlmacenesCountByEstado(estado: string): number {
    if (!this.almacenes || !this.almacenes.length) return 0;
    return this.almacenes.filter(a => a.estado === estado).length;
  }

  // Safe division to prevent division by zero
  safeDivide(numerator: number, denominator: number): number {
    return denominator === 0 ? 0 : (numerator / denominator) * 100;
  }

  ngOnInit(): void {
    this.loadAlmacenes();
    this.generarDatosSimulados();
  }

  ngAfterViewInit(): void {
    // Animaciones de entrada
    setTimeout(() => {
      const elements = document.querySelectorAll('.warehouse-entrance');
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
    // Initialize chart options with proper typing
    // Using Record<string, unknown> to handle complex Chart.js options
    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            color: '#495057'
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0,0,0,0.1)',
            drawBorder: false,
            display: true
          },
          ticks: {
            color: '#6c757d'
          }
        },
        x: {
          grid: {
            color: 'rgba(0,0,0,0.05)',
            drawBorder: false,
            display: true
          },
          ticks: {
            color: '#6c757d'
          }
        }
      }
    };
  }

  /**
   * 👇 Genera datos simulados para demostración (con valores consistentes)
   */
  generarDatosSimulados(): void {
    // Simular datos extendidos para los almacenes existentes
    this.almacenes = this.almacenes.map((almacen, index) => {
      // Usar ID del almacén para generar valores consistentes
      const almacenId = almacen.id || (index + 1);
      const seed = almacenId * 12345; // Semilla para valores consistentes
      
      return {
        ...almacen,
        capacidadMaxima: 1000 + (index * 500),
        capacidadUtilizada: 200 + ((seed % 800) + 200),
        estado: (['ACTIVO', 'ACTIVO', 'MANTENIMIENTO', 'ACTIVO'] as const)[index % 4],
        responsable: ['Carlos Mendoza', 'Ana García', 'Luis Rodríguez', 'María Fernández'][index % 4],
        telefono: [`+51 ${900000000 + index}`, `+51 ${900000001 + index}`][index % 2],
        email: [`almacen${index + 1}@empresa.com`],
        tipoAlmacen: (['PRINCIPAL', 'SUCURSAL', 'TEMPORAL', 'DEPOSITO'] as const)[index % 4],
        horarioOperacion: '24/7',
        ubicacionGeografica: {
          latitud: -12.0464 + ((seed % 100 - 50) / 1000),
          longitud: -77.0428 + ((seed % 100 - 50) / 1000),
          direccion: `Av. Industrial ${100 + index * 50}`,
          ciudad: 'Lima',
          pais: 'Perú',
          codigoPostal: `150${10 + index}`
        },
        temperatura: {
          min: 18,
          max: 25,
          actual: 20 + ((seed % 30) / 10)
        },
        humedad: {
          min: 40,
          max: 60,
          actual: 45 + ((seed % 100) / 10)
        },
        kpis: {
          rotacionInventario: 75 + (seed % 20),
          preciscionInventario: 92 + (seed % 7),
          tiempoPromedioPicking: 15 + (seed % 10),
          eficienciaEspacio: 80 + (seed % 15)
        },
        zonas: this.generarZonasSimuladas(almacenId)
      };
    });

    // Calcular porcentaje de ocupación
    this.almacenes.forEach(almacen => {
      if (almacen.capacidadMaxima && almacen.capacidadUtilizada) {
        almacen.porcentajeOcupacion = (almacen.capacidadUtilizada / almacen.capacidadMaxima) * 100;
      }
    });

    this.updateChartData();
  }

  /**
   * 👇 Genera zonas simuladas para cada almacén (con valores consistentes)
   */
  generarZonasSimuladas(almacenId: number): ZonaAlmacen[] {
    const seed = almacenId * 12345; // Semilla para valores consistentes
    
    return [
      {
        id: 1,
        codigo: 'REC-01',
        nombre: 'Zona de Recepción',
        descripcion: 'Área para recepción de mercancías',
        capacidad: 200,
        ocupacion: 50 + (seed % 150),
        tipo: 'RECEPCION',
        estado: 'ACTIVA',
        coordenadas: { x: 10, y: 10, width: 80, height: 40 }
      },
      {
        id: 2,
        codigo: 'ALM-01',
        nombre: 'Almacenamiento Principal',
        descripcion: 'Zona principal de almacenamiento',
        capacidad: 500,
        ocupacion: 100 + (seed % 400),
        tipo: 'ALMACENAMIENTO',
        estado: 'ACTIVA',
        coordenadas: { x: 100, y: 10, width: 120, height: 80 }
      },
      {
        id: 3,
        codigo: 'PICK-01',
        nombre: 'Zona de Picking',
        descripcion: 'Área para preparación de pedidos',
        capacidad: 150,
        ocupacion: 30 + (seed % 100),
        tipo: 'PICKING',
        estado: 'ACTIVA',
        coordenadas: { x: 230, y: 10, width: 70, height: 50 }
      },
      {
        id: 4,
        codigo: 'DESP-01',
        nombre: 'Zona de Despacho',
        descripcion: 'Área para despacho de pedidos',
        capacidad: 100,
        ocupacion: 20 + (seed % 80),
        tipo: 'DESPACHO',
        estado: 'ACTIVA',
        coordenadas: { x: 310, y: 10, width: 60, height: 40 }
      }
    ];
  }

  /**
   * 👇 Calcula estadísticas generales de almacenes (con cache)
   */
  calcularEstadisticas(): AlmacenStats {
    // Verificar si necesitamos recalcular
    if (this._cachedStats && this._lastAlmacenesLength === this.almacenes.length) {
      return this._cachedStats;
    }

    const capacidadTotal = this.almacenes.reduce((sum, a) => sum + (a.capacidadMaxima || 0), 0);
    const capacidadUtilizada = this.almacenes.reduce((sum, a) => sum + (a.capacidadUtilizada || 0), 0);
    const almacenesActivos = this.almacenes.filter(a => a.estado === 'ACTIVO').length;
    const almacenesInactivos = this.almacenes.filter(a => a.estado !== 'ACTIVO').length;
    const zonasTotal = this.almacenes.reduce((sum, a) => sum + (a.zonas?.length || 0), 0);

    // Generar valor fijo para evitar cambios aleatorios
    const valorInventarioTotal = 750000; // Valor fijo en lugar de Math.random()

    this._cachedStats = {
      totalAlmacenes: this.almacenes.length,
      capacidadTotal,
      capacidadUtilizada,
      porcentajeOcupacion: capacidadTotal > 0 ? (capacidadUtilizada / capacidadTotal) * 100 : 0,
      almacenesActivos,
      almacenesInactivos,
      zonasTotal,
      distribucionCapacidad: this.getDistribucionCapacidad(),
      alertasCapacidad: this.getAlertasCapacidad(),
      eficienciaPromedio: this.almacenes.length > 0 ? 
        this.almacenes.reduce((sum, a) => sum + (a.kpis?.eficienciaEspacio || 0), 0) / this.almacenes.length : 0,
      valorInventarioTotal
    };

    this._lastAlmacenesLength = this.almacenes.length;
    return this._cachedStats;
  }

  /**
   * 👇 Limpia el cache de estadísticas
   */
  private clearStatsCache(): void {
    this._cachedStats = null;
  }

  // ========== MÉTODOS PARA VALORES FIJOS (REEMPLAZAN Math.random) ==========

  /**
   * 👇 Retorna valor fijo para inventario por almacén
   */
  getValorInventarioAlmacen(almacen: AlmacenExtendido): number {
    // Usar el ID del almacén para generar un valor consistente
    const baseValue = almacen.id ? almacen.id * 10000 + 25000 : 35000;
    return baseValue;
  }

  /**
   * 👇 Retorna valor fijo para operación
   */
  getValorOperacion(almacen: AlmacenExtendido): number {
    const baseValue = almacen.id ? almacen.id * 500 + 2500 : 3000;
    return baseValue;
  }

  /**
   * 👇 Retorna valor fijo para mantenimiento
   */
  getValorMantenimiento(almacen: AlmacenExtendido): number {
    const baseValue = almacen.id ? almacen.id * 300 + 1200 : 1500;
    return baseValue;
  }

  /**
   * 👇 Retorna valor fijo para personal
   */
  getValorPersonal(almacen: AlmacenExtendido): number {
    const baseValue = almacen.id ? almacen.id * 200 + 800 : 1000;
    return baseValue;
  }

  /**
   * 👇 Retorna valor fijo para ROI
   */
  getROI(almacen: AlmacenExtendido): number {
    const baseValue = almacen.id ? (almacen.id % 15) + 12 : 15;
    return baseValue;
  }

  /**
   * 👇 Obtiene distribución de capacidad por almacén
   */
  getDistribucionCapacidad(): { almacen: string, capacidad: number, utilizada: number, porcentaje: number }[] {
    return this.almacenes.map(almacen => ({
      almacen: almacen.nombre || 'Sin nombre',
      capacidad: almacen.capacidadMaxima || 0,
      utilizada: almacen.capacidadUtilizada || 0,
      porcentaje: almacen.porcentajeOcupacion || 0
    }));
  }

  /**
   * 👇 Genera alertas de capacidad
   */
  getAlertasCapacidad(): { almacen: string, mensaje: string, severidad: string }[] {
    const alertas: { almacen: string, mensaje: string, severidad: string }[] = [];
    
    this.almacenes.forEach(almacen => {
      if (almacen.porcentajeOcupacion! > 90) {
        alertas.push({
          almacen: almacen.nombre || '',
          mensaje: 'Capacidad crítica - requiere atención inmediata',
          severidad: 'high'
        });
      } else if (almacen.porcentajeOcupacion! > 75) {
        alertas.push({
          almacen: almacen.nombre || '',
          mensaje: 'Capacidad alta - considerar redistribución',
          severidad: 'medium'
        });
      }
    });

    return alertas;
  }

  /**
   * 👇 Actualiza datos de gráficos
   */
  updateChartData(): void {
    const estados = ['ACTIVO', 'INACTIVO', 'MANTENIMIENTO'];
    const distribucionEstados = estados.map(estado => ({
      estado,
      cantidad: this.almacenes.filter(a => a.estado === estado).length
    }));

    this.chartData = {
      labels: distribucionEstados.map(d => d.estado),
      datasets: [{
        data: distribucionEstados.map(d => d.cantidad),
        backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };
  }

  /**
   * 👇 Obtiene nivel de capacidad
   */
  getCapacityLevel(porcentaje: number): 'low' | 'medium' | 'high' {
    if (porcentaje >= 90) return 'high';
    if (porcentaje >= 75) return 'medium';
    return 'low';
  }

  /**
   * 👇 Obtiene clase CSS para la capacidad
   */
  getCapacityClass(porcentaje: number): string {
    const level = this.getCapacityLevel(porcentaje);
    return `capacity-${level}`;
  }

  /**
   * 👇 Obtiene icono del estado
   */
  getEstadoIcon(estado: string): string {
    const iconMap: Record<string, string> = {
      'ACTIVO': 'pi pi-check-circle',
      'INACTIVO': 'pi pi-times-circle',
      'MANTENIMIENTO': 'pi pi-wrench'
    };
    return iconMap[estado] || 'pi pi-circle';
  }

  /**
   * 👇 Obtiene color del estado
   */
  getEstadoColor(estado: string): string {
    const colorMap: Record<string, string> = {
      'ACTIVO': 'success',
      'INACTIVO': 'danger',
      'MANTENIMIENTO': 'warning'
    };
    return colorMap[estado] || 'secondary';
  }

  /**
   * 👇 Tracking para mejor performance
   */
  trackByAlmacen(index: number, almacen: AlmacenExtendido): number {
    return almacen.id || index;
  }

  trackByZona(index: number, zona: ZonaAlmacen): number {
    return zona.id || index;
  }

  /**
   * 👇 Muestra estadísticas detalladas
   */
  mostrarEstadisticas(): void {
    this.updateChartData();
    this.estadisticasDialog = true;
  }

  /**
   * 👇 Muestra vista de zonas
   */
  mostrarZonas(almacen?: AlmacenExtendido): void {
    if (almacen) {
      this.almacen = almacen;
    }
    this.zonasDialog = true;
  }

  /**
   * 👇 Muestra mapa de almacenes
   */
  mostrarMapa(): void {
    this.mapaDialog = true;
  }

  /**
   * 👇 Muestra filtros avanzados
   */
  mostrarFiltros(): void {
    this.filtrosDialog = true;
  }

  /**
   * 👇 Muestra detalle de almacén
   */
  mostrarDetalle(almacen: AlmacenExtendido): void {
    this.almacen = { ...almacen };
    this.detalleAlmacenDialog = true;
  }

  /**
   * 👇 Aplica filtros
   */
  aplicarFiltros(): void {
    // Implementar lógica de filtros
    let almacenesFiltrados = [...this.almacenes];

    if (this.filtros.nombre.trim()) {
      almacenesFiltrados = almacenesFiltrados.filter(a => 
        a.nombre?.toLowerCase().includes(this.filtros.nombre.toLowerCase())
      );
    }

    if (this.filtros.ubicacion.trim()) {
      almacenesFiltrados = almacenesFiltrados.filter(a => 
        a.ubicacion?.toLowerCase().includes(this.filtros.ubicacion.toLowerCase())
      );
    }

    if (this.filtros.estado) {
      almacenesFiltrados = almacenesFiltrados.filter(a => a.estado === this.filtros.estado);
    }

    if (this.filtros.tipoAlmacen) {
      almacenesFiltrados = almacenesFiltrados.filter(a => a.tipoAlmacen === this.filtros.tipoAlmacen);
    }

    // Aplicar otros filtros...

    this.almacenes = almacenesFiltrados;
    this.filtrosDialog = false;
    this.showSuccess('Filtros aplicados correctamente');
  }

  /**
   * 👇 Limpia filtros
   */
  limpiarFiltros(): void {
    this.filtros = {
      nombre: '',
      ubicacion: '',
      estado: null,
      tipoAlmacen: null,
      capacidadMin: null,
      capacidadMax: null,
      ocupacionMin: null,
      ocupacionMax: null,
      responsable: '',
      ciudad: ''
    };
    this.loadAlmacenes();
  }

  /**
   * 👇 Cierra modales
   */
  hideEstadisticasDialog(): void {
    this.estadisticasDialog = false;
  }

  hideZonasDialog(): void {
    this.zonasDialog = false;
  }

  hideMapaDialog(): void {
    this.mapaDialog = false;
  }

  hideFiltrosDialog(): void {
    this.filtrosDialog = false;
  }

  hideDetalleDialog(): void {
    this.detalleAlmacenDialog = false;
  }

  // ========== MÉTODOS DE CARGA (Manteniendo funcionalidad original) ==========

  loadAlmacenes(): void {
    this.loading = true;
    
    // Limpiar cache de estadísticas
    this.clearStatsCache();
    
    this.almacenService.getAlmacenes().subscribe(
      (response) => {
        // Check if response is a PagedResponse or a direct array
        const almacenesData = 'contenido' in response ? response.contenido : response;
        
        // Map the data to AlmacenExtendido array
        this.almacenes = (almacenesData || []).map((item: Almacen) => ({
          ...item,
          // Add any additional properties needed for AlmacenExtendido
          estado: 'ACTIVO', // Default value, adjust as needed
          capacidadMaxima: 0, // Default value, adjust as needed
          capacidadUtilizada: 0, // Default value, adjust as needed
          porcentajeOcupacion: 0
        } as AlmacenExtendido));
        this.generarDatosSimulados(); // Enriquecer con datos simulados
      },
      (error: Error) => {
        this.handleError(error, 'No se pudo cargar los almacenes');
      },
      () => {
        this.loading = false;
      }
    );
  }

  // ========== CRUD (Manteniendo funcionalidad original) ==========

  openNew(): void {
    if (!this.permissionService.canCreate('almacenes')) {
      this.showError('No tiene permisos para crear almacenes');
      return;
    }
    
    this.editMode = false;
    this.almacen = this.initAlmacen();
    this.submitted = false;
    this.almacenDialog = true;
  }

  editAlmacen(almacen: AlmacenExtendido): void {
    if (!this.permissionService.canEdit('almacenes')) {
      this.showError('No tiene permisos para editar almacenes');
      return;
    }
    
    this.editMode = true;
    this.almacen = { ...almacen };
    this.submitted = false;
    this.almacenDialog = true;
  }

  saveAlmacen(): void {
    this.submitted = true;
    
    if (!this.isValidAlmacen()) {
      return;
    }
    
    this.loading = true;

    if (this.editMode && this.almacen.id) {
      this.almacenService.updateAlmacenes(this.almacen.id, this.almacen)
        .pipe(finalize(() => this.loading = false))
        .subscribe({
          next: () => {
            this.showSuccess('Almacén actualizado correctamente');
            this.hideDialog();
            this.loadAlmacenes();
          },
          error: (error) => this.handleError(error, 'No se pudo actualizar el almacén')
        });
    } else {
      this.almacenService.createAlmacenes(this.almacen)
        .pipe(finalize(() => this.loading = false))
        .subscribe({
          next: () => {
            this.showSuccess('Almacén creado correctamente');
            this.hideDialog();
            this.loadAlmacenes();
          },
          error: (error) => this.handleError(error, 'No se pudo crear el almacén')
        });
    }
  }

  deleteAlmacen(almacen: AlmacenExtendido): void {
    if (!this.permissionService.canDelete('almacenes')) {
      this.showError('No tiene permisos para eliminar almacenes');
      return;
    }
    
    if (!almacen.id) return;
    
    this.confirmationService.confirm({
      message: `¿Está seguro que desea eliminar el almacén "${almacen.nombre}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.loading = true;
        this.almacenService.deleteAlmacenes(almacen.id!)
          .pipe(finalize(() => this.loading = false))
          .subscribe({
            next: () => {
              this.showSuccess('Almacén eliminado correctamente');
              this.loadAlmacenes();
              this.selectedAlmacenes = [];
            },
            error: (error) => this.handleError(error, 'No se pudo eliminar el almacén')
          });
      }
    });
  }

  deleteSelectedAlmacenes(): void {
    if (!this.permissionService.canDelete('almacenes')) {
      this.showError('No tiene permisos para eliminar almacenes');
      return;
    }

    if (!this.selectedAlmacenes.length) return;
    
    this.confirmationService.confirm({
      message: `¿Está seguro que desea eliminar los ${this.selectedAlmacenes.length} almacenes seleccionados?`,
      header: 'Confirmar eliminación múltiple',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.processMultipleDelete()
    });
  }

  // ========== VALIDACIONES (Manteniendo funcionalidad original) ==========

  private isValidAlmacen(): boolean {
    if (!this.almacen.nombre?.trim()) {
      this.showError('El nombre del almacén es obligatorio');
      return false;
    }

    if (!this.almacen.ubicacion?.trim()) {
      this.showError('La ubicación del almacén es obligatoria');
      return false;
    }

    if (this.almacen.nombre.length < 2) {
      this.showError('El nombre debe tener al menos 2 caracteres');
      return false;
    }

    if (this.almacen.ubicacion.length < 3) {
      this.showError('La ubicación debe tener al menos 3 caracteres');
      return false;
    }

    return true;
  }

  private async processMultipleDelete(): Promise<void> {
    this.loading = true;
    
    try {
      const deleteOperations = this.selectedAlmacenes
        .filter(almacen => almacen.id)
        .map(almacen => 
          this.almacenService.deleteAlmacenes(almacen.id!)
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
      this.loadAlmacenes();
      this.selectedAlmacenes = [];
    } catch (error) {
      this.handleError(error, 'No se pudieron eliminar algunos almacenes');
    } finally {
      this.loading = false;
    }
  }

  private showDeleteResults(successful: number, failed: number): void {
    if (successful > 0) {
      this.showSuccess(`${successful} almacenes eliminados correctamente`);
    }
    
    if (failed > 0) {
      this.showWarning(`${failed} almacenes no pudieron ser eliminados`);
    }
  }

  // ========== UTILIDADES (Manteniendo y expandiendo funcionalidad original) ==========

  hideDialog(): void {
    this.almacenDialog = false;
    this.submitted = false;
    this.almacen = this.initAlmacen();
  }

  onGlobalFilter(dt: { filterGlobal: (value: string, filterMatchMode: string) => void }, event: Event): void {
    const element = event.target as HTMLInputElement;
    dt.filterGlobal(element.value, 'contains');
  }

  // ========== EXPORTACIÓN (Manteniendo y expandiendo funcionalidad original) ==========

  exportarExcel(): void {
    if (!this.almacenes?.length) {
      this.showWarning('No hay datos para exportar');
      return;
    }

    import('xlsx').then(xlsx => {
      const dataToExport = this.almacenes.map(almacen => ({
        'ID': almacen.id || '',
        'Nombre': almacen.nombre || '',
        'Ubicación': almacen.ubicacion || '',
        'Tipo': almacen.tipoAlmacen || '',
        'Estado': almacen.estado || '',
        'Capacidad Máxima': almacen.capacidadMaxima || 0,
        'Capacidad Utilizada': almacen.capacidadUtilizada || 0,
        'Porcentaje Ocupación': almacen.porcentajeOcupacion ? `${almacen.porcentajeOcupacion.toFixed(1)}%` : '0%',
        'Responsable': almacen.responsable || '',
        'Teléfono': almacen.telefono || '',
        'Email': almacen.email || '',
        'Descripción': almacen.descripcion || '',
        'Fecha Creación': almacen.fechaCreacion ? new Date(almacen.fechaCreacion).toLocaleString() : 'N/A'
      }));
      
      const worksheet = xlsx.utils.json_to_sheet(dataToExport);
      const workbook = { Sheets: { 'Almacenes': worksheet }, SheetNames: ['Almacenes'] };
      const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
      this.guardarArchivo(excelBuffer, 'almacenes');
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

  /**
   * Inicializa el objeto ubicacionGeografica con valores por defecto si no existe
   */
  public initUbicacionGeografica(): void {
    if (!this.almacen) return;
    if (!this.almacen.ubicacionGeografica) {
      this.almacen.ubicacionGeografica = {
        latitud: 0,
        longitud: 0,
        direccion: '',
        ciudad: '',
        pais: 'Perú',
        codigoPostal: ''
      };
    }
  }

  /**
   * Inicializa el objeto temperatura con valores por defecto si no existe
   */
  public initTemperatura(): void {
    if (!this.almacen) return;
    if (!this.almacen.temperatura) {
      this.almacen.temperatura = {
        min: 18,
        max: 25,
        actual: 22
      };
    }
  }

  /**
   * Inicializa el objeto humedad con valores por defecto si no existe
   */
  public initHumedad(): void {
    if (!this.almacen.humedad) {
      this.almacen.humedad = {
        min: 40,
        max: 60,
        actual: 50
      };
    }
  }

  // Safe getters for temperature values
  getTemperaturaActual(): number {
    return this.almacen?.temperatura?.actual ?? 22;
  }

  getTemperaturaMin(): number {
    return this.almacen?.temperatura?.min ?? 18;
  }

  getTemperaturaMax(): number {
    return this.almacen?.temperatura?.max ?? 25;
  }

  // Safe setter for temperature actual
  setTemperaturaActual(value: number): void {
    if (!this.almacen) return;
    this.initTemperatura();
    if (this.almacen.temperatura) {
      this.almacen.temperatura.actual = value;
    }
  }

  setTemperaturaMin(value: number): void {
    if (!this.almacen) return;
    this.initTemperatura();
    if (this.almacen.temperatura) {
      this.almacen.temperatura.min = value;
    }
  }

  setTemperaturaMax(value: number): void {
    if (!this.almacen) return;
    this.initTemperatura();
    if (this.almacen.temperatura) {
      this.almacen.temperatura.max = value;
    }
  }

  // Safe getters for humidity values
  getHumedadActual(): number {
    return this.almacen.humedad?.actual ?? 50;
  }

  getHumedadMin(): number {
    return this.almacen.humedad?.min ?? 40;
  }

  getHumedadMax(): number {
    return this.almacen.humedad?.max ?? 60;
  }

  // Safe setter for humidity actual
  setHumedadActual(value: number): void {
    this.initHumedad();
    if (this.almacen.humedad) {
      this.almacen.humedad.actual = value;
    }
  }

  // Safe getters for ubicacionGeografica
  getDireccion(): string {
    return this.almacen?.ubicacionGeografica?.direccion ?? '';
  }

  setDireccion(value: string): void {
    if (!this.almacen) return;
    this.initUbicacionGeografica();
    if (this.almacen.ubicacionGeografica) {
      this.almacen.ubicacionGeografica.direccion = value;
    }
  }

  getCiudad(): string {
    return this.almacen?.ubicacionGeografica?.ciudad ?? '';
  }

  setCiudad(value: string): void {
    if (!this.almacen) return;
    this.initUbicacionGeografica();
    if (this.almacen.ubicacionGeografica) {
      this.almacen.ubicacionGeografica.ciudad = value;
    }
  }

  private initAlmacen(): AlmacenExtendido {
    const almacen: AlmacenExtendido = {
      id: undefined,
      nombre: '',
      ubicacion: '',
      descripcion: '',
      fechaCreacion: undefined,
      fechaActualizacion: undefined,
      capacidadMaxima: 1000,
      capacidadUtilizada: 0,
      porcentajeOcupacion: 0,
      estado: 'ACTIVO',
      tipoAlmacen: 'SUCURSAL',
      responsable: '',
      telefono: '',
      email: '',
      horarioOperacion: '8:00 - 18:00',
      ubicacionGeografica: {
        latitud: 0,
        longitud: 0,
        direccion: '',
        ciudad: '',
        pais: 'Perú',
        codigoPostal: ''
      },
      zonas: [],
      temperatura: { min: 18, max: 25, actual: 22 },
      humedad: { min: 40, max: 60, actual: 50 },
      fechaUltimaInspeccion: undefined,
      proximaInspeccion: undefined,
      certificaciones: []
    };

    // Ensure all nested objects are properly initialized
    this.almacen = almacen;
    this.initUbicacionGeografica();
    this.initTemperatura();
    this.initHumedad();
    
    return this.almacen;
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
      detail: (error as { error?: { message?: string } })?.error?.message || defaultMessage,
      life: 5000
    });
  }

  // 👇 Agregar estas propiedades al componente:

// Estados adicionales para modales
zonaSeleccionada: ZonaAlmacen | null = null;
tipoVistaMapa: 'satellite' | 'roadmap' | 'terrain' = 'roadmap';
filtroEstadoMapa: string | null = null;
filtroTipoMapa: string | null = null;
mostrarRutas = false;
mostrarRadioCobertura = false;

// Filtros de almacenes
filtrosAlmacenes: FiltrosAlmacenes = {
  nombre: '',
  ubicacion: '',
  estado: null,
  tipoAlmacen: null,
  capacidadMin: null,
  capacidadMax: null,
  ocupacionMin: null,
  ocupacionMax: null,
  responsable: '',
  ciudad: ''
};

// 👇 Agregar estos métodos:

/**
 * Obtiene color del tipo de zona
 */
getTipoZonaColor(tipo: string): string {
  const colorMap: Record<string, string> = {
    'RECEPCION': '#3b82f6',
    'ALMACENAMIENTO': '#10b981',
    'PICKING': '#f59e0b',
    'DESPACHO': '#ef4444',
    'DEVOLUCION': '#8b5cf6'
  };
  return colorMap[tipo] || '#6b7280';
}

/**
 * Obtiene icono del tipo de zona
 */
getTipoZonaIcon(tipo: string): string {
  const iconMap: Record<string, string> = {
    'RECEPCION': 'pi pi-sign-in',
    'ALMACENAMIENTO': 'pi pi-database',
    'PICKING': 'pi pi-shopping-cart',
    'DESPACHO': 'pi pi-send',
    'DEVOLUCION': 'pi pi-replay'
  };
  return iconMap[tipo] || 'pi pi-circle';
}

/**
 * Obtiene label del tipo de zona
 */
getTipoZonaLabel(tipo: string): string {
  const labelMap: Record<string, string> = {
    'RECEPCION': 'Recepción',
    'ALMACENAMIENTO': 'Almacenamiento',
    'PICKING': 'Picking',
    'DESPACHO': 'Despacho',
    'DEVOLUCION': 'Devolución'
  };
  return labelMap[tipo] || tipo;
}

  /**
   * Calcula el valor para el knob de disponibilidad
   */
  getKnobValue(): number {
    if (!this.almacenes || this.almacenes.length === 0) return 0;
    const activos = this.almacenes.filter(a => a.estado === 'ACTIVO').length;
    return Math.round((activos / this.almacenes.length) * 100);
  }

  // 👇 Obtiene el valor para el knob de rendimiento
  getPerformanceValue(): number {
    // Este es un valor de ejemplo - ajustar según sea necesario
    return 88;
  }

  // 👇 Obtiene el número de zonas por tipo (duplicate removed)
  // getZonasPorTipo(tipo: string): number {
  //   if (!this.almacenes || !tipo) return 0;
  //   let total = 0;
  //   this.almacenes.forEach(almacen => {
  //     if (almacen.zonas && almacen.zonas.length > 0) {
  //       total += almacen.zonas.filter(zona => zona.tipo === tipo).length;
  //     }
  //   });
  //   return total;
  // }

  // 👇 Obtiene color del estado de zona
  getEstadoZonaColor(estado: string): string {
    const colorMap: Record<string, string> = {
      'ACTIVA': 'success',
      'MANTENIMIENTO': 'warning',
      'FUERA_SERVICIO': 'danger',
      'ACTIVO': 'success',
      'INACTIVO': 'danger'
    };
    return colorMap[estado] || 'secondary';
  }

  // 👇 Returns estadosAlmacen with an 'All' option (already defined as a getter)
  // estadosAlmacenConTodos(): any[] {
  //   return [
  //     { label: 'Todos', value: null },
  //     ...this.estadosAlmacen
  //   ];
  // }

  // 👇 Returns tiposAlmacen with an 'All' option (already defined as a getter)
  // tiposAlmacenConTodos(): any[] {
  //   return [
  //     { label: 'Todos', value: null },
  //     ...this.tiposAlmacen
  //   ];
  // }

  // 👇 Obtiene zonas por tipo
  getZonasPorTipo(tipo: string): number {
    if (!this.almacenes || !tipo) return 0;
    return this.almacenes.reduce((total, almacen) => {
      if (!almacen.zonas) return total;
      return total + almacen.zonas.filter(z => z.tipo === tipo).length;
    }, 0);
  }

  // 👇 Obtiene el número de almacenes activos
  getAlmacenesActivosCount(): number {
    if (!this.almacenes) return 0;
    return this.almacenes.filter(a => a.estado === 'ACTIVO').length;
  }

  // 👇 Obtiene el número de almacenes en mantenimiento
  getAlmacenesMantenimientoCount(): number {
    if (!this.almacenes) return 0;
    return this.almacenes.filter(a => a.estado === 'MANTENIMIENTO').length;
  }

  // 👇 Obtiene la capacidad total de todos los almacenes
  getCapacidadTotal(): number {
    if (!this.almacenes) return 0;
    return this.almacenes.reduce((total, almacen) => total + (almacen.capacidadMaxima || 0), 0);
  }

  // 👇 Calcula las estadísticas de los almacenes
  // calcularEstadisticas() {
  //   const totalAlmacenes = this.almacenes?.length || 0;
  //   const almacenesActivos = this.almacenes?.filter(a => a.estado === 'ACTIVO').length || 0;
  //   const capacidadTotal = this.getCapacidadTotal();
    
  //   // Calcular el total de zonas
  //   let zonasTotal = 0;
  //   if (this.almacenes) {
  //     this.almacenes.forEach(almacen => {
  //       if (almacen.zonas) {
  //         zonasTotal += almacen.zonas.length;
  //       }
  //     });
  //   }
    
  //   return {
  //     totalAlmacenes,
  //     almacenesActivos,
  //     capacidadTotal,
  //     zonasTotal
  //   };
  // }

/**
 * Selecciona una zona en el editor
 */
seleccionarZona(zona: ZonaAlmacen): void {
  this.zonaSeleccionada = { ...zona };
}

/**
 * Crea una nueva zona
 */
crearNuevaZona(): void {
  const nuevaZona: ZonaAlmacen = {
    id: Date.now(), // Temporal
    codigo: `ZONA-${(this.almacen.zonas?.length || 0) + 1}`,
    nombre: 'Nueva Zona',
    descripcion: 'Descripción de la zona',
    capacidad: 100,
    ocupacion: 0,
    tipo: 'ALMACENAMIENTO',
    estado: 'ACTIVA',
    coordenadas: { x: 50, y: 50, width: 100, height: 60 }
  };
  
  if (!this.almacen.zonas) {
    this.almacen.zonas = [];
  }
  
  this.almacen.zonas.push(nuevaZona);
  this.seleccionarZona(nuevaZona);
  this.showSuccess('Nueva zona agregada');
}

/**
 * Edita una zona existente
 */
editarZona(zona: ZonaAlmacen): void {
  this.seleccionarZona(zona);
}

/**
 * Elimina una zona
 */
eliminarZona(zona: ZonaAlmacen): void {
  this.confirmationService.confirm({
    message: `¿Está seguro que desea eliminar la zona "${zona.nombre}"?`,
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    accept: () => {
      if (this.almacen.zonas) {
        this.almacen.zonas = this.almacen.zonas.filter(z => z.id !== zona.id);
        this.zonaSeleccionada = null;
        this.showSuccess('Zona eliminada correctamente');
      }
    }
  });
}

/**
 * Guarda cambios de la zona seleccionada
 */
guardarZona(): void {
  if (!this.zonaSeleccionada || !this.almacen.zonas) return;
  
  const index = this.almacen.zonas.findIndex(z => z.id === this.zonaSeleccionada!.id);
  if (index !== -1) {
    this.almacen.zonas[index] = { ...this.zonaSeleccionada };
    this.showSuccess('Zona actualizada correctamente');
  }
}

/**
 * Cancela edición de zona
 */
cancelarEdicionZona(): void {
  this.zonaSeleccionada = null;
}

/**
 * Genera layout automático de zonas
 */
generarLayoutAutomatico(): void {
  if (!this.almacen.zonas?.length) {
    this.showWarning('No hay zonas para organizar');
    return;
  }
  
  // Algoritmo básico de distribución automática
  const cols = Math.ceil(Math.sqrt(this.almacen.zonas.length));
  const cellWidth = 120;
  const cellHeight = 80;
  const margin = 20;
  
  this.almacen.zonas.forEach((zona, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    if (!zona.coordenadas) zona.coordenadas = { x: 0, y: 0, width: 100, height: 60 };
    
    zona.coordenadas.x = margin + col * (cellWidth + margin);
    zona.coordenadas.y = margin + row * (cellHeight + margin);
    zona.coordenadas.width = cellWidth;
    zona.coordenadas.height = cellHeight;
  });
  
  this.showSuccess('Layout generado automáticamente');
}

/**
 * Guarda layout de zonas
 */
guardarLayoutZonas(): void {
  // Aquí guardarías en el backend
  this.showSuccess('Layout de zonas guardado');
}

/**
 * Aplica cambios de zonas
 */
aplicarCambiosZonas(): void {
  // Aquí aplicarías los cambios
  this.showSuccess('Cambios aplicados correctamente');
  this.hideZonasDialog();
}

  /**
   * Inicia el proceso de redimensionamiento de una zona
   * @param event Evento del teclado o ratón
   * @param zona Zona que se va a redimensionar
   */
  iniciarRedimension(event: Event, zona: ZonaAlmacen): void {
    // Prevenir el comportamiento por defecto del evento
    event.preventDefault();
    event.stopPropagation();

    // Si es un evento de teclado, solo procesar Enter o Espacio
    if (event instanceof KeyboardEvent && event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    // Establecer la zona seleccionada si no lo está
    if (this.zonaSeleccionada?.id !== zona.id) {
      this.zonaSeleccionada = zona;
    }

    // Mostrar mensaje al usuario
    this.messageService.add({
      severity: 'info',
      summary: 'Redimensionar Zona',
      detail: 'Mantén presionado y arrastra para redimensionar la zona',
      life: 3000
    });

    // Aquí iría la lógica para iniciar el arrastre del controlador de redimensionamiento
    // Esto es un marcador de posición para la implementación real
    console.log('Iniciando redimensión de la zona:', zona.nombre);
  }

/**
 * Métodos para el mapa
 */
zoomIn(): void {
  console.log('Zoom in');
}

zoomOut(): void {
  console.log('Zoom out');
}

centrarMapa(): void {
  console.log('Centrar mapa');
}

mostrarTodosAlmacenes(): void {
  console.log('Mostrar todos los almacenes');
}

centrarEnAlmacen(almacen: AlmacenExtendido): void {
  console.log('Centrar en almacén:', almacen.nombre);
}

exportarMapa(): void {
  this.showSuccess('Funcionalidad de exportación de mapa');
}

configurarGPS(): void {
  this.showSuccess('Configuración de GPS');
}

/**
 * Métodos para filtros
 */
getTotalFiltrosActivosAlmacenes(): number {
  let total = 0;
  if (this.filtrosAlmacenes.nombre.trim()) total++;
  if (this.filtrosAlmacenes.ubicacion.trim()) total++;
  if (this.filtrosAlmacenes.estado) total++;
  if (this.filtrosAlmacenes.tipoAlmacen) total++;
  if (this.filtrosAlmacenes.capacidadMin !== null) total++;
  if (this.filtrosAlmacenes.capacidadMax !== null) total++;
  if (this.filtrosAlmacenes.ocupacionMin !== null) total++;
  if (this.filtrosAlmacenes.ocupacionMax !== null) total++;
  if (this.filtrosAlmacenes.responsable.trim()) total++;
  if (this.filtrosAlmacenes.ciudad.trim()) total++;
  return total;
}

/**
 * Aplica filtro rápido
 */
aplicarFiltroRapidoAlmacenes(tipo: string): void {
  this.limpiarFiltrosAlmacenes();
  
  switch (tipo) {
    case 'alta-capacidad':
      this.filtrosAlmacenes.capacidadMin = 5000;
      break;
    case 'baja-ocupacion':
      this.filtrosAlmacenes.ocupacionMax = 50;
      break;
    case 'solo-activos':
      this.filtrosAlmacenes.estado = 'ACTIVO';
      break;
    case 'mantenimiento':
      this.filtrosAlmacenes.estado = 'MANTENIMIENTO';
      break;
  }
  
  this.showSuccess(`Filtro rápido "${tipo}" aplicado`);
}

/**
 * Limpia filtros de almacenes
 */
limpiarFiltrosAlmacenes(): void {
  this.filtrosAlmacenes = {
    nombre: '',
    ubicacion: '',
    estado: null,
    tipoAlmacen: null,
    capacidadMin: null,
    capacidadMax: null,
    ocupacionMin: null,
    ocupacionMax: null,
    responsable: '',
    ciudad: ''
  };
}

/**
 * Aplica filtros de almacenes
 */
aplicarFiltrosAlmacenes(): void {
  // Implementar lógica de filtros
  this.showSuccess('Filtros aplicados correctamente');
}

/**
 * Obtiene label del estado
 */
getEstadoLabel(estado: string): string {
  const labelMap: Record<string, string> = {
    'ACTIVO': 'Activo',
    'INACTIVO': 'Inactivo',
    'MANTENIMIENTO': 'Mantenimiento'
  };
  return labelMap[estado] || estado;
}

/**
 * Obtiene label del tipo de almacén
 */
getTipoAlmacenLabel(tipo: string): string {
  const labelMap: Record<string, string> = {
    'PRINCIPAL': 'Principal',
    'SUCURSAL': 'Sucursal',
    'TEMPORAL': 'Temporal',
    'DEPOSITO': 'Depósito'
  };
  return labelMap[tipo] || tipo;
}

/**
 * Exporta estadísticas
 */
exportarEstadisticas(): void {
  this.showSuccess('Exportando estadísticas...');
}

}
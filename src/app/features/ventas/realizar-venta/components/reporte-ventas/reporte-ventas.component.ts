// ✅ IMPORTS DE ANGULAR CORE
import { Component, OnInit, OnDestroy, ViewChild, inject, ElementRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil, interval } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// ✅ IMPORTS DE PRIMENG UI
import { MessageService, ConfirmationService } from 'primeng/api';
import { MenuItem } from 'primeng/api';
import { TableLazyLoadEvent } from 'primeng/table';

// ✅ IMPORTS DE PRIMENG COMPONENTS
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule, ButtonSeverity } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { CalendarModule } from 'primeng/calendar';
import { SliderModule } from 'primeng/slider';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { PanelModule } from 'primeng/panel';
import { AccordionModule } from 'primeng/accordion';
import { TabViewModule } from 'primeng/tabview';
import { SplitterModule } from 'primeng/splitter';
import { ChartModule } from 'primeng/chart';
import { ProgressBarModule } from 'primeng/progressbar';
import { ChipModule } from 'primeng/chip';
import { BadgeModule } from 'primeng/badge';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SpeedDialModule } from 'primeng/speeddial';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { MenuModule } from 'primeng/menu';

// ✅ IMPORTS DE SERVICIOS
import { ClienteService } from '../../../../../core/services/clientes.service';
import { VentasService } from '../../../../../core/services/ventas.service';
import { ExportacionAnalyticsService, DatosDashboard } from '../../../../../shared/services/exportacion-analytics.service';
import { PrediccionVentasService } from '../../../../../core/services/prediccion-ventas.service';
import { VentaResponse } from '../../../../../core/models/venta.model';
import { 
  DatoVenta, 
  ConfiguracionPrediccion, 
  PrediccionVentas 
} from '../../../../../core/models/prediccion-ventas.model';

// ✅ IMPORTS PARA GENERACIÓN DE REPORTES
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';

// ✅ INTERFACES EMPRESARIALES
interface KPIData {
  ventasTotales: number;
  numeroTransacciones: number;
  clientesUnicos: number;
  ticketPromedio: number;
  crecimientoVentas: number;
  crecimientoTransacciones: number;
  crecimientoClientes: number;
  crecimientoTicket: number;
  metaMensual: number;
}

interface TopProducto {
  id: number;
  nombre: string;
  categoria: string;
  totalVentas: number;
  cantidadVendida: number;
  porcentaje: number;
}

interface TopVendedor {
  id: number;
  nombre: string;
  iniciales: string;
  sucursal: string;
  totalVentas: number;
  comision: number;
  porcentajeMeta: number;
  numeroVentas: number;
}

interface TopCliente {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  segmento: 'premium' | 'frecuente' | 'ocasional';
  totalCompras: number;
  numeroCompras: number;
  ultimaCompra: Date;
  fechaRegistro: Date;
}

interface TipoReporte {
  tipo: string;
  titulo: string;
  descripcion: string;
  formato: string;
  icono: string;
  iconoAccion: string;
  clase: string;
  severidad: ButtonSeverity;
  generando: boolean;
  progreso: number;
}

interface HistorialReporte {
  id: number;
  fecha: Date;
  tipo: string;
  estado: 'COMPLETADO' | 'GENERANDO' | 'ERROR' | 'CANCELADO';
  archivo: string;
  tamaño: number;
  icon: string;
}

interface PrediccionIA {
  proximaSemana: number;
  proximoMes: number;
  confianza: number;
  tendencia: 'ascendente' | 'descendente' | 'estable';
}

interface CompraCliente {
  fecha: Date;
  producto: string;
  cantidad: number;
  total: number;
  vendedor: string;
}

interface Sucursal {
  id: number;
  nombre: string;
}

interface Vendedor {
  id: number;
  nombre: string;
}

interface Categoria {
  id: number;
  nombre: string;
}

interface Periodo {
  label: string;
  value: string;
}

interface TipoGrafico {
  label: string;
  value: string;
}

interface AlgoritmoIA {
  label: string;
  value: string;
}

interface VentanaTiempo {
  label: string;
  value: string;
}

interface VariablePredictiva {
  label: string;
  value: string;
}

interface MetodoPago {
  nombre: string;
  porcentaje: number;
  color: string;
}

// ✅ INTERFACES PARA GRÁFICOS
interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

interface ChartDataset {
  label?: string;
  data: number[];
  fill?: boolean;
  borderColor?: string;
  backgroundColor?: string | string[];
  tension?: number;
  borderWidth?: number;
  borderDash?: number[];
  hoverBackgroundColor?: string[];
}

interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins?: {
    legend?: {
      position?: string;
      display?: boolean;
    };
    title?: {
      display: boolean;
      text: string;
    };
  };
  scales?: {
    y?: {
      beginAtZero: boolean;
      ticks?: {
        callback?: (value: number) => string;
      };
    };
  };
}

// ✅ CONFIGURACIÓN DEL COMPONENTE
@Component({
  selector: 'app-reporte-ventas',
  standalone: true, // Si usas standalone components
  imports: [
    // Angular Common
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    
    // PrimeNG Modules
    TableModule,
    CardModule,
    ButtonModule,
    DropdownModule,
    MultiSelectModule,
    CalendarModule,
    SliderModule,
    InputNumberModule,
    InputTextModule,
    PanelModule,
    AccordionModule,
    TabViewModule,
    SplitterModule,
    ChartModule,
    ProgressBarModule,
    ChipModule,
    BadgeModule,
    TagModule,
    AvatarModule,
    TooltipModule,
    SelectButtonModule,
    SpeedDialModule,
    DialogModule,
    ConfirmDialogModule,
    ToastModule,
    MenuModule
  ],
  templateUrl: './reporte-ventas.component.html',
  styleUrls: ['./reporte-ventas.component.scss']
})
export class ReportesComponent implements OnInit, OnDestroy {

  // ✅ VIEW CHILD REFERENCES
  @ViewChild('tablaUsuarios') tablaUsuarios!: ElementRef;
  @ViewChild('graficoVentas') graficoVentas!: ElementRef;

  // ✅ DATOS DEL SISTEMA
  currentUser = 'Emerson147';
  currentDateTime = '2025-06-06 04:07:19';
  tabActivo: 0 | 1 | 2 | 3 | 4 = 0;
  
  // ✅ ESTADOS DE UI
  accordionStates: Record<string, boolean> = {
    tiempo: true,
    datos: true,
    avanzados: false
  };
  
  // ✅ TABS DE NAVEGACIÓN
  tabs = [
    { header: 'Dashboard Ejecutivo' },
    { header: 'Top Performance' },
    { header: 'Análisis de Clientes' },
    { header: 'Generar Reportes' },
    { header: 'IA y Predicciones' }
  ];

  // ✅ ESTADOS DE CARGA
  aplicandoFiltros = false;
  cargandoHistorial = false;
  entrenandoModelo = false;
  generandoPrediccion = false;

  // ✅ FILTROS Y CONFIGURACIÓN
  periodoSeleccionado = 'mes_actual';
  rangoFechas: Date[] = [];
  sucursalesSeleccionadas: number[] = [];
  vendedoresSeleccionados: number[] = [];
  categoriasSeleccionadas: number[] = [];
  rangoMontos: number[] = [0, 50000];
  minimoTransacciones = 1;

  // ✅ DATOS PARA DROPDOWNS
  periodos: Periodo[] = [
    { label: 'Hoy', value: 'hoy' },
    { label: 'Ayer', value: 'ayer' },
    { label: 'Esta Semana', value: 'semana_actual' },
    { label: 'Semana Pasada', value: 'semana_anterior' },
    { label: 'Este Mes', value: 'mes_actual' },
    { label: 'Mes Pasado', value: 'mes_anterior' },
    { label: 'Este Año', value: 'año_actual' },
    { label: 'Personalizado', value: 'personalizado' }
  ];

  sucursales: Sucursal[] = [
    { id: 1, nombre: 'Sucursal Principal - Lima Centro' },
    { id: 2, nombre: 'Sucursal Norte - Los Olivos' },
    { id: 3, nombre: 'Sucursal Sur - Villa El Salvador' },
    { id: 4, nombre: 'Sucursal Este - San Juan de Lurigancho' }
  ];

  vendedores: Vendedor[] = [
    { id: 1, nombre: 'María García López' },
    { id: 2, nombre: 'Carlos Roberto Silva' },
    { id: 3, nombre: 'Ana Sofía Mendoza' },
    { id: 4, nombre: 'Luis Fernando Torres' },
    { id: 5, nombre: 'Patricia Yolanda Cruz' },
    { id: 6, nombre: 'Roberto Carlos Díaz' }
  ];

  categorias: Categoria[] = [
    { id: 1, nombre: 'Electrónicos' },
    { id: 2, nombre: 'Ropa y Accesorios' },
    { id: 3, nombre: 'Hogar y Decoración' },
    { id: 4, nombre: 'Deportes y Fitness' },
    { id: 5, nombre: 'Libros y Educación' },
    { id: 6, nombre: 'Salud y Belleza' }
  ];

  // ✅ KPIs PRINCIPALES
  kpis: KPIData = {
    ventasTotales: 458750,
    numeroTransacciones: 2847,
    clientesUnicos: 1456,
    ticketPromedio: 161.2,
    crecimientoVentas: 12.5,
    crecimientoTransacciones: 8.3,
    crecimientoClientes: 15.7,
    crecimientoTicket: 4.2,
    metaMensual: 500000
  };

  progresoMeta = 91.75;

  // ✅ GRÁFICOS DE VENTAS - CON TIPOS ESPECÍFICOS
  tipoGraficoVentas = 'line';
  tiposGrafico: TipoGrafico[] = [
    { label: 'Línea', value: 'line' },
    { label: 'Barras', value: 'bar' },
    { label: 'Área', value: 'area' }
  ];

  datosGraficoVentas: ChartData = {
    labels: [],
    datasets: []
  };
  opcionesGraficoVentas: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false
  };
  datosGraficoMetodosPago: ChartData = {
    labels: [],
    datasets: []
  };
  resumenMetodosPago: MetodoPago[] = [];
  opcionesGraficoCircular: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false
  };

  // ✅ TOP DATA
  topProductos: TopProducto[] = [];
  topVendedores: TopVendedor[] = [];
  topClientes: TopCliente[] = [];

  // ✅ GRÁFICOS ADICIONALES - CON TIPOS ESPECÍFICOS
  datosGraficoVendedores: ChartData = {
    labels: [],
    datasets: []
  };
  opcionesGraficoBarras: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false
  };
  datosSegmentosClientes: ChartData = {
    labels: [],
    datasets: []
  };
  datosFrecuenciaCompras: ChartData = {
    labels: [],
    datasets: []
  };

  // ✅ TIPOS DE REPORTES
  tiposReportes: TipoReporte[] = [];
  historialReportes: HistorialReporte[] = [];

  // ✅ INTELIGENCIA ARTIFICIAL
  algoritmoIA = 'promedio-movil';
  ventanaTiempo = 30;
  variablesPredictivas: string[] = ['ventas', 'transacciones', 'tendencia'];

  algoritmosIA: AlgoritmoIA[] = [
    { label: 'Promedio Móvil', value: 'promedio-movil' },
    { label: 'Regresión Lineal', value: 'regresion-lineal' },
    { label: 'Análisis Estacional', value: 'estacional' },
    { label: 'Suavizado Exponencial', value: 'exponencial' }
  ];

  ventanasTiempo: VentanaTiempo[] = [
    { label: '7 días', value: '7' },
    { label: '14 días', value: '14' },
    { label: '30 días', value: '30' },
    { label: '60 días', value: '60' },
    { label: '90 días', value: '90' }
  ];

  variablesDisponibles: VariablePredictiva[] = [
    { label: 'Ventas Históricas', value: 'ventas' },
    { label: 'Número de Clientes', value: 'clientes' },
    { label: 'Estacionalidad', value: 'estacionalidad' },
    { label: 'Inventario', value: 'inventario' },
    { label: 'Marketing', value: 'marketing' },
    { label: 'Competencia', value: 'competencia' }
  ];

  predicciones: PrediccionIA = {
    proximaSemana: 8.5,
    proximoMes: 12.3,
    confianza: 87.4,
    tendencia: 'ascendente'
  };

  datosPredicciones: ChartData = {
    labels: [],
    datasets: []
  };
  opcionesGraficoPredicciones: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false
  };

  // ✅ MENÚ FLOTANTE Y EXPORTACIÓN
  menuFlotante: MenuItem[] = [];
  opcionesExportacion: MenuItem[] = [];

  // ✅ ESTADOS DE DIÁLOGOS
  mostrarDetalles = false;
  tituloDetalle = '';
  tipoDetalle = '';
  clienteSeleccionado: TopCliente | null = null;
  historialComprasCliente: CompraCliente[] = [];
  
  // ✅ DATOS ACTUALES PARA REPORTES
  ventasActualesPeriodo: VentaResponse[] = [];

  // ✅ SUBJECT PARA DESTRUCCIÓN
  private destroy$ = new Subject<void>();

  // ✅ CONSTRUCTOR CON SERVICIOS
  private messageService: MessageService = inject(MessageService);
  private confirmationService: ConfirmationService = inject(ConfirmationService);
  private clientesService: ClienteService = inject(ClienteService);
  private ventasService: VentasService = inject(VentasService);
  private exportacionService: ExportacionAnalyticsService = inject(ExportacionAnalyticsService);
  private prediccionService: PrediccionVentasService = inject(PrediccionVentasService);

  constructor() {
    console.log('🚀 Construyendo ReportesEmpresarialComponent...');
    console.log('👤 Usuario actual:', this.currentUser);
    console.log('📅 Fecha/Hora UTC:', this.currentDateTime);
  }

  ngOnInit(): void {
    console.log('📊 Inicializando Dashboard de Reportes Empresariales...');
    console.log('👤 Usuario actual:', this.currentUser);
    console.log('📅 Fecha actual (UTC):', this.currentDateTime);
    
    this.inicializarComponente();
    this.configurarReloj();
    this.cargarDatosIniciales();
    this.inicializarFiltros();
    this.inicializarGraficos();
    this.inicializarMenuFlotante();
    this.inicializarOpcionesExportacion();
  }

  ngOnDestroy(): void {
    console.log('🔄 Destruyendo componente...');
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ✅ MÉTODOS DE INICIALIZACIÓNget
  private inicializarComponente(): void {
    this.currentUser = 'Emerson147';
    this.tabActivo = 0;
    this.calcularProgresoMeta();
    this.inicializarTiposReportes();
    this.inicializarHistorialReportes();
  }

  private inicializarTiposReportes(): void {
    this.tiposReportes = [
      {
        tipo: 'excel',
        titulo: 'Excel Detallado',
        descripcion: 'Reporte completo con todos los datos en formato Excel',
        formato: 'XLSX',
        icono: 'pi pi-file-excel',
        iconoAccion: 'pi pi-download',
        clase: 'excel-card',
        severidad: 'success',
        generando: false,
        progreso: 0
      },
      {
        tipo: 'pdf',
        titulo: 'PDF Ejecutivo',
        descripcion: 'Resumen ejecutivo con gráficos y métricas principales',
        formato: 'PDF',
        icono: 'pi pi-file-pdf',
        iconoAccion: 'pi pi-download',
        clase: 'pdf-card',
        severidad: 'danger',
        generando: false,
        progreso: 0
      },
      {
        tipo: 'powerpoint',
        titulo: 'PowerPoint',
        descripcion: 'Presentación para directorio con slides interactivos',
        formato: 'PPTX',
        icono: 'pi pi-file',
        iconoAccion: 'pi pi-download',
        clase: 'ppt-card',
        severidad: 'danger',
        generando: false,
        progreso: 0
      },
      {
        tipo: 'csv',
        titulo: 'CSV Datos',
        descripcion: 'Datos en bruto para análisis avanzado',
        formato: 'CSV',
        icono: 'pi pi-database',
        iconoAccion: 'pi pi-download',
        clase: 'csv-card',
        severidad: 'info',
        generando: false,
        progreso: 0
      }
    ];
  }

  private inicializarHistorialReportes(): void {
    this.historialReportes = [
      {
        id: 1,
        fecha: new Date('2025-06-05 14:30:00'),
        tipo: 'Excel Detallado',
        estado: 'COMPLETADO',
        archivo: 'reporte_ventas_202506051430.xlsx',
        tamaño: 2.4,
        icon: 'pi pi-file-excel'
      },
      {
        id: 2,
        fecha: new Date('2025-06-05 10:15:00'),
        tipo: 'PDF Ejecutivo',
        estado: 'COMPLETADO',
        archivo: 'resumen_ejecutivo_202506051015.pdf',
        tamaño: 1.8,
        icon: 'pi pi-file-pdf'
      },
      {
        id: 3,
        fecha: new Date('2025-06-04 16:45:00'),
        tipo: 'PowerPoint',
        estado: 'COMPLETADO',
        archivo: 'presentacion_directorio_202506041645.pptx',
        tamaño: 5.2,
        icon: 'pi pi-file'
      }
    ];
  }

  private inicializarMenuFlotante(): void {
    this.menuFlotante = [
      {
        tooltipOptions: { tooltipLabel: 'Exportar Dashboard' },
        icon: 'pi pi-download',
        command: () => this.exportarDashboard()
      },
      {
        tooltipOptions: { tooltipLabel: 'Actualizar Datos' },
        icon: 'pi pi-refresh',
        command: () => this.actualizarDatos()
      },
      {
        tooltipOptions: { tooltipLabel: 'Configuración' },
        icon: 'pi pi-cog',
        command: () => this.abrirConfiguracion()
      },
      {
        tooltipOptions: { tooltipLabel: 'Ayuda' },
        icon: 'pi pi-question-circle',
        command: () => this.mostrarAyuda()
      }
    ];
  }

  /**
   * Inicializa el menú de opciones de exportación avanzadas
   */
  private inicializarOpcionesExportacion(): void {
    this.opcionesExportacion = [
      {
        label: 'Reporte Ejecutivo Completo',
        icon: 'pi pi-file-pdf',
        command: () => this.exportarDashboard(),
        tooltip: 'Dashboard completo con KPIs, gráficos y análisis'
      },
      {
        separator: true
      },
      {
        label: 'Reporte Financiero',
        icon: 'pi pi-dollar',
        command: () => this.exportarReporteFinanciero(),
        tooltip: 'Enfoque en métricas financieras y rentabilidad'
      },
      {
        label: 'Reporte de Tendencias',
        icon: 'pi pi-chart-line',
        command: () => this.exportarReporteTendencias(),
        tooltip: 'Análisis de tendencias y proyecciones'
      },
      {
        label: 'Reporte Comparativo',
        icon: 'pi pi-chart-bar',
        command: () => this.exportarReporteComparativo(),
        tooltip: 'Comparación entre períodos'
      },
      {
        separator: true
      },
      {
        label: 'Resumen Semanal',
        icon: 'pi pi-calendar',
        command: () => this.exportarResumenSemanal(),
        tooltip: 'Resumen compacto de la semana'
      },
      {
        label: 'Resumen Mensual',
        icon: 'pi pi-calendar',
        command: () => this.exportarResumenMensual(),
        tooltip: 'Resumen detallado del mes'
      }
    ];
  }

  private configurarReloj(): void {
    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentDateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
      });
  }

  private cargarDatosIniciales(): void {
    console.log('📊 Cargando datos empresariales REALES desde el backend...');
    
    // Calcular fechas para el período seleccionado
    const { fechaInicio, fechaFin } = this.calcularRangoFechas();
    
    // Cargar datos reales del backend
    this.cargarDatosReales(fechaInicio, fechaFin);
  }
  
  /**
   * Calcula el rango de fechas según el período seleccionado
   */
  private calcularRangoFechas(): { fechaInicio: string; fechaFin: string } {
    const hoy = new Date();
    let fechaInicio = new Date();
    let fechaFin = new Date(hoy);
    
    switch(this.periodoSeleccionado) {
      case 'hoy':
        fechaInicio = new Date(hoy);
        break;
      case 'ayer':
        fechaInicio = new Date(hoy);
        fechaInicio.setDate(hoy.getDate() - 1);
        fechaFin = new Date(fechaInicio);
        break;
      case 'semana_actual':
        fechaInicio = new Date(hoy);
        fechaInicio.setDate(hoy.getDate() - hoy.getDay()); // Domingo
        break;
      case 'semana_anterior':
        fechaInicio = new Date(hoy);
        fechaInicio.setDate(hoy.getDate() - hoy.getDay() - 7);
        fechaFin = new Date(fechaInicio);
        fechaFin.setDate(fechaInicio.getDate() + 6);
        break;
      case 'mes_actual':
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        break;
      case 'mes_anterior':
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
        fechaFin = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
        break;
      case 'año_actual':
        fechaInicio = new Date(hoy.getFullYear(), 0, 1);
        break;
      case 'personalizado':
        if (this.rangoFechas && this.rangoFechas.length === 2) {
          fechaInicio = this.rangoFechas[0];
          fechaFin = this.rangoFechas[1];
        }
        break;
    }
    
    return {
      fechaInicio: this.formatearFecha(fechaInicio),
      fechaFin: this.formatearFecha(fechaFin)
    };
  }
  
  /**
   * Formatea una fecha a string YYYY-MM-DD
   */
  private formatearFecha(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  /**
   * Carga todos los datos reales desde el backend
   */
  private cargarDatosReales(fechaInicio: string, fechaFin: string): void {
    this.cargandoHistorial = true;
    
    // Cargar ventas del período actual
    this.ventasService.obtenerVentasEntreFechas(fechaInicio, fechaFin)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ventas) => {
          console.log('✅ Ventas cargadas:', ventas.length);
          
          // Almacenar ventas para generación de reportes
          this.ventasActualesPeriodo = ventas;
          
          // Calcular KPIs desde ventas reales
          this.calcularKPIsDesdeVentas(ventas);
          
          // Calcular top productos, clientes, vendedores
          this.calcularTopDesdeVentas(ventas);
          
          // Cargar datos del período anterior para calcular crecimiento
          this.cargarPeriodoAnteriorParaComparacion(fechaInicio, fechaFin, ventas);
          
          // Actualizar gráficos con datos reales
          this.actualizarGraficosConDatosReales(ventas);
          
          this.cargandoHistorial = false;
        },
        error: (error) => {
          console.error('❌ Error cargando ventas:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar los datos de ventas',
            life: 5000
          });
          this.cargandoHistorial = false;
        }
      });
  }
  
  /**
   * Calcula los KPIs principales desde las ventas reales
   */
  private calcularKPIsDesdeVentas(ventas: VentaResponse[]): void {
    // Filtrar solo ventas completadas/pagadas
    const ventasValidas = ventas.filter(v => v.estado === 'COMPLETADA' || v.estado === 'PAGADA');
    
    // Calcular ventas totales
    const ventasTotales = ventasValidas.reduce((sum, v) => sum + v.total, 0);
    
    // Número de transacciones
    const numeroTransacciones = ventasValidas.length;
    
    // Clientes únicos
    const clientesUnicos = new Set(ventasValidas.map(v => v.cliente.id)).size;
    
    // Ticket promedio
    const ticketPromedio = numeroTransacciones > 0 ? ventasTotales / numeroTransacciones : 0;
    
    // Actualizar KPIs (el crecimiento se calculará después al comparar con período anterior)
    this.kpis = {
      ...this.kpis,
      ventasTotales: ventasTotales,
      numeroTransacciones: numeroTransacciones,
      clientesUnicos: clientesUnicos,
      ticketPromedio: ticketPromedio
    };
    
    // Calcular progreso de meta
    this.calcularProgresoMeta();
    
    console.log('📊 KPIs calculados:', this.kpis);
  }
  
  /**
   * Calcula top productos, clientes y vendedores desde ventas reales
   */
  private calcularTopDesdeVentas(ventas: VentaResponse[]): void {
    const ventasValidas = ventas.filter(v => v.estado === 'COMPLETADA' || v.estado === 'PAGADA');
    
    // === TOP PRODUCTOS ===
    const productosMap = new Map<number, { 
      id: number; 
      nombre: string; 
      categoria: string; 
      total: number; 
      cantidad: number; 
    }>();
    
    ventasValidas.forEach(venta => {
      venta.detalles.forEach(detalle => {
        const productoId = detalle.producto.id;
        const existing = productosMap.get(productoId);
        
        if (existing) {
          existing.total += detalle.subtotal;
          existing.cantidad += detalle.cantidad;
        } else {
          productosMap.set(productoId, {
            id: productoId,
            nombre: detalle.producto.nombre,
            categoria: detalle.producto.marca || 'Sin categoría',
            total: detalle.subtotal,
            cantidad: detalle.cantidad
          });
        }
      });
    });
    
    const totalVentas = ventasValidas.reduce((sum, v) => sum + v.total, 0);
    
    this.topProductos = Array.from(productosMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map(p => ({
        id: p.id,
        nombre: p.nombre,
        categoria: p.categoria,
        totalVentas: p.total,
        cantidadVendida: p.cantidad,
        porcentaje: totalVentas > 0 ? (p.total / totalVentas) * 100 : 0
      }));
    
    // === TOP CLIENTES ===
    const clientesMap = new Map<number, {
      id: number;
      nombres: string;
      apellidos: string;
      email: string;
      documento: string;
      totalCompras: number;
      numeroCompras: number;
      ultimaCompraFecha: string;
    }>();
    
    ventasValidas.forEach(venta => {
      const clienteId = venta.cliente.id;
      const existing = clientesMap.get(clienteId);
      
      if (existing) {
        existing.totalCompras += venta.total;
        existing.numeroCompras++;
        // Actualizar última compra si es más reciente
        if (venta.fechaCreacion > existing.ultimaCompraFecha) {
          existing.ultimaCompraFecha = venta.fechaCreacion;
        }
      } else {
        clientesMap.set(clienteId, {
          id: clienteId,
          nombres: venta.cliente.nombres,
          apellidos: venta.cliente.apellidos,
          email: 'cliente@example.com', // No disponible en VentaResponse
          documento: venta.cliente.documento,
          totalCompras: venta.total,
          numeroCompras: 1,
          ultimaCompraFecha: venta.fechaCreacion
        });
      }
    });
    
    this.topClientes = Array.from(clientesMap.values())
      .sort((a, b) => b.totalCompras - a.totalCompras)
      .slice(0, 10)
      .map(c => {
        const totalCompras = c.totalCompras;
        // Determinar segmento basado en el total de compras
        let segmento: 'premium' | 'frecuente' | 'ocasional' = 'ocasional';
        if (totalCompras > 10000) {
          segmento = 'premium';
        } else if (totalCompras > 3000 || c.numeroCompras > 5) {
          segmento = 'frecuente';
        }
        
        return {
          id: c.id,
          nombres: c.nombres,
          apellidos: c.apellidos,
          email: c.email,
          telefono: '-', // No disponible en VentaResponse
          segmento: segmento,
          totalCompras: c.totalCompras,
          numeroCompras: c.numeroCompras,
          ultimaCompra: new Date(c.ultimaCompraFecha),
          fechaRegistro: new Date() // No disponible, usar fecha actual como placeholder
        };
      });
    
    // === TOP VENDEDORES ===
    const vendedoresMap = new Map<number, {
      id: number;
      nombre: string;
      totalVentas: number;
      numeroVentas: number;
    }>();
    
    ventasValidas.forEach(venta => {
      const vendedorId = venta.usuario.id;
      const existing = vendedoresMap.get(vendedorId);
      
      if (existing) {
        existing.totalVentas += venta.total;
        existing.numeroVentas++;
      } else {
        vendedoresMap.set(vendedorId, {
          id: vendedorId,
          nombre: venta.usuario.nombre || venta.usuario.username,
          totalVentas: venta.total,
          numeroVentas: 1
        });
      }
    });
    
    this.topVendedores = Array.from(vendedoresMap.values())
      .sort((a, b) => b.totalVentas - a.totalVentas)
      .slice(0, 10)
      .map(v => ({
        id: v.id,
        nombre: v.nombre,
        iniciales: v.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
        sucursal: 'Principal', // Se podría mejorar si hay datos de sucursal
        totalVentas: v.totalVentas,
        comision: v.totalVentas * 0.05, // 5% de comisión
        porcentajeMeta: 100, // Se podría calcular si hay metas definidas
        numeroVentas: v.numeroVentas
      }));
    
    console.log('📊 Top Productos:', this.topProductos.length);
    console.log('📊 Top Clientes:', this.topClientes.length);
    console.log('📊 Top Vendedores:', this.topVendedores.length);
  }
  
  /**
   * Carga el período anterior para calcular crecimiento
   */
  private cargarPeriodoAnteriorParaComparacion(fechaInicio: string, fechaFin: string, ventasActuales: VentaResponse[]): void {
    // Calcular las fechas del período anterior
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diasDiferencia = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
    
    const fechaInicioAnterior = new Date(inicio);
    fechaInicioAnterior.setDate(inicio.getDate() - diasDiferencia - 1);
    
    const fechaFinAnterior = new Date(inicio);
    fechaFinAnterior.setDate(inicio.getDate() - 1);
    
    // Cargar ventas del período anterior
    this.ventasService.obtenerVentasEntreFechas(
      this.formatearFecha(fechaInicioAnterior),
      this.formatearFecha(fechaFinAnterior)
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ventasAnteriores) => {
          this.calcularCrecimiento(ventasActuales, ventasAnteriores);
        },
        error: (error) => {
          console.warn('⚠️ No se pudo cargar período anterior para comparación:', error);
          // Establecer crecimiento en 0 si no hay datos anteriores
          this.kpis = {
            ...this.kpis,
            crecimientoVentas: 0,
            crecimientoTransacciones: 0,
            crecimientoClientes: 0,
            crecimientoTicket: 0
          };
        }
      });
  }
  
  /**
   * Calcula el porcentaje de crecimiento comparando dos períodos
   */
  private calcularCrecimiento(ventasActuales: VentaResponse[], ventasAnteriores: VentaResponse[]): void {
    const actualesValidas = ventasActuales.filter(v => v.estado === 'COMPLETADA' || v.estado === 'PAGADA');
    const anterioresValidas = ventasAnteriores.filter(v => v.estado === 'COMPLETADA' || v.estado === 'PAGADA');
    
    // Ventas totales
    const totalActual = actualesValidas.reduce((sum, v) => sum + v.total, 0);
    const totalAnterior = anterioresValidas.reduce((sum, v) => sum + v.total, 0);
    const crecimientoVentas = totalAnterior > 0 ? ((totalActual - totalAnterior) / totalAnterior) * 100 : 0;
    
    // Transacciones
    const transaccionesActual = actualesValidas.length;
    const transaccionesAnterior = anterioresValidas.length;
    const crecimientoTransacciones = transaccionesAnterior > 0 
      ? ((transaccionesActual - transaccionesAnterior) / transaccionesAnterior) * 100 
      : 0;
    
    // Clientes únicos
    const clientesActual = new Set(actualesValidas.map(v => v.cliente.id)).size;
    const clientesAnterior = new Set(anterioresValidas.map(v => v.cliente.id)).size;
    const crecimientoClientes = clientesAnterior > 0 
      ? ((clientesActual - clientesAnterior) / clientesAnterior) * 100 
      : 0;
    
    // Ticket promedio
    const ticketActual = transaccionesActual > 0 ? totalActual / transaccionesActual : 0;
    const ticketAnterior = transaccionesAnterior > 0 ? totalAnterior / transaccionesAnterior : 0;
    const crecimientoTicket = ticketAnterior > 0 
      ? ((ticketActual - ticketAnterior) / ticketAnterior) * 100 
      : 0;
    
    // Actualizar KPIs con crecimiento
    this.kpis = {
      ...this.kpis,
      crecimientoVentas: Math.round(crecimientoVentas * 10) / 10,
      crecimientoTransacciones: Math.round(crecimientoTransacciones * 10) / 10,
      crecimientoClientes: Math.round(crecimientoClientes * 10) / 10,
      crecimientoTicket: Math.round(crecimientoTicket * 10) / 10
    };
    
    console.log('📈 Crecimiento calculado:', {
      ventas: this.kpis.crecimientoVentas,
      transacciones: this.kpis.crecimientoTransacciones,
      clientes: this.kpis.crecimientoClientes,
      ticket: this.kpis.crecimientoTicket
    });
  }
  
  /**
   * Actualiza los gráficos con datos reales
   */
  private actualizarGraficosConDatosReales(ventas: VentaResponse[]): void {
    const ventasValidas = ventas.filter(v => v.estado === 'COMPLETADA' || v.estado === 'PAGADA');
    
    // Agrupar ventas por fecha
    const ventasPorFecha = new Map<string, number>();
    
    ventasValidas.forEach(venta => {
      const fecha = venta.fechaCreacion.split('T')[0]; // YYYY-MM-DD
      const total = ventasPorFecha.get(fecha) || 0;
      ventasPorFecha.set(fecha, total + venta.total);
    });
    
    // Ordenar por fecha
    const fechasOrdenadas = Array.from(ventasPorFecha.keys()).sort();
    const totales = fechasOrdenadas.map(fecha => ventasPorFecha.get(fecha) || 0);
    
    // Actualizar gráfico de ventas
    this.datosGraficoVentas = {
      labels: fechasOrdenadas.map(f => {
        const [year, month, day] = f.split('-');
        return `${day}/${month}`;
      }),
      datasets: [{
        label: 'Ventas Diarias',
        data: totales,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }]
    };
    
    // Actualizar otros gráficos
    this.actualizarGraficos();
    this.calcularMetricas();
  }

  private cargarTopProductos(): void {
    this.topProductos = [
      {
        id: 1,
        nombre: 'Smartphone Samsung Galaxy S24',
        categoria: 'Electrónicos',
        totalVentas: 125750,
        cantidadVendida: 187,
        porcentaje: 27.4
      },
      {
        id: 2,
        nombre: 'Laptop HP Pavilion 15',
        categoria: 'Electrónicos', 
        totalVentas: 98420,
        cantidadVendida: 142,
        porcentaje: 21.5
      },
      {
        id: 3,
        nombre: 'Zapatillas Nike Air Max',
        categoria: 'Deportes',
        totalVentas: 67890,
        cantidadVendida: 234,
        porcentaje: 14.8
      },
      {
        id: 4,
        nombre: 'Auriculares Sony WH-1000XM5',
        categoria: 'Electrónicos',
        totalVentas: 45320,
        cantidadVendida: 156,
        porcentaje: 9.9
      },
      {
        id: 5,
        nombre: 'Reloj Apple Watch Series 9',
        categoria: 'Electrónicos',
        totalVentas: 38950,
        cantidadVendida: 89,
        porcentaje: 8.5
      }
    ];
  }

  private cargarTopVendedores(): void {
    this.topVendedores = [
      {
        id: 1,
        nombre: 'María García López',
        iniciales: 'MG',
        sucursal: 'Principal',
        totalVentas: 145750,
        comision: 7287,
        porcentajeMeta: 145.8,
        numeroVentas: 287
      },
      {
        id: 2,
        nombre: 'Carlos Roberto Silva',
        iniciales: 'CS',
        sucursal: 'Norte',
        totalVentas: 132450,
        comision: 6622,
        porcentajeMeta: 132.5,
        numeroVentas: 251
      },
      {
        id: 3,
        nombre: 'Ana Sofía Mendoza',
        iniciales: 'AM',
        sucursal: 'Sur',
        totalVentas: 118920,
        comision: 5946,
        porcentajeMeta: 118.9,
        numeroVentas: 198
      },
      {
        id: 4,
        nombre: 'Luis Fernando Torres',
        iniciales: 'LT',
        sucursal: 'Este',
        totalVentas: 97650,
        comision: 4882,
        porcentajeMeta: 97.7,
        numeroVentas: 165
      }
    ];
  }

  private inicializarFiltros(): void {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.rangoFechas = [inicioMes, hoy];
    
    // Seleccionar todas las sucursales por defecto
    this.sucursalesSeleccionadas = this.sucursales.map(s => s.id);
  }

  private inicializarGraficos(): void {
    this.inicializarGraficoVentas();
    this.inicializarGraficoMetodosPago();
    this.inicializarGraficoVendedores();
    this.inicializarGraficoSegmentos();
    this.inicializarGraficoPredicciones();
  }

  private inicializarGraficoVentas(): void {
    this.datosGraficoVentas = {
      labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Ventas 2025',
          data: [65000, 78000, 82000, 94000, 105000, 112000],
          fill: false,
          borderColor: '#42A5F5',
          backgroundColor: '#42A5F5',
          tension: 0.4
        },
        {
          label: 'Ventas 2024',
          data: [58000, 69000, 75000, 81000, 87000, 92000],
          fill: false,
          borderColor: '#66BB6A',
          backgroundColor: '#66BB6A',
          tension: 0.4
        }
      ]
    };

    this.opcionesGraficoVentas = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Evolución de Ventas Mensuales'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value: number) {
              return 'S/ ' + value.toLocaleString();
            }
          }
        }
      }
    };
  }

  private inicializarGraficoMetodosPago(): void {
    this.datosGraficoMetodosPago = {
      labels: ['Efectivo', 'Tarjeta Débito', 'Tarjeta Crédito', 'Transferencia', 'Yape/Plin'],
      datasets: [
        {
          data: [35, 25, 20, 12, 8],
          backgroundColor: [
            '#FF6384',
            '#36A2EB', 
            '#FFCE56',
            '#4BC0C0',
            '#9966FF'
          ],
          hoverBackgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56', 
            '#4BC0C0',
            '#9966FF'
          ]
        }
      ]
    };

    this.resumenMetodosPago = [
      { nombre: 'Efectivo', porcentaje: 35, color: '#FF6384' },
      { nombre: 'T. Débito', porcentaje: 25, color: '#36A2EB' },
      { nombre: 'T. Crédito', porcentaje: 20, color: '#FFCE56' },
      { nombre: 'Transferencia', porcentaje: 12, color: '#4BC0C0' },
      { nombre: 'Yape/Plin', porcentaje: 8, color: '#9966FF' }
    ];
  }

  private inicializarGraficoVendedores(): void {
    this.datosGraficoVendedores = {
      labels: this.topVendedores.map(v => v.nombre.split(' ')[0]),
      datasets: [
        {
          label: 'Ventas (S/)',
          data: this.topVendedores.map(v => v.totalVentas),
          backgroundColor: '#42A5F5',
          borderColor: '#1976D2',
          borderWidth: 1
        }
      ]
    };
  }

  private inicializarGraficoSegmentos(): void {
    this.datosSegmentosClientes = {
      labels: ['Premium VIP', 'Frecuentes', 'Ocasionales'],
      datasets: [
        {
          data: [127, 245, 195],
          backgroundColor: [
            '#FFD700',
            '#4CAF50', 
            '#2196F3'
          ],
          hoverBackgroundColor: [
            '#FFD700',
            '#4CAF50',
            '#2196F3'
          ]
        }
      ]
    };

    this.datosFrecuenciaCompras = {
      labels: ['Diario', 'Semanal', 'Quincenal', 'Mensual', 'Esporádico'],
      datasets: [
        {
          label: 'Número de Clientes',
          data: [45, 189, 156, 234, 143],
          backgroundColor: '#42A5F5',
          borderColor: '#1976D2',
          borderWidth: 1
        }
      ]
    };
  }

  private inicializarGraficoPredicciones(): void {
    this.datosPredicciones = {
      labels: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'],
      datasets: [
        {
          label: 'Ventas Reales',
          data: [85000, 92000, 88000, 95000, 105000, 112000, 0, 0],
          borderColor: '#42A5F5',
          backgroundColor: '#42A5F5',
          fill: false
        },
        {
          label: 'Predicción IA',
          data: [0, 0, 0, 0, 0, 112000, 118000, 125000],
          borderColor: '#FF6384',
          backgroundColor: '#FF6384',
          borderDash: [5, 5],
          fill: false
        }
      ]
    };

    this.opcionesGraficoPredicciones = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top'
        },
        title: {
          display: true,
          text: 'Predicciones de Ventas con IA'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value: number) {
              return 'S/ ' + value.toLocaleString();
            }
          }
        }
      }
    };

    this.opcionesGraficoCircular = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      }
    };

    this.opcionesGraficoBarras = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value: number) {
              return 'S/ ' + value.toLocaleString();
            }
          }
        }
      }
    };
  }

  private calcularProgresoMeta(): void {
    this.progresoMeta = (this.kpis.ventasTotales / this.kpis.metaMensual) * 100;
  }

  private calcularMetricas(): void {
    console.log('📈 Calculando métricas avanzadas para:', this.currentUser);
  }

  private actualizarGraficos(): void {
    console.log('📊 Actualizando gráficos...');
    this.inicializarGraficoVendedores();
  }

  // ✅ MÉTODOS DE UI
  toggleAccordion(section: string): void {
    this.accordionStates[section] = !this.accordionStates[section];
  }

  cambiarTab(index: 0 | 1 | 2 | 3 | 4): void {
    this.tabActivo = index;
  }

  toggleMenu(): void {
    // Por ahora solo un console.log, podrías implementar un menú contextual después
    console.log('🎯 Menú flotante clickeado');
  }

  // ✅ RESTO DE MÉTODOS YA IMPLEMENTADOS...
  // (Continuarían todos los métodos del componente anterior)

  // ✅ MÉTODOS DE FILTROS
  aplicarFiltros(): void {
    console.log('🔍 Aplicando filtros para usuario:', this.currentUser);
    console.log('📅 Fecha/Hora actual:', this.currentDateTime);
    console.log('🗓️ Período seleccionado:', this.periodoSeleccionado);
    
    this.aplicandoFiltros = true;
    
    // Recargar datos reales con los nuevos filtros
    const { fechaInicio, fechaFin } = this.calcularRangoFechas();
    console.log(`📊 Cargando datos del ${fechaInicio} al ${fechaFin}`);
    
    this.cargarDatosReales(fechaInicio, fechaFin);
    
    setTimeout(() => {
      this.aplicandoFiltros = false;
      
      this.messageService.add({
        severity: 'success',
        summary: '✅ Datos Actualizados',
        detail: `Mostrando datos reales del ${fechaInicio} al ${fechaFin}`,
        life: 3000
      });
    }, 1000);
  }

  limpiarFiltros(): void {
    console.log('🔄 Limpiando filtros...');
    
    this.periodoSeleccionado = 'mes_actual';
    this.sucursalesSeleccionadas = this.sucursales.map(s => s.id);
    this.vendedoresSeleccionados = [];
    this.categoriasSeleccionadas = [];
    this.rangoMontos = [0, 50000];
    this.minimoTransacciones = 1;
    
    this.inicializarFiltros();
    this.aplicarFiltros();
  }

  guardarConfiguracion(): void {
    console.log('💾 Guardando configuración de filtros...');
    
    const configuracion = {
      periodo: this.periodoSeleccionado,
      rangoFechas: this.rangoFechas,
      sucursales: this.sucursalesSeleccionadas,
      vendedores: this.vendedoresSeleccionados,
      categorias: this.categoriasSeleccionadas,
      usuario: this.currentUser,
      fechaGuardado: this.currentDateTime
    };
    
    localStorage.setItem('reportes_config_emerson147', JSON.stringify(configuracion));
    
    this.messageService.add({
      severity: 'info',
      summary: '💾 Configuración Guardada',
      detail: `Configuración guardada para ${this.currentUser}`,
      life: 3000
    });
  }

  // ✅ MÉTODOS DE REPORTES
  generarReporte(tipo: string): void {
    console.log('📄 Generando reporte:', tipo, 'para período:', this.periodoSeleccionado);
    
    const tipoReporte = this.tiposReportes.find(t => t.tipo === tipo);
    if (!tipoReporte) return;
    
    // Validar que haya datos para generar el reporte
    if (this.ventasActualesPeriodo.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Sin datos',
        detail: 'No hay datos de ventas para generar el reporte. Aplica un filtro primero.',
        life: 5000
      });
      return;
    }
    
    tipoReporte.generando = true;
    tipoReporte.progreso = 0;
    
    const intervalo = setInterval(() => {
      tipoReporte.progreso += Math.random() * 15 + 5;
      
      if (tipoReporte.progreso >= 100) {
        tipoReporte.progreso = 100;
        clearInterval(intervalo);
      }
    }, 300);
    
    // Generar el reporte según el tipo
    try {
      switch(tipo) {
        case 'excel':
          this.generarReporteExcel();
          break;
        case 'pdf':
          this.generarReportePDF();
          break;
        case 'powerpoint':
          this.generarReportePowerPoint();
          break;
        case 'csv':
          this.generarReporteCSV();
          break;
        default:
          throw new Error('Tipo de reporte no soportado');
      }
      
      // Simular tiempo de generación y luego finalizar
      setTimeout(() => {
        clearInterval(intervalo);
        this.finalizarGeneracionReporte(tipo, tipoReporte);
      }, 2000);
      
    } catch (error) {
      clearInterval(intervalo);
      tipoReporte.generando = false;
      tipoReporte.progreso = 0;
      
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al generar el reporte: ' + (error as Error).message,
        life: 5000
      });
    }
  }

  /**
   * 📊 GENERACIÓN DE REPORTE EXCEL (XLSX)
   * Genera un archivo Excel con múltiples hojas:
   * - Listado completo de ventas
   * - Resumen de KPIs
   * - Top 10 productos
   * - Top 10 clientes
   * - Top 10 vendedores
   */
  private generarReporteExcel(): void {
    console.log('📊 Generando reporte Excel...');
    
    const wb = XLSX.utils.book_new();
    
    // HOJA 1: Listado de Ventas
    const ventasData = this.ventasActualesPeriodo.map(venta => ({
      'ID Venta': venta.id,
      'Número Venta': venta.numeroVenta,
      'Fecha': new Date(venta.fechaCreacion).toLocaleDateString('es-PE'),
      'Cliente': `${venta.cliente.nombres} ${venta.cliente.apellidos}`,
      'Documento': venta.cliente.documento,
      'Vendedor': venta.usuario.nombre,
      'Tipo Comprobante': venta.tipoComprobante,
      'Serie': venta.serieComprobante,
      'Número': venta.numeroComprobante || 'N/A',
      'Subtotal': venta.subtotal,
      'IGV': venta.igv,
      'Total': venta.total,
      'Estado': venta.estado
    }));
    const wsVentas = XLSX.utils.json_to_sheet(ventasData);
    XLSX.utils.book_append_sheet(wb, wsVentas, 'Ventas');
    
    // HOJA 2: KPIs
    const kpisData = [
      { 'Métrica': 'Ventas Totales', 'Valor': `S/ ${this.kpis.ventasTotales.toFixed(2)}`, 'Crecimiento': `${this.kpis.crecimientoVentas}%` },
      { 'Métrica': 'Número de Transacciones', 'Valor': this.kpis.numeroTransacciones, 'Crecimiento': `${this.kpis.crecimientoTransacciones}%` },
      { 'Métrica': 'Clientes Únicos', 'Valor': this.kpis.clientesUnicos, 'Crecimiento': `${this.kpis.crecimientoClientes}%` },
      { 'Métrica': 'Ticket Promedio', 'Valor': `S/ ${this.kpis.ticketPromedio.toFixed(2)}`, 'Crecimiento': `${this.kpis.crecimientoTicket}%` },
      { 'Métrica': 'Meta Mensual', 'Valor': `S/ ${this.kpis.metaMensual.toFixed(2)}`, 'Crecimiento': '-' },
      { 'Métrica': 'Progreso Meta', 'Valor': `${this.progresoMeta}%`, 'Crecimiento': '-' }
    ];
    const wsKPIs = XLSX.utils.json_to_sheet(kpisData);
    XLSX.utils.book_append_sheet(wb, wsKPIs, 'KPIs');
    
    // HOJA 3: Top Productos
    const productosData = this.topProductos.slice(0, 10).map((p, i) => ({
      'Posición': i + 1,
      'Producto': p.nombre,
      'Categoría': p.categoria,
      'Cantidad Vendida': p.cantidadVendida,
      'Total Ventas': `S/ ${p.totalVentas.toFixed(2)}`,
      'Porcentaje': `${p.porcentaje}%`
    }));
    const wsProductos = XLSX.utils.json_to_sheet(productosData);
    XLSX.utils.book_append_sheet(wb, wsProductos, 'Top Productos');
    
    // HOJA 4: Top Clientes
    const clientesData = this.topClientes.slice(0, 10).map((c, i) => ({
      'Posición': i + 1,
      'Cliente': `${c.nombres} ${c.apellidos}`,
      'Email': c.email,
      'Segmento': c.segmento,
      'Total Compras': `S/ ${c.totalCompras.toFixed(2)}`,
      'Número Compras': c.numeroCompras,
      'Última Compra': new Date(c.ultimaCompra).toLocaleDateString('es-PE')
    }));
    const wsClientes = XLSX.utils.json_to_sheet(clientesData);
    XLSX.utils.book_append_sheet(wb, wsClientes, 'Top Clientes');
    
    // HOJA 5: Top Vendedores
    const vendedoresData = this.topVendedores.slice(0, 10).map((v, i) => ({
      'Posición': i + 1,
      'Vendedor': v.nombre,
      'Sucursal': v.sucursal,
      'Total Ventas': `S/ ${v.totalVentas.toFixed(2)}`,
      'Número Ventas': v.numeroVentas,
      'Comisión': `S/ ${v.comision.toFixed(2)}`,
      '% Meta': `${v.porcentajeMeta}%`
    }));
    const wsVendedores = XLSX.utils.json_to_sheet(vendedoresData);
    XLSX.utils.book_append_sheet(wb, wsVendedores, 'Top Vendedores');
    
    // Generar y descargar el archivo
    const nombreArchivo = `Reporte_Ventas_${this.periodoSeleccionado}_${new Date().getTime()}.xlsx`;
    XLSX.writeFile(wb, nombreArchivo);
    
    console.log('✅ Reporte Excel generado:', nombreArchivo);
  }

  /**
   * 📄 GENERACIÓN DE REPORTE PDF
   * Genera un PDF ejecutivo con:
   * - Portada con KPIs principales
   * - Tablas de top productos/clientes/vendedores
   */
  private generarReportePDF(): void {
    console.log('📄 Generando reporte PDF...');
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // PORTADA
    doc.setFillColor(59, 130, 246); // bg-blue-500
    doc.rect(0, 0, pageWidth, 60, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.text('Reporte de Ventas', pageWidth / 2, 25, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text(`Período: ${this.periodoSeleccionado}`, pageWidth / 2, 40, { align: 'center' });
    doc.text(`Generado: ${new Date().toLocaleDateString('es-PE')}`, pageWidth / 2, 50, { align: 'center' });
    
    // KPIs PRINCIPALES
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.text('Indicadores Clave (KPIs)', 14, 75);
    
    const kpisTable = [
      ['Métrica', 'Valor', 'Crecimiento'],
      ['Ventas Totales', `S/ ${this.kpis.ventasTotales.toLocaleString('es-PE')}`, `${this.kpis.crecimientoVentas}%`],
      ['Transacciones', this.kpis.numeroTransacciones.toString(), `${this.kpis.crecimientoTransacciones}%`],
      ['Clientes Únicos', this.kpis.clientesUnicos.toString(), `${this.kpis.crecimientoClientes}%`],
      ['Ticket Promedio', `S/ ${this.kpis.ticketPromedio.toFixed(2)}`, `${this.kpis.crecimientoTicket}%`]
    ];
    
    autoTable(doc, {
      startY: 80,
      head: [kpisTable[0]],
      body: kpisTable.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      alternateRowStyles: { fillColor: [249, 250, 251] }
    });
    
    // TOP 10 PRODUCTOS
    doc.addPage();
    doc.setFontSize(18);
    doc.text('Top 10 Productos Más Vendidos', 14, 20);
    
    const productosTable = [
      ['#', 'Producto', 'Categoría', 'Cantidad', 'Total Ventas'],
      ...this.topProductos.slice(0, 10).map((p, i) => [
        (i + 1).toString(),
        p.nombre,
        p.categoria,
        p.cantidadVendida.toString(),
        `S/ ${p.totalVentas.toFixed(0)}`
      ])
    ];
    
    autoTable(doc, {
      startY: 25,
      head: [productosTable[0]],
      body: productosTable.slice(1),
      theme: 'striped',
      headStyles: { fillColor: [245, 158, 11], textColor: 255 },
      alternateRowStyles: { fillColor: [254, 252, 232] }
    });
    
    // TOP 10 CLIENTES
    doc.addPage();
    doc.setFontSize(18);
    doc.text('Top 10 Mejores Clientes', 14, 20);
    
    const clientesTable = [
      ['#', 'Cliente', 'Segmento', 'Total Compras', 'Nº Compras'],
      ...this.topClientes.slice(0, 10).map((c, i) => [
        (i + 1).toString(),
        `${c.nombres} ${c.apellidos}`.substring(0, 30),
        c.segmento,
        `S/ ${c.totalCompras.toFixed(0)}`,
        c.numeroCompras.toString()
      ])
    ];
    
    autoTable(doc, {
      startY: 25,
      head: [clientesTable[0]],
      body: clientesTable.slice(1),
      theme: 'striped',
      headStyles: { fillColor: [139, 92, 246], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 243, 255] }
    });
    
    // TOP 10 VENDEDORES
    doc.addPage();
    doc.setFontSize(18);
    doc.text('Top 10 Mejores Vendedores', 14, 20);
    
    const vendedoresTable = [
      ['#', 'Vendedor', 'Sucursal', 'Total Ventas', 'Nº Ventas', 'Comisión'],
      ...this.topVendedores.slice(0, 10).map((v, i) => [
        (i + 1).toString(),
        v.nombre,
        v.sucursal,
        `S/ ${v.totalVentas.toFixed(0)}`,
        v.numeroVentas.toString(),
        `S/ ${v.comision.toFixed(0)}`
      ])
    ];
    
    autoTable(doc, {
      startY: 25,
      head: [vendedoresTable[0]],
      body: vendedoresTable.slice(1),
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129], textColor: 255 },
      alternateRowStyles: { fillColor: [236, 253, 245] }
    });
    
    // Guardar PDF
    const nombreArchivo = `Reporte_Ventas_${this.periodoSeleccionado}_${new Date().getTime()}.pdf`;
    doc.save(nombreArchivo);
    
    console.log('✅ Reporte PDF generado:', nombreArchivo);
  }

  /**
   * 📊 GENERACIÓN DE REPORTE POWERPOINT
   * Nota: Implementación simplificada. Para funcionalidad completa instalar: npm install pptxgenjs
   * Por ahora genera un archivo de texto con los datos formateados para presentación
   */
  private generarReportePowerPoint(): void {
    console.log('📊 Generando presentación PowerPoint...');
    
    // Crear contenido de presentación en formato texto
    let contenido = '═══════════════════════════════════════════════════════\n';
    contenido += '          REPORTE DE VENTAS - PRESENTACIÓN EJECUTIVA\n';
    contenido += '═══════════════════════════════════════════════════════\n\n';
    contenido += `Período: ${this.periodoSeleccionado}\n`;
    contenido += `Generado: ${new Date().toLocaleString('es-PE')}\n\n`;
    
    // SLIDE 1: KPIs
    contenido += '───────────────────────────────────────────────────────\n';
    contenido += '  SLIDE 1: INDICADORES CLAVE DE RENDIMIENTO (KPIs)\n';
    contenido += '───────────────────────────────────────────────────────\n\n';
    contenido += `💰 VENTAS TOTALES:\n   S/ ${this.kpis.ventasTotales.toLocaleString('es-PE')}\n   Crecimiento: ${this.kpis.crecimientoVentas}% ↗️\n\n`;
    contenido += `🛒 TRANSACCIONES:\n   ${this.kpis.numeroTransacciones.toLocaleString('es-PE')}\n   Crecimiento: ${this.kpis.crecimientoTransacciones}% ↗️\n\n`;
    contenido += `👥 CLIENTES ÚNICOS:\n   ${this.kpis.clientesUnicos.toLocaleString('es-PE')}\n   Crecimiento: ${this.kpis.crecimientoClientes}% ↗️\n\n`;
    contenido += `🎫 TICKET PROMEDIO:\n   S/ ${this.kpis.ticketPromedio.toFixed(2)}\n   Crecimiento: ${this.kpis.crecimientoTicket}% ↗️\n\n`;
    
    // SLIDE 2: Top Productos
    contenido += '───────────────────────────────────────────────────────\n';
    contenido += '  SLIDE 2: TOP 5 PRODUCTOS MÁS VENDIDOS\n';
    contenido += '───────────────────────────────────────────────────────\n\n';
    this.topProductos.slice(0, 5).forEach((p, i) => {
      contenido += `${i + 1}. ${p.nombre}\n`;
      contenido += `   Categoría: ${p.categoria}\n`;
      contenido += `   Vendidos: ${p.cantidadVendida} unidades\n`;
      contenido += `   Total: S/ ${p.totalVentas.toLocaleString('es-PE')}\n\n`;
    });
    
    // SLIDE 3: Top Clientes
    contenido += '───────────────────────────────────────────────────────\n';
    contenido += '  SLIDE 3: TOP 5 MEJORES CLIENTES\n';
    contenido += '───────────────────────────────────────────────────────\n\n';
    this.topClientes.slice(0, 5).forEach((c, i) => {
      contenido += `${i + 1}. ${c.nombres} ${c.apellidos}\n`;
      contenido += `   Segmento: ${c.segmento.toUpperCase()}\n`;
      contenido += `   Compras: ${c.numeroCompras} transacciones\n`;
      contenido += `   Total: S/ ${c.totalCompras.toLocaleString('es-PE')}\n\n`;
    });
    
    // SLIDE 4: Top Vendedores
    contenido += '───────────────────────────────────────────────────────\n';
    contenido += '  SLIDE 4: TOP 5 MEJORES VENDEDORES\n';
    contenido += '───────────────────────────────────────────────────────\n\n';
    this.topVendedores.slice(0, 5).forEach((v, i) => {
      contenido += `${i + 1}. ${v.nombre}\n`;
      contenido += `   Sucursal: ${v.sucursal}\n`;
      contenido += `   Ventas: ${v.numeroVentas} transacciones\n`;
      contenido += `   Total: S/ ${v.totalVentas.toLocaleString('es-PE')}\n`;
      contenido += `   Comisión: S/ ${v.comision.toLocaleString('es-PE')}\n\n`;
    });
    
    // SLIDE 5: Conclusiones
    contenido += '───────────────────────────────────────────────────────\n';
    contenido += '  SLIDE 5: CONCLUSIONES Y RECOMENDACIONES\n';
    contenido += '───────────────────────────────────────────────────────\n\n';
    contenido += `✅ Rendimiento general: ${this.kpis.crecimientoVentas > 0 ? 'POSITIVO' : 'REQUIERE ATENCIÓN'}\n\n`;
    contenido += `📈 Tendencias identificadas:\n`;
    contenido += `   • Las ventas han crecido ${this.kpis.crecimientoVentas}% vs período anterior\n`;
    contenido += `   • El ticket promedio muestra ${this.kpis.crecimientoTicket > 0 ? 'incremento' : 'decremento'} de ${Math.abs(this.kpis.crecimientoTicket)}%\n`;
    contenido += `   • Base de clientes creció ${this.kpis.crecimientoClientes}%\n\n`;
    contenido += `💡 Recomendaciones:\n`;
    contenido += `   • Mantener foco en productos top performers\n`;
    contenido += `   • Implementar programa de fidelización para clientes premium\n`;
    contenido += `   • Capacitar equipo de ventas en técnicas de upselling\n\n`;
    
    contenido += '═══════════════════════════════════════════════════════\n';
    contenido += '                    FIN DE LA PRESENTACIÓN\n';
    contenido += '═══════════════════════════════════════════════════════\n';
    
    // Convertir a blob y descargar
    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const nombreArchivo = `Presentacion_Ventas_${this.periodoSeleccionado}_${new Date().getTime()}.txt`;
    saveAs(blob, nombreArchivo);
    
    console.log('✅ Presentación generada (formato texto):', nombreArchivo);
    console.log('💡 Para generar PPTX real, instalar: npm install pptxgenjs');
  }

  /**
   * 📑 GENERACIÓN DE REPORTE CSV
   * Genera un archivo CSV simple con todas las ventas del período
   */
  private generarReporteCSV(): void {
    console.log('📑 Generando reporte CSV...');
    
    // Encabezados
    const headers = [
      'ID Venta',
      'Número Venta',
      'Fecha',
      'Cliente',
      'Documento Cliente',
      'Vendedor',
      'Tipo Comprobante',
      'Serie',
      'Número Comprobante',
      'Subtotal',
      'IGV',
      'Total',
      'Estado',
      'Productos'
    ];
    
    // Datos
    const rows = this.ventasActualesPeriodo.map(venta => {
      const productos = venta.detalles.map(d => `${d.descripcionProducto} (x${d.cantidad})`).join('; ');
      
      return [
        venta.id,
        venta.numeroVenta,
        new Date(venta.fechaCreacion).toLocaleDateString('es-PE'),
        `${venta.cliente.nombres} ${venta.cliente.apellidos}`,
        venta.cliente.documento,
        venta.usuario.nombre,
        venta.tipoComprobante,
        venta.serieComprobante,
        venta.numeroComprobante || 'N/A',
        venta.subtotal.toFixed(2),
        venta.igv.toFixed(2),
        venta.total.toFixed(2),
        venta.estado,
        productos
      ];
    });
    
    // Construir CSV
    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => {
        // Escapar comillas y encerrar en comillas si contiene comas o saltos de línea
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return '"' + cellStr.replace(/"/g, '""') + '"';
        }
        return cellStr;
      }).join(',') + '\n';
    });
    
    // Convertir a blob y descargar
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const nombreArchivo = `Ventas_${this.periodoSeleccionado}_${new Date().getTime()}.csv`;
    saveAs(blob, nombreArchivo);
    
    console.log('✅ Reporte CSV generado:', nombreArchivo);
  }

  private finalizarGeneracionReporte(tipo: string, tipoReporte: TipoReporte): void {
    tipoReporte.generando = false;
    tipoReporte.progreso = 0;
    
    const nuevoReporte: HistorialReporte = {
      id: this.historialReportes.length + 1,
      fecha: new Date(),
      tipo: tipoReporte.titulo,
      estado: 'COMPLETADO',
      archivo: `reporte_${tipo}_${this.currentUser}_${new Date().getTime()}.${tipoReporte.formato.toLowerCase()}`,
      tamaño: Math.random() * 3 + 1,
      icon: tipoReporte.icono
    };
    
    this.historialReportes.unshift(nuevoReporte);
    
    this.messageService.add({
      severity: 'success',
      summary: '📄 Reporte Generado',
      detail: `${tipoReporte.titulo} generado exitosamente por ${this.currentUser}`,
      life: 5000
    });
  }

  // ✅ MÉTODOS HELPER
getRankSeverity(rowIndex: number): 'info' | 'success' | 'warn' | 'danger' | 'secondary' | 'contrast' {
  if (rowIndex === 0) return 'success';
  if (rowIndex === 1) return 'info';
  if (rowIndex === 2) return 'warn';
  return 'secondary';
}

  getClienteInitials(cliente: TopCliente): string {
    if (!cliente) return 'NN';
    return (cliente.nombres.charAt(0) + cliente.apellidos.charAt(0)).toUpperCase();
  }

  getSegmentoClass(segmento: string): string {
    const clases = {
      'premium': 'premium-chip',
      'frecuente': 'frecuente-chip',
      'ocasional': 'ocasional-chip'
    };
    return clases[segmento as keyof typeof clases] || 'ocasional-chip';
  }

  getEstadoReporteSeverity(estado: string): 'success' | 'info' | 'danger' | 'warning' | 'secondary' {
    const severities = {
      'COMPLETADO': 'success',
      'GENERANDO': 'info',
      'ERROR': 'danger',
      'CANCELADO': 'warning'
    } as const;
    return severities[estado as keyof typeof severities] || 'secondary';
  }

  getEstadoReporteIcon(estado: string): string {
    const iconos = {
      'COMPLETADO': 'pi pi-check-circle',
      'GENERANDO': 'pi pi-spin pi-spinner',
      'ERROR': 'pi pi-times-circle',
      'CANCELADO': 'pi pi-ban'
    };
    return iconos[estado as keyof typeof iconos] || 'pi pi-info-circle';
  }

  // ✅ MÉTODOS DE EXPORTACIÓN ANALYTICS
  
  /**
   * Exporta el dashboard completo con todas las secciones
   */
  exportarDashboard(): void {
    const datosDashboard: DatosDashboard = {
      kpis: this.kpis,
      topProductos: this.topProductos,
      topClientes: this.topClientes,
      periodo: 'Octubre 2025',
      generadoPor: this.currentUser
    };

    this.exportacionService.exportarDashboardCompleto(datosDashboard);
  }

  /**
   * Exporta un reporte financiero enfocado en métricas económicas
   */
  exportarReporteFinanciero(): void {
    const datosDashboard: DatosDashboard = {
      kpis: this.kpis,
      topProductos: this.topProductos,
      topClientes: this.topClientes,
      periodo: 'Octubre 2025',
      generadoPor: this.currentUser
    };

    this.exportacionService.exportarReporteFinanciero(datosDashboard);
  }

  /**
   * Exporta un reporte de tendencias y proyecciones
   */
  exportarReporteTendencias(): void {
    const datosDashboard: DatosDashboard = {
      kpis: this.kpis,
      topProductos: this.topProductos,
      topClientes: this.topClientes,
      periodo: 'Octubre 2025',
      generadoPor: this.currentUser
    };

    this.exportacionService.exportarReporteTendencias(datosDashboard);
  }

  /**
   * Exporta un reporte comparativo entre períodos
   */
  exportarReporteComparativo(): void {
    const datosActuales: DatosDashboard = {
      kpis: this.kpis,
      topProductos: this.topProductos,
      topClientes: this.topClientes,
      periodo: 'Octubre 2025',
      generadoPor: this.currentUser
    };

    // Datos simulados del período anterior
    const datosPrevios: DatosDashboard = {
      kpis: {
        ...this.kpis,
        ventasTotales: this.kpis.ventasTotales * 0.9,
        numeroTransacciones: Math.round(this.kpis.numeroTransacciones * 0.92),
        clientesUnicos: Math.round(this.kpis.clientesUnicos * 0.95)
      },
      topProductos: this.topProductos,
      topClientes: this.topClientes,
      periodo: 'Septiembre 2025',
      generadoPor: this.currentUser
    };

    this.exportacionService.exportarReporteComparativo(datosActuales, datosPrevios);
  }

  /**
   * Exporta un resumen semanal compacto
   */
  exportarResumenSemanal(): void {
    const datosDashboard: DatosDashboard = {
      kpis: this.kpis,
      topProductos: this.topProductos,
      topClientes: this.topClientes,
      periodo: 'Semana 41 - Octubre 2025',
      generadoPor: this.currentUser
    };

    this.exportacionService.exportarResumenSemanal(datosDashboard);
  }

  /**
   * Exporta un resumen mensual detallado
   */
  exportarResumenMensual(): void {
    const datosDashboard: DatosDashboard = {
      kpis: this.kpis,
      topProductos: this.topProductos,
      topClientes: this.topClientes,
      periodo: 'Octubre 2025',
      generadoPor: this.currentUser
    };

    this.exportacionService.exportarResumenMensual(datosDashboard);
  }

  // ✅ MÉTODOS AUXILIARES DEL MENÚ

  actualizarDatos(): void {
    this.cargarDatosIniciales();
    this.messageService.add({
      severity: 'success',
      summary: '🔄 Datos Actualizados',
      detail: `Datos actualizados a ${this.currentDateTime}`,
      life: 3000
    });
  }

  abrirConfiguracion(): void {
    this.messageService.add({
      severity: 'info',
      summary: '⚙️ Configuración',
      detail: 'Abriendo panel de configuración...',
      life: 3000
    });
  }

  mostrarAyuda(): void {
    this.messageService.add({
      severity: 'info',
      summary: '❓ Centro de Ayuda',
      detail: 'Accediendo a la documentación del sistema...',
      life: 3000
    });
  }

  // ✅ MÉTODOS PARA EVITAR ERRORES EN TEMPLATE
  cambiarTipoGrafico(): void {
    console.log('📊 Cambiando tipo de gráfico a:', this.tipoGraficoVentas);
  }

cargarHistorialReportes(event: TableLazyLoadEvent): void {
  console.log('📋 Cargando historial con lazy loading:', event);
  this.cargandoHistorial = true;
  setTimeout(() => {
    this.cargandoHistorial = false;
  }, 1000);
}
  /**
   * Entrena el modelo de predicción con datos históricos reales
   */
  entrenarModelo(): void {
    console.log('🧠 Entrenando modelo de IA con datos reales...');
    this.entrenandoModelo = true;

    try {
      // Preparar datos de ventas para entrenamiento
      const datosHistoricos = this.prepararDatosHistoricos();
      
      // Validar datos
      const validacion = this.prediccionService.validarDatos(datosHistoricos);
      if (!validacion.valido) {
        this.messageService.add({
          severity: 'error',
          summary: '❌ Error de Validación',
          detail: validacion.errores.join(', '),
          life: 5000
        });
        this.entrenandoModelo = false;
        return;
      }

      // Simular entrenamiento (en producción sería un proceso real)
      setTimeout(() => {
        const modelo = this.prediccionService.entrenarModelo(
          datosHistoricos,
          this.algoritmoIA as any
        );

        this.entrenandoModelo = false;
        this.messageService.add({
          severity: 'success',
          summary: '🤖 Modelo Entrenado',
          detail: `Modelo ${modelo.algoritmo} entrenado con ${modelo.datosEntrenamiento} registros. Precisión: ${modelo.precision}%`,
          life: 5000
        });

        console.log('✅ Modelo entrenado:', modelo);
      }, 2000);

    } catch (error: any) {
      this.entrenandoModelo = false;
      this.messageService.add({
        severity: 'error',
        summary: '❌ Error al Entrenar',
        detail: error.message || 'Error desconocido',
        life: 5000
      });
      console.error('❌ Error al entrenar modelo:', error);
    }
  }

  /**
   * Genera predicciones de ventas futuras con IA
   */
  generarPrediccion(): void {
    console.log('📈 Generando predicción con IA...');
    this.generandoPrediccion = true;

    try {
      // Preparar datos históricos
      const datosHistoricos = this.prepararDatosHistoricos();

      // Configuración de predicción
      const configuracion: ConfiguracionPrediccion = {
        algoritmo: this.algoritmoIA as any,
        ventanaTiempo: this.ventanaTiempo as any,
        variablesPredictivas: this.variablesPredictivas as any,
        periodoPrediccion: 30 // Predecir 30 días
      };

      // Simular generación (en producción sería procesamiento real)
      setTimeout(() => {
        const prediccionesGeneradas = this.prediccionService.generarPredicciones(
          datosHistoricos,
          configuracion
        );

        // Actualizar datos de predicciones
        this.predicciones = {
          proximaSemana: prediccionesGeneradas.proximaSemana,
          proximoMes: prediccionesGeneradas.proximoMes,
          confianza: prediccionesGeneradas.confianza,
          tendencia: prediccionesGeneradas.tendencia === 'creciente' ? 'ascendente' : 
                     prediccionesGeneradas.tendencia === 'decreciente' ? 'descendente' : 'estable'
        };

        // Actualizar gráfico de predicciones
        this.actualizarGraficoPredicciones(prediccionesGeneradas);

        this.generandoPrediccion = false;
        this.messageService.add({
          severity: 'success',
          summary: '🔮 Predicción Generada',
          detail: `Tendencia ${prediccionesGeneradas.tendencia}. Próxima semana: ${prediccionesGeneradas.proximaSemana > 0 ? '+' : ''}${prediccionesGeneradas.proximaSemana.toFixed(1)}%`,
          life: 5000
        });

        console.log('✅ Predicciones generadas:', prediccionesGeneradas);
      }, 2000);

    } catch (error: any) {
      this.generandoPrediccion = false;
      this.messageService.add({
        severity: 'error',
        summary: '❌ Error al Predecir',
        detail: error.message || 'Error desconocido',
        life: 5000
      });
      console.error('❌ Error al generar predicción:', error);
    }
  }

  /**
   * Exporta el modelo entrenado a JSON
   */
  exportarModelo(): void {
    try {
      const modeloJSON = this.prediccionService.exportarModelo();
      
      // Crear Blob y descargar
      const blob = new Blob([modeloJSON], { type: 'application/json' });
      const fecha = new Date().toISOString().split('T')[0];
      const nombreArchivo = `modelo-prediccion-${fecha}.json`;
      
      saveAs(blob, nombreArchivo);

      this.messageService.add({
        severity: 'success',
        summary: '📤 Modelo Exportado',
        detail: `Archivo: ${nombreArchivo}`,
        life: 4000
      });

      console.log('✅ Modelo exportado:', nombreArchivo);

    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: '❌ Error al Exportar',
        detail: error.message || 'No hay modelo entrenado para exportar',
        life: 4000
      });
      console.error('❌ Error al exportar modelo:', error);
    }
  }

  /**
   * Prepara datos históricos desde ventasActualesPeriodo
   */
  private prepararDatosHistoricos(): DatoVenta[] {
    if (!this.ventasActualesPeriodo || this.ventasActualesPeriodo.length === 0) {
      // Si no hay datos reales, generar datos de ejemplo para demostración
      return this.generarDatosEjemplo();
    }

    // Agrupar ventas por fecha
    const ventasPorFecha = new Map<string, { monto: number; transacciones: number }>();

    this.ventasActualesPeriodo.forEach(venta => {
      const fechaKey = new Date(venta.fechaCreacion).toISOString().split('T')[0];
      const actual = ventasPorFecha.get(fechaKey) || { monto: 0, transacciones: 0 };
      
      ventasPorFecha.set(fechaKey, {
        monto: actual.monto + venta.total,
        transacciones: actual.transacciones + 1
      });
    });

    // Convertir a array de DatoVenta
    return Array.from(ventasPorFecha.entries()).map(([fecha, datos]) => ({
      fecha: new Date(fecha),
      monto: datos.monto,
      transacciones: datos.transacciones
    })).sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
  }

  /**
   * Genera datos de ejemplo para demostración
   */
  private generarDatosEjemplo(): DatoVenta[] {
    const datos: DatoVenta[] = [];
    const hoy = new Date();
    const montoBase = 15000;

    // Generar 60 días de datos con tendencia y variación
    for (let i = 60; i >= 0; i--) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - i);

      // Tendencia creciente + variación aleatoria + patrón semanal
      const diaSemana = fecha.getDay();
      const factorSemanal = diaSemana === 0 || diaSemana === 6 ? 1.3 : 1.0; // Fin de semana más ventas
      const tendencia = 1 + (60 - i) * 0.002; // Crecimiento gradual
      const variacion = 0.8 + Math.random() * 0.4; // Variación ±20%

      const monto = montoBase * tendencia * factorSemanal * variacion;
      const transacciones = Math.floor(80 + Math.random() * 40);

      datos.push({
        fecha,
        monto,
        transacciones
      });
    }

    return datos;
  }

  /**
   * Actualiza el gráfico de predicciones con datos reales
   */
  private actualizarGraficoPredicciones(predicciones: PrediccionVentas): void {
    const datosHistoricos = this.prepararDatosHistoricos();
    const ultimosDias = datosHistoricos.slice(-30); // Últimos 30 días

    // Labels: combinar histórico y predicción
    const labelsHistorico = ultimosDias.map(d => 
      d.fecha.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
    );
    const labelsPrediccion = predicciones.predicciones.slice(0, 30).map(p => 
      p.fecha.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
    );

    // Datos históricos
    const datosHistoricosGrafico = ultimosDias.map(d => d.monto);
    
    // Datos predichos
    const datosPredichos = predicciones.predicciones.slice(0, 30).map(p => p.valorPredicho);
    const confianzaMin = predicciones.predicciones.slice(0, 30).map(p => p.confianzaMin);
    const confianzaMax = predicciones.predicciones.slice(0, 30).map(p => p.confianzaMax);

    this.datosPredicciones = {
      labels: [...labelsHistorico, ...labelsPrediccion],
      datasets: [
        {
          label: 'Ventas Históricas',
          data: [...datosHistoricosGrafico, ...Array(30).fill(null)],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3
        },
        {
          label: 'Predicción',
          data: [...Array(30).fill(null), ...datosPredichos],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: false,
          tension: 0.4,
          borderWidth: 3,
          borderDash: [5, 5]
        },
        {
          label: 'Rango de Confianza (Mín)',
          data: [...Array(30).fill(null), ...confianzaMin],
          borderColor: 'rgba(239, 68, 68, 0.3)',
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.4,
          borderWidth: 1,
          borderDash: [2, 2]
        },
        {
          label: 'Rango de Confianza (Máx)',
          data: [...Array(30).fill(null), ...confianzaMax],
          borderColor: 'rgba(239, 68, 68, 0.3)',
          backgroundColor: 'rgba(239, 68, 68, 0.05)',
          fill: false,
          tension: 0.4,
          borderWidth: 1,
          borderDash: [2, 2]
        }
      ]
    };
  }

  verDetalleCliente(cliente: TopCliente): void {
    this.clienteSeleccionado = cliente;
    this.tipoDetalle = 'cliente';
    this.tituloDetalle = `Detalle de ${cliente.nombres} ${cliente.apellidos}`;
    this.mostrarDetalles = true;
    
    // Cargar historial de compras REAL del cliente desde el backend
    this.cargarHistorialComprasCliente(cliente.id);
  }
  
  /**
   * Carga el historial de compras reales del cliente desde el backend
   */
  private cargarHistorialComprasCliente(clienteId: number): void {
    console.log(`📦 Cargando historial de compras del cliente ID: ${clienteId}`);
    
    this.cargandoHistorial = true;
    this.historialComprasCliente = [];
    
    // Obtener todas las ventas del cliente
    this.ventasService.obtenerVentasPorCliente(clienteId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ventas) => {
          console.log(`✅ Ventas del cliente cargadas: ${ventas.length}`);
          
          // Transformar las ventas a CompraCliente para la tabla
          this.historialComprasCliente = this.transformarVentasACompras(ventas);
          
          this.cargandoHistorial = false;
          
          if (this.historialComprasCliente.length === 0) {
            this.messageService.add({
              severity: 'info',
              summary: 'Sin Compras',
              detail: 'Este cliente no tiene compras registradas',
              life: 3000
            });
          }
        },
        error: (error) => {
          console.error('❌ Error cargando historial de compras:', error);
          this.cargandoHistorial = false;
          
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo cargar el historial de compras del cliente',
            life: 5000
          });
        }
      });
  }
  
  /**
   * Transforma las ventas del backend al formato CompraCliente para la tabla
   */
  private transformarVentasACompras(ventas: VentaResponse[]): CompraCliente[] {
    const compras: CompraCliente[] = [];
    
    ventas.forEach(venta => {
      // Para cada venta, crear una compra por cada detalle (producto)
      venta.detalles.forEach(detalle => {
        compras.push({
          fecha: new Date(venta.fechaCreacion),
          producto: detalle.producto.nombre,
          cantidad: detalle.cantidad,
          total: detalle.subtotal,
          vendedor: venta.usuario.nombre || venta.usuario.username
        });
      });
    });
    
    // Ordenar por fecha descendente (más recientes primero)
    compras.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
    
    console.log(`📊 Compras procesadas: ${compras.length}`);
    return compras;
  }

  enviarEmailCliente(cliente: TopCliente): void {
    this.messageService.add({
      severity: 'info',
      summary: '📧 Email Enviado',
      detail: `Email enviado a ${cliente.email}`,
      life: 3000
    });
  }

  filtrarClientes(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    console.log('🔍 Filtrando clientes:', valor);
  }

  descargarReporte(reporte: HistorialReporte): void {
    this.messageService.add({
      severity: 'info',
      summary: '💾 Descarga Iniciada',
      detail: `Descargando ${reporte.archivo}`,
      life: 3000
    });
  }

  vistaPrevia(reporte: HistorialReporte): void {
    this.messageService.add({
      severity: 'info',
      summary: '👁️ Vista Previa',
      detail: `Abriendo vista previa de ${reporte.archivo}`,
      life: 3000
    });
  }

  eliminarReporte(reporte: HistorialReporte): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar el reporte ${reporte.tipo}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        const index = this.historialReportes.indexOf(reporte);
        if (index > -1) {
          this.historialReportes.splice(index, 1);
          this.messageService.add({
            severity: 'warn',
            summary: '🗑️ Reporte Eliminado',
            detail: `${reporte.tipo} eliminado del historial`,
            life: 3000
          });
        }
      }
    });
  }
}
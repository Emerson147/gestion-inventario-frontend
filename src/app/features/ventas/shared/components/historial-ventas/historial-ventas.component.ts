import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  inject,
  HostListener,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// PrimeNG Imports
import {
  MessageService,
  ConfirmationService,
  MenuItem,
  LazyLoadEvent,
} from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { CalendarModule } from 'primeng/calendar';
import { SliderModule } from 'primeng/slider';
import { ChipsModule } from 'primeng/chips';
import {
  AutoCompleteModule,
  AutoCompleteSelectEvent,
} from 'primeng/autocomplete';
import { AccordionModule } from 'primeng/accordion';
import { DataViewModule } from 'primeng/dataview';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { BadgeModule } from 'primeng/badge';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { RatingModule } from 'primeng/rating';
import { ProgressBarModule } from 'primeng/progressbar';
import { KnobModule } from 'primeng/knob';
import { ChartModule } from 'primeng/chart';
import { TimelineModule } from 'primeng/timeline';
import { ToolbarModule } from 'primeng/toolbar';
import { SpeedDialModule } from 'primeng/speeddial';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MenubarModule } from 'primeng/menubar';
import { SplitButtonModule } from 'primeng/splitbutton';
import { DialogModule } from 'primeng/dialog';
import { TabViewModule } from 'primeng/tabview';
import { FieldsetModule } from 'primeng/fieldset';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ContextMenuModule, ContextMenu } from 'primeng/contextmenu';
import { ToastModule } from 'primeng/toast';
import { OverlayPanelModule, OverlayPanel } from 'primeng/overlaypanel';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ListboxModule } from 'primeng/listbox';
import { ButtonGroupModule } from 'primeng/buttongroup';
import { TooltipModule } from 'primeng/tooltip';
import { PaginatorModule } from 'primeng/paginator';

import { VentasService } from '../../../../../core/services/ventas.service';
import { EstadisticasVentasService } from '../../../../../core/services/estadisticas-ventas.service';
import { ComprobantesService } from '../../../../../core/services/comprobantes.service';
import { VentaResponse } from '../../../../../core/models/venta.model';

// jsPDF para exportación a PDF
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ZenMetricCardComponent } from '../zen-metric-card/zen-metric-card.component';
// Interfaces
interface Venta {
  id: number;
  numeroVenta: string;
  fechaVenta: Date;
  cliente?: Cliente;
  usuario?: Usuario;
  total: number;
  subtotal: number;
  igv?: number;
  estado: EstadoVenta;
  tipoComprobante: string;
  serieComprobante: string;
  pago?: PagoVenta;
  detalles?: DetalleVenta[];
  observaciones?: string;
}

interface Cliente {
  id: number;
  nombres: string;
  apellidos: string;
  dni?: string;
  ruc?: string;
  email?: string;
  telefono?: string;
  calificacion?: number;
  compras?: number;
  totalCompras?: number;
}

interface Usuario {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
}

interface PagoVenta {
  id: number;
  metodoPago: MetodoPago;
  monto: number;
  nombreTarjeta?: string;
  ultimos4Digitos?: string;
  numeroReferencia?: string;
}

interface Producto {
  id: number;
  nombre: string;
  codigo?: string;
  precio?: number;
}

interface DetalleVenta {
  id: number;
  producto?: Producto;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

type EstadoVenta = 'PENDIENTE' | 'COMPLETADA' | 'ANULADA' | 'PROCESANDO';
type MetodoPago =
  | 'EFECTIVO'
  | 'TARJETA_DEBITO'
  | 'TARJETA_CREDITO'
  | 'YAPE'
  | 'PLIN'
  | 'TRANSFERENCIA';
type TipoVista = 'list' | 'grid';

interface FiltrosVenta {
  busqueda?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
  estados?: EstadoVenta[];
  metodosPago?: MetodoPago[];
  montoMinimo?: number;
  montoMaximo?: number;
  usuarios?: number[];
  calificacionMinima?: number;
}

interface EstadisticasVenta {
  ventasHoy: number;
  totalVentasHoy: number;
  clientesUnicos: number;
  clientesNuevos: number;
  productosVendidos: number;
  tiposProductos: number;
  porcentajeCrecimiento: number;
  promedioVenta: number;
  metaDiaria: number;
}

interface SugerenciaBusqueda {
  label: string;
  tipo: string;
  icon: string;
}

interface OpcionSelect {
  label: string;
  value: string | number;
  icon?: string;
}

interface DatosGrafico {
  labels: string[];
  datasets: {
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension: number;
    fill: boolean;
  }[];
}

interface OpcionesGrafico {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins: {
    legend: {
      display: boolean;
    };
  };
  scales: {
    x: {
      display: boolean;
    };
    y: {
      display: boolean;
    };
  };
}

interface DistribucionPago {
  nombre: string;
  color: string;
  cantidad: number;
  porcentaje: number;
}

interface ActividadReciente {
  titulo: string;
  descripcion: string;
  tiempo: string;
}

interface TopProducto {
  nombre: string;
  cantidad: number;
}

interface EventoAutoComplete {
  query: string;
}

// No necesitamos esta interfaz, usaremos AutoCompleteSelectEvent de PrimeNG

@Component({
  selector: 'app-historial-ventas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ZenMetricCardComponent,
    // PrimeNG Modules
    TableModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    MultiSelectModule,
    CalendarModule,
    SliderModule,
    ChipsModule,
    AutoCompleteModule,
    AccordionModule,
    DataViewModule,
    CardModule,
    ChipModule,
    BadgeModule,
    TagModule,
    AvatarModule,
    RatingModule,
    ProgressBarModule,
    KnobModule,
    ChartModule,
    TimelineModule,
    ToolbarModule,
    SpeedDialModule,
    SelectButtonModule,
    MenubarModule,
    SplitButtonModule,
    DialogModule,
    TabViewModule,
    FieldsetModule,
    ConfirmDialogModule,
    ContextMenuModule,
    ToastModule,
    OverlayPanelModule,
    ProgressSpinnerModule,
    ListboxModule,
    ButtonGroupModule,
    PaginatorModule,
    TooltipModule,
  ],
  templateUrl: './historial-ventas.component.html',
  styleUrls: ['./historial-ventas.component.scss'],
})
export class HistorialVentasComponent implements OnInit, OnDestroy {
  // ✅ REFERENCIAS A COMPONENTES
  @ViewChild('cm') contextMenu!: ContextMenu;
  @ViewChild('opFiltros') overlayFiltros!: OverlayPanel;

  // ✅ DATOS PRINCIPALES
  ventas: Venta[] = [];
  ventasFiltradas: Venta[] = [];
  ventasPaginadas: Venta[] = [];
  ventaSeleccionada: Venta | null = null;
  totalVentas = 0;

  // ✅ ESTADOS DE LA INTERFAZ
  cargandoVentas = false;
  mostrarDetalleDialog = false;
  tipoVista: TipoVista = 'list';
  paginaActual = 1;
  ventasPorPagina = 25;
  totalPaginas = 0;
  sidebarAbierto = false; // Para controlar el sidebar en móvil

  // ✅ FILTROS Y BÚSQUEDA
  filtros: FiltrosVenta = {};
  busquedaRapida = '';
  sugerenciasBusqueda: SugerenciaBusqueda[] = [];
  filtrosRapidos: string[] = [];
  rangoFechas: Date[] = [];
  rangoMonto: number[] = [0, 10000];

  // ✅ SELECCIONES MÚLTIPLES
  estadosSeleccionados: EstadoVenta[] = [];
  metodosSeleccionados: MetodoPago[] = [];
  usuariosSeleccionados: number[] = [];
  periodoSeleccionado: string = 'todos';
  metodoPagoSeleccionado: MetodoPago | null = null;
  calificacionMinima = 0;

  // ✅ ORDENAMIENTO
  ordenarPor = 'fecha_desc';
  campoOrden = 'fechaVenta';
  direccionOrden: 'asc' | 'desc' = 'desc';

  // Agregar estas propiedades si faltan:
  ventasHoy = 0;
  totalVentasHoy = 0;
  clientesUnicos = 0;
  clientesNuevos = 0;
  productosVendidos = 0;
  tiposProductos = 0;
  porcentajeCrecimiento = 0;
  promedioVenta = 0;
  metaDiaria = 10000;

  // Propiedades para fechas
  fechaDesde?: Date;
  fechaHasta?: Date;

  // Math para templates
  Math = Math;

  // ✅ AUTO REFRESH INTERVAL
  private autoRefreshInterval?: number;

  getProgresoFromDetail(detail: string): number {
    const match = detail.match(/(\d+)%/);
    return match ? parseInt(match[1]) : 0;
  }
  // ✅ ESTADÍSTICAS
  estadisticas: EstadisticasVenta = {
    ventasHoy: 0,
    totalVentasHoy: 0,
    clientesUnicos: 10,
    clientesNuevos: 0,
    productosVendidos: 0,
    tiposProductos: 0,
    porcentajeCrecimiento: 0,
    promedioVenta: 0,
    metaDiaria: 10000,
  };

  // ✅ DATOS PARA GRÁFICOS Y PROGRESO
  progresoMeta = 0;
  datosGraficoTendencia: DatosGrafico = {
    labels: [],
    datasets: [],
  };
  opcionesGrafico: OpcionesGrafico = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
      },
    },
  };
  distribucionPagos: DistribucionPago[] = [];
  actividadReciente: ActividadReciente[] = [];
  topMetodosPago: DistribucionPago[] = [];
  topProductos: TopProducto[] = [];

  // ✅ FECHAS Y TIEMPO
  fechaActual: Date = new Date();
  horaActual = '';

  // ✅ OPCIONES PARA COMPONENTES
  estadosVenta: OpcionSelect[] = [
    { label: 'Pendiente', value: 'PENDIENTE' },
    { label: 'Completada', value: 'COMPLETADA' },
    { label: 'Anulada', value: 'ANULADA' },
    { label: 'Procesando', value: 'PROCESANDO' },
  ];

  metodosPago: OpcionSelect[] = [
    { label: '💵 Efectivo', value: 'EFECTIVO' },
    { label: '💳 Tarjeta Débito', value: 'TARJETA_DEBITO' },
    { label: '💳 Tarjeta Crédito', value: 'TARJETA_CREDITO' },
    { label: '📱 Yape', value: 'YAPE' },
    { label: '📱 Plin', value: 'PLIN' },
    { label: '🏦 Transferencia', value: 'TRANSFERENCIA' },
  ];

  usuarios: OpcionSelect[] = [
    { label: 'Juan Pérez', value: 1 },
    { label: 'María García', value: 2 },
    { label: 'Carlos López', value: 3 },
  ];

  opcionesVista: OpcionSelect[] = [
    { label: 'Lista', value: 'list', icon: 'pi pi-list' },
    { label: 'Tarjetas', value: 'grid', icon: 'pi pi-th-large' },
  ];

  opcionesOrdenamiento: OpcionSelect[] = [
    {
      label: 'Fecha (Más reciente)',
      value: 'fecha_desc',
      icon: 'pi pi-calendar',
    },
    {
      label: 'Fecha (Más antigua)',
      value: 'fecha_asc',
      icon: 'pi pi-calendar',
    },
    { label: 'Monto (Mayor)', value: 'monto_desc', icon: 'pi pi-dollar' },
    { label: 'Monto (Menor)', value: 'monto_asc', icon: 'pi pi-dollar' },
    { label: 'Cliente (A-Z)', value: 'cliente', icon: 'pi pi-user' },
    { label: 'Número de venta', value: 'numero', icon: 'pi pi-hashtag' },
  ];

  // ✅ MENÚS Y ACCIONES
  accionesRapidas: MenuItem[] = [];
  menuAcciones: MenuItem[] = [];
  opcionesExportacion: MenuItem[] = [];
  menuContextual: MenuItem[] = [];

  // ✅ OBSERVABLE PARA CLEANUP
  private destroy$ = new Subject<void>();

  private messageService: MessageService = inject(MessageService);
  private confirmationService: ConfirmationService =
    inject(ConfirmationService);
  private ventasService: VentasService = inject(VentasService); // Reemplazar con tu servicio real
  // private exportService: any   // Reemplazar con tu servicio de exportación
  private estadisticasVentasService = inject(EstadisticasVentasService);
  private comprobantesService = inject(ComprobantesService);

  // Agregar estas propiedades para el estado de carga:
  cargandoEstadisticas = false;
  errorEstadisticas: string | null = null;

  constructor() {
    this.inicializarConfiguraciones();
  }

  ngOnInit(): void {
    console.log('🚀 [INICIO] Inicializando Historial de Ventas...');
    console.log('📊 [CONFIG] Usuario actual:', 'Emerson147');
    console.log('📅 [FECHA] Fecha actual:', new Date().toISOString());

    this.inicializarComponente();
    this.configurarBusquedaInteligente();
    this.suscribirseANuevasVentas();

    // ✅ CARGA DIFERIDA para evitar congelamiento
    setTimeout(() => this.cargarDatosIniciales(), 200);
    setTimeout(() => this.configurarRelojes(), 400);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }

    document.removeEventListener('keydown', this.handleKeyboardShortcuts);
  }

  /**
   * Suscribirse a eventos de nuevas ventas registradas
   * Se actualiza automáticamente cuando se procesa una venta
   */
  private suscribirseANuevasVentas(): void {
    this.ventasService.onVentaRegistrada$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (nuevaVenta) => {
          console.log(
            '✅ [EVENTO] Nueva venta registrada detectada:',
            nuevaVenta,
          );

          // Recargar datos automáticamente
          this.actualizarDatosDespuesDeVenta();

          // Mostrar notificación opcional
          this.messageService.add({
            severity: 'success',
            summary: 'Venta Registrada',
            detail: `Venta ${nuevaVenta.numeroVenta} procesada correctamente`,
            life: 3000,
          });
        },
        error: (error) => {
          console.error(
            '❌ [ERROR] Error en suscripción a nuevas ventas:',
            error,
          );
        },
      });
  }

  /**
   * Actualizar datos después de registrar una venta
   */
  private actualizarDatosDespuesDeVenta(): void {
    console.log(
      '🔄 [ACTUALIZACIÓN] Actualizando datos después de nueva venta...',
    );

    // Recargar ventas y estadísticas
    this.cargarVentasReales();
    this.cargarEstadisticas();
  }

  // ✅ INICIALIZACIÓN
  private inicializarConfiguraciones(): void {
    this.configurarMenus();
    this.configurarGraficos();
    this.inicializarFiltros();
  }

  private inicializarComponente(): void {
    this.fechaActual = new Date();
    this.rangoFechas = [new Date(), new Date()];
    this.tipoVista = 'list';
    this.ventasPorPagina = 25;
    this.paginaActual = 1;
  }

  private cargarDatosIniciales(): void {
    console.log(
      '📚 [CARGA] Iniciando carga de datos desde la base de datos...',
    );
    this.cargandoVentas = true;

    // Cargar solo datos reales de la base de datos
    this.cargarVentasReales();
    this.cargarEstadisticas();
  }

  private cargarVentasReales(): void {
    console.log('🔄 [API] Cargando ventas desde la base de datos...');

    // No enviar filtros en la carga inicial - cargar TODAS las ventas
    // Los filtros se aplicarán localmente en el frontend
    this.ventasService
      .obtenerVentas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('📦 [API] Respuesta recibida:', data);

          if (data && data.length > 0) {
            this.procesarVentasAPI(data);
          } else {
            // No hay ventas en la base de datos
            this.ventas = [];
            this.ventasFiltradas = [];
            this.ventasPaginadas = [];
            this.cargandoVentas = false;

            console.log(
              'ℹ️ [API] No se encontraron ventas en la base de datos',
            );

            this.messageService.add({
              severity: 'info',
              summary: 'ℹ️ Sin Datos',
              detail: 'No hay ventas registradas',
              life: 4000,
            });
          }
        },
        error: (error) => {
          console.error('❌ [API ERROR] Error al cargar ventas:', error);
          this.cargandoVentas = false;

          // Inicializar con arrays vacíos en caso de error
          this.ventas = [];
          this.ventasFiltradas = [];
          this.ventasPaginadas = [];

          this.messageService.add({
            severity: 'error',
            summary: '❌ Error de Conexión',
            detail:
              'No se pudo conectar con el servidor. Verifique su conexión.',
            life: 5000,
          });
        },
      });
  }

  private configurarRelojes(): void {
    setInterval(() => {
      this.horaActual = new Date().toLocaleTimeString('es-PE');
    }, 1000);
  }

  private configurarBusquedaInteligente(): void {
    // Implementar debounce para búsqueda
    // TODO: Implementar observable para búsqueda con debounce
  }

  /**
   * Remover un estado de los filtros seleccionados
   */
  removerEstado(estado: EstadoVenta): void {
    this.estadosSeleccionados = this.estadosSeleccionados.filter(
      (e) => e !== estado,
    );
    this.aplicarFiltros();
  }

  // ✅ CONFIGURACIÓN DE MENÚS
  private configurarMenus(): void {
    this.accionesRapidas = [
      {
        icon: 'pi pi-refresh',
        command: () => this.actualizarDatos(),
        tooltipOptions: { tooltipLabel: 'Actualizar datos' },
      },
      {
        icon: 'pi pi-download',
        command: () => this.exportarPrincipal(),
        tooltipOptions: { tooltipLabel: 'Exportar reporte' },
      },
      {
        icon: 'pi pi-chart-line',
        command: () => this.abrirGraficoTendencias(),
        tooltipOptions: { tooltipLabel: 'Ver gráficos' },
      },
      {
        icon: 'pi pi-cog',
        command: () => this.abrirConfiguracion(),
        tooltipOptions: { tooltipLabel: 'Configuración' },
      },
    ];

    this.menuAcciones = [
      {
        label: 'Actualizar',
        icon: 'pi pi-refresh',
        command: () => this.actualizarDatos(),
      },
      {
        label: 'Exportar',
        icon: 'pi pi-download',
        items: [
          {
            label: 'Excel',
            icon: 'pi pi-file-excel',
            command: () => this.exportarVentas('excel'),
          },
          {
            label: 'PDF',
            icon: 'pi pi-file-pdf',
            command: () => this.exportarVentas('pdf'),
          },
          {
            label: 'CSV',
            icon: 'pi pi-file',
            command: () => this.exportarVentas('csv'),
          },
        ],
      },
    ];

    this.opcionesExportacion = [
      {
        label: '📅 Por Período',
        items: [
          {
            label: 'Hoy - Excel',
            icon: 'pi pi-file-excel',
            command: () => this.exportarPorPeriodo('hoy'),
          },
          {
            label: 'Hoy - CSV',
            icon: 'pi pi-file',
            command: () => this.exportarCSVPorPeriodo('hoy'),
          },
          {
            label: 'Hoy - PDF',
            icon: 'pi pi-file-pdf',
            command: () => this.exportarPDFPorPeriodo('hoy'),
          },
          { separator: true },
          {
            label: 'Esta Semana - Excel',
            icon: 'pi pi-file-excel',
            command: () => this.exportarPorPeriodo('semana'),
          },
          {
            label: 'Esta Semana - CSV',
            icon: 'pi pi-file',
            command: () => this.exportarCSVPorPeriodo('semana'),
          },
          {
            label: 'Esta Semana - PDF',
            icon: 'pi pi-file-pdf',
            command: () => this.exportarPDFPorPeriodo('semana'),
          },
          { separator: true },
          {
            label: 'Este Mes - Excel',
            icon: 'pi pi-file-excel',
            command: () => this.exportarPorPeriodo('mes'),
          },
          {
            label: 'Este Mes - CSV',
            icon: 'pi pi-file',
            command: () => this.exportarCSVPorPeriodo('mes'),
          },
          {
            label: 'Este Mes - PDF',
            icon: 'pi pi-file-pdf',
            command: () => this.exportarPDFPorPeriodo('mes'),
          },
        ],
      },
      { separator: true },
      {
        label: '📊 Todas las Ventas',
        items: [
          {
            label: 'Excel Completo',
            icon: 'pi pi-file-excel',
            command: () => this.exportarExcelModerno(),
          },
          {
            label: 'CSV Completo',
            icon: 'pi pi-file',
            command: () => this.exportarCSVPorPeriodo('todas'),
          },
          {
            label: 'PDF Completo',
            icon: 'pi pi-file-pdf',
            command: () => this.exportarPDFPorPeriodo('todas'),
          },
        ],
      },
    ];

    this.menuContextual = [
      {
        label: 'Ver Detalle',
        icon: 'pi pi-eye',
        command: () => this.verDetalleVenta(this.ventaSeleccionada!),
      },
      {
        label: 'Imprimir',
        icon: 'pi pi-print',
        command: () => this.imprimirComprobante(this.ventaSeleccionada!),
      },
      {
        separator: true,
      },
      {
        label: 'Anular Venta',
        icon: 'pi pi-ban',
        command: () => this.confirmarAnulacion(this.ventaSeleccionada!),
        disabled: this.ventaSeleccionada?.estado !== 'COMPLETADA',
      },
    ];
  }

  private configurarGraficos(): void {
    this.opcionesGrafico = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          display: false,
        },
        y: {
          display: false,
        },
      },
    };

    this.datosGraficoTendencia = {
      labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
      datasets: [
        {
          data: [12, 19, 3, 5, 2, 3, 9],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true,
        },
      ],
    };
  }

  private inicializarFiltros(): void {
    this.filtros = {
      fechaDesde: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 días
      fechaHasta: new Date(),
      estados: [],
      metodosPago: [],
      montoMinimo: 0,
      montoMaximo: 50000,
    };
  }

  // ✅ CARGA DE DATOS
  cargarVentas(evento?: LazyLoadEvent): void {
    this.cargandoVentas = true;

    console.log('📊 Cargando ventas desde API...', evento);

    // Construir filtros para la API
    const filtrosApi = {
      fechaDesde: this.rangoFechas[0],
      fechaHasta: this.rangoFechas[1],
      estado:
        this.estadosSeleccionados.length === 1
          ? this.estadosSeleccionados[0]
          : undefined,
      termino: this.busquedaRapida || undefined,
    };

    // Llamar al servicio real
    this.ventasService
      .obtenerVentas(filtrosApi)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.ventas = data.map((venta) => ({
            id: venta.id,
            numeroVenta: venta.numeroVenta,
            fechaVenta: new Date(venta.fechaCreacion),
            cliente: venta.cliente
              ? {
                  id: venta.cliente.id,
                  nombres: venta.cliente.nombres,
                  apellidos: venta.cliente.apellidos,
                  dni: venta.cliente.documento,
                  ruc: venta.cliente.documento,
                  email: '',
                  telefono: '',
                  calificacion: 0,
                }
              : undefined,
            usuario: venta.usuario
              ? {
                  id: venta.usuario.id,
                  nombres: venta.usuario.nombre,
                  apellidos: '',
                  email: '',
                }
              : undefined,
            total: venta.total,
            subtotal: venta.subtotal,
            estado: venta.estado as EstadoVenta,
            tipoComprobante: venta.tipoComprobante,
            serieComprobante: venta.serieComprobante,
            pago: undefined,
            detalles: [],
            observaciones: venta.observaciones,
          }));

          this.aplicarFiltrosYOrdenamiento();
          this.cargandoVentas = false;

          this.messageService.add({
            severity: 'success',
            summary: '✅ Datos Cargados',
            detail: `${this.ventasFiltradas.length} ventas encontradas`,
            life: 3000,
          });
        },
        error: (error) => {
          console.error('❌ [API ERROR] Error al cargar ventas:', error);
          this.cargandoVentas = false;

          // Inicializar con arrays vacíos en caso de error
          this.ventas = [];
          this.ventasFiltradas = [];
          this.ventasPaginadas = [];

          this.messageService.add({
            severity: 'error',
            summary: '❌ Error',
            detail: `No se pudieron cargar las ventas: ${error.message || 'Error del servidor'}`,
            life: 5000,
          });
        },
      });
  }

  private procesarVentasAPI(data: VentaResponse[]): void {
    console.log(
      '🔄 [MAPEO] Procesando ventas del API con estructura correcta...',
    );

    try {
      this.ventas = data.map((venta, index) => {
        if (index < 3) {
          console.log(`📝 [MAPEO ${index}] Estructura de venta:`, venta);
        }

        // ✅ MAPEO CORRECTO según tu API real
        const ventaMapeada: Venta = {
          id: venta.id,
          numeroVenta: venta.numeroVenta,
          fechaVenta: new Date(venta.fechaCreacion),

          // Cliente con estructura correcta
          cliente: venta.cliente
            ? {
                id: venta.cliente.id,
                nombres: venta.cliente.nombres,
                apellidos: venta.cliente.apellidos,
                dni: venta.cliente.documento,
                ruc: venta.cliente.documento,
                email: '',
                telefono: '',
                calificacion: Math.floor(Math.random() * 5) + 1, // Temporal hasta que tengas este dato
              }
            : {
                id: 0,
                nombres: 'Público',
                apellidos: 'General',
                dni: '',
                calificacion: 0,
              },

          // Usuario con estructura correcta
          usuario: venta.usuario
            ? {
                id: venta.usuario.id,
                nombres: venta.usuario.nombre,
                apellidos: venta.usuario.username,
                email: `${venta.usuario.username}@sistema.com`,
              }
            : {
                id: 1,
                nombres: 'Emerson147',
                apellidos: 'Sistema',
                email: 'emerson147@sistema.com',
              },

          // Montos
          total: venta.total,
          subtotal: venta.subtotal,

          // Estado y comprobante
          estado: this.mapearEstado(venta.estado),
          tipoComprobante: venta.tipoComprobante,
          serieComprobante: venta.serieComprobante,

          // Pago (asumir efectivo por defecto, puedes agregar lógica específica)
          pago: {
            id: venta.id,
            metodoPago: this.determinarMetodoPago(),
            monto: venta.total,
          },

          // Detalles mapeados correctamente
          detalles:
            venta.detalles?.map((detalle) => ({
              id: detalle.id,
              producto: {
                id: detalle.producto.id,
                nombre: detalle.producto.nombre,
                codigo: detalle.producto.codigo,
              },
              cantidad: detalle.cantidad,
              precioUnitario: detalle.precioUnitario,
              subtotal: detalle.subtotal,
            })) || [],

          observaciones: venta.observaciones || '',
        };

        return ventaMapeada;
      });

      console.log('✅ [MAPEO] Ventas procesadas correctamente:', {
        total: this.ventas.length,
        primeraVenta: this.ventas[0],
        estructura: 'Mapeado según API real',
      });

      this.aplicarFiltrosYOrdenamiento();
      this.cargandoVentas = false;

      this.messageService.add({
        severity: 'success',
        summary: '✅ Ventas Cargadas',
        detail: `${this.ventas.length} ventas cargadas desde la base de datos`,
        life: 3000,
      });
    } catch (error) {
      console.error('❌ [MAPEO ERROR] Error al procesar ventas:', error);
      this.cargandoVentas = false;
      this.ventas = [];
      this.ventasFiltradas = [];
      this.ventasPaginadas = [];

      this.messageService.add({
        severity: 'error',
        summary: '❌ Error de Mapeo',
        detail: 'Error al procesar los datos del servidor',
        life: 5000,
      });
    }
  }

  private cargarEstadisticas(): void {
    this.ventasService
      .obtenerResumenDiario()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resumen) => {
          // ✅ MAPEO CORREGIDO según la estructura real del API
          this.estadisticas = {
            ventasHoy: resumen.cantidadVentas || 0, // Usar cantidadVentas, no totalVentas
            totalVentasHoy: resumen.totalVentas || 0, // Usar totalVentas
            clientesUnicos: resumen.clientesUnicos || 0,
            clientesNuevos: resumen.clientesNuevos || 0,
            productosVendidos: resumen.cantidadProductos || 0, // Usar cantidadProductos
            tiposProductos:
              resumen.tiposProductos || resumen.cantidadProductos || 0,
            porcentajeCrecimiento: resumen.porcentajeCrecimiento || 0,
            promedioVenta:
              resumen.totalVentas && resumen.cantidadVentas
                ? resumen.totalVentas / resumen.cantidadVentas
                : 0,
            metaDiaria: 10000,
          };

          // Actualizar progreso de meta
          this.progresoMeta = Math.min(
            100,
            Math.round(
              (this.estadisticas.totalVentasHoy /
                this.estadisticas.metaDiaria) *
                100,
            ),
          );

          // Generar datos complementarios desde el API
          this.generarDatosComplementariosDesdeAPI();

          this.messageService.add({
            severity: 'success',
            summary: '📊 Estadísticas Cargadas',
            detail: `${this.estadisticas.ventasHoy} ventas hoy - S/ ${this.estadisticas.totalVentasHoy}`,
            life: 4000,
          });
        },
        error: (error) => {
          console.error('❌ [ESTADISTICAS ERROR]:', error);
          this.cargarEstadisticasPorDefecto();

          this.messageService.add({
            severity: 'warn',
            summary: '⚠️ Estadísticas Offline',
            detail: 'Mostrando estadísticas de ejemplo',
            life: 3000,
          });
        },
      });
  }

  private generarDatosComplementariosDesdeAPI(): void {
    // Generar distribución de pagos por defecto ya que ResumenDiarioResponse no incluye esta info
    this.distribucionPagos = [
      { nombre: 'Efectivo', cantidad: 25, porcentaje: 55, color: '#10b981' },
      { nombre: 'Tarjeta', cantidad: 15, porcentaje: 33, color: '#3b82f6' },
      { nombre: 'Digital', cantidad: 5, porcentaje: 12, color: '#8b5cf6' },
    ];

    // Top productos por defecto ya que ResumenDiarioResponse no incluye esta info
    this.topProductos = [
      { nombre: 'Producto A', cantidad: 25 },
      { nombre: 'Producto B', cantidad: 18 },
      { nombre: 'Producto C', cantidad: 12 },
    ];

    // Actividad reciente
    this.actividadReciente = [
      {
        titulo: 'Resumen actualizado',
        descripcion: `${this.estadisticas.ventasHoy} ventas registradas hoy`,
        tiempo: 'hace 1 min',
      },
      {
        titulo: 'Total del día',
        descripcion: `S/ ${this.estadisticas.totalVentasHoy.toFixed(2)} en ventas`,
        tiempo: 'hace 2 min',
      },
      {
        titulo: 'Sistema activo',
        descripcion: 'Conexión con API establecida',
        tiempo: 'hace 3 min',
      },
    ];
  }

  private cargarEstadisticasPorDefecto(): void {
    this.estadisticas = {
      ventasHoy: 12,
      totalVentasHoy: 2450.75,
      clientesUnicos: 8,
      clientesNuevos: 3,
      productosVendidos: 25,
      tiposProductos: 15,
      porcentajeCrecimiento: 15.2,
      promedioVenta: 204.23,
      metaDiaria: 10000,
    };

    this.progresoMeta = Math.min(
      100,
      Math.round(
        (this.estadisticas.totalVentasHoy / this.estadisticas.metaDiaria) * 100,
      ),
    );

    this.generarDatosComplementarios();
  }

  private generarDatosComplementarios(): void {
    this.distribucionPagos = [
      { nombre: 'Efectivo', cantidad: 25, porcentaje: 55, color: '#10b981' },
      { nombre: 'Tarjeta', cantidad: 15, porcentaje: 33, color: '#3b82f6' },
      { nombre: 'Digital', cantidad: 5, porcentaje: 12, color: '#8b5cf6' },
    ];

    this.topProductos = [
      { nombre: 'Producto A', cantidad: 25 },
      { nombre: 'Producto B', cantidad: 18 },
      { nombre: 'Producto C', cantidad: 12 },
    ];

    this.actividadReciente = [
      {
        titulo: 'Venta completada',
        descripcion: 'V-2024-001234 - S/ 125.50',
        tiempo: 'hace 2 min',
      },
      {
        titulo: 'Cliente nuevo',
        descripcion: 'Juan Pérez registrado',
        tiempo: 'hace 5 min',
      },
      {
        titulo: 'Pago procesado',
        descripcion: 'Tarjeta terminada en 1234',
        tiempo: 'hace 8 min',
      },
    ];
  }

  private cargarDatosGraficos(): void {
    // TODO: Implementar carga real de datos para gráficos
    this.datosGraficoTendencia = {
      labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
      datasets: [
        {
          data: [1200, 1900, 800, 1500, 2200, 1800, 2400],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true,
        },
      ],
    };
  }

  // ✅ FILTRADO Y BÚSQUEDA
  filtrarVentas(): void {
    console.log('🔍 [FILTROS] Aplicando filtros...', {
      totalVentas: this.ventas.length,
      busquedaRapida: this.busquedaRapida,
      estadosSeleccionados: this.estadosSeleccionados,
      metodosSeleccionados: this.metodosSeleccionados,
      rangoMonto: this.rangoMonto,
      fechaDesde: this.filtros.fechaDesde,
      fechaHasta: this.filtros.fechaHasta,
    });

    this.ventasFiltradas = this.ventas.filter((venta) => {
      // Filtro por búsqueda rápida
      if (this.busquedaRapida) {
        const busqueda = this.busquedaRapida.toLowerCase();
        const coincide =
          venta.numeroVenta.toLowerCase().includes(busqueda) ||
          (venta.cliente?.nombres + ' ' + venta.cliente?.apellidos)
            .toLowerCase()
            .includes(busqueda) ||
          venta.cliente?.dni?.includes(busqueda) ||
          venta.cliente?.ruc?.includes(busqueda);

        if (!coincide) return false;
      }

      // Filtro por fechas - Comparación mejorada
      if (this.filtros.fechaDesde || this.filtros.fechaHasta) {
        const fechaVenta = new Date(venta.fechaVenta);

        if (this.filtros.fechaDesde) {
          const fechaDesde = new Date(this.filtros.fechaDesde);
          if (fechaVenta < fechaDesde) return false;
        }

        if (this.filtros.fechaHasta) {
          const fechaHasta = new Date(this.filtros.fechaHasta);
          if (fechaVenta > fechaHasta) return false;
        }
      }

      // Filtro por estados
      if (
        this.estadosSeleccionados.length > 0 &&
        !this.estadosSeleccionados.includes(venta.estado)
      ) {
        return false;
      }

      // Filtro por métodos de pago
      if (
        this.metodosSeleccionados.length > 0 &&
        venta.pago?.metodoPago &&
        !this.metodosSeleccionados.includes(venta.pago.metodoPago)
      ) {
        return false;
      }

      // Filtro por rango de monto
      if (
        venta.total < this.rangoMonto[0] ||
        venta.total > this.rangoMonto[1]
      ) {
        return false;
      }

      return true;
    });

    this.ordenarVentas();
    this.actualizarPaginacion();

    console.log('✅ [FILTROS] Filtrado completado:', {
      ventasFiltradas: this.ventasFiltradas.length,
      ventasPaginadas: this.ventasPaginadas.length,
      paginaActual: this.paginaActual,
      totalPaginas: this.totalPaginas,
    });
  }

  buscarSugerencias(evento: EventoAutoComplete): void {
    const query = evento.query.toLowerCase();

    // TODO: Implementar búsqueda real en el backend
    this.sugerenciasBusqueda = [
      { label: 'V-2024-001234', tipo: 'Venta', icon: 'pi pi-receipt' },
      { label: 'Juan Pérez', tipo: 'Cliente', icon: 'pi pi-user' },
      { label: 'Producto ABC', tipo: 'Producto', icon: 'pi pi-box' },
    ].filter((item) => item.label.toLowerCase().includes(query));
  }

  seleccionarSugerencia(evento: AutoCompleteSelectEvent): void {
    this.busquedaRapida = evento.value?.label || '';
    this.filtrarVentas();
  }

  filtrarPorPeriodo(periodo: string): void {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Resetear a inicio del día

    const finHoy = new Date();
    finHoy.setHours(23, 59, 59, 999); // Fin del día actual

    const ayer = new Date(hoy);
    ayer.setDate(hoy.getDate() - 1);

    const finAyer = new Date(ayer);
    finAyer.setHours(23, 59, 59, 999);

    // Actualizar el período seleccionado
    this.periodoSeleccionado = periodo;

    switch (periodo) {
      case 'hoy':
        this.rangoFechas = [hoy, finHoy];
        break;
      case 'ayer':
        this.rangoFechas = [ayer, finAyer];
        break;
      case 'semana': {
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(hoy.getDate() - hoy.getDay());
        inicioSemana.setHours(0, 0, 0, 0);
        this.rangoFechas = [inicioSemana, finHoy];
        break;
      }
      case 'mes': {
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        inicioMes.setHours(0, 0, 0, 0);
        this.rangoFechas = [inicioMes, finHoy];
        break;
      }
    }

    this.filtros.fechaDesde = this.rangoFechas[0];
    this.filtros.fechaHasta = this.rangoFechas[1];

    console.log('📅 [PERIODO] Filtro aplicado:', {
      periodo,
      fechaDesde: this.filtros.fechaDesde,
      fechaHasta: this.filtros.fechaHasta,
      totalVentas: this.ventas.length,
    });

    this.filtrarVentas();

    // Actualizar el período seleccionado
    this.periodoSeleccionado = periodo;

    this.messageService.add({
      severity: 'info',
      summary: '📅 Filtro Aplicado',
      detail: `Mostrando ventas de: ${periodo}`,
      life: 3000,
    });
  }

  limpiarFiltrosPeriodo(): void {
    this.periodoSeleccionado = 'todos';
    // Mantener fechas personalizadas si las hay
    this.filtrarVentas();

    this.messageService.add({
      severity: 'info',
      summary: '🔄 Filtro Removido',
      detail: 'Mostrando todas las ventas sin filtro de período',
      life: 3000,
    });
  }

  // ✅ MÉTODOS DE EXPORTACIÓN MEJORADOS
  exportarExcel(): void {
    this.exportarExcelModerno();
  }

  exportarCSVPorPeriodo(periodo: string): void {
    const ventasPeriodo = this.obtenerVentasPorPeriodo(periodo);
    this.generarCSV(
      ventasPeriodo,
      `ventas_${periodo}_${new Date().toISOString().slice(0, 10)}`,
    );
  }

  exportarPDFPorPeriodo(periodo: string): void {
    const ventasPeriodo = this.obtenerVentasPorPeriodo(periodo);
    this.exportarPDFPersonalizado(
      ventasPeriodo,
      `Reporte de Ventas - ${this.obtenerDescripcionPeriodo(periodo).toUpperCase()}`,
    );
  }

  private obtenerVentasPorPeriodo(periodo: string): Venta[] {
    if (periodo === 'todas') {
      return this.ventasFiltradas;
    }

    const { fechaInicio, fechaFin } = this.calcularRangoFechas(
      periodo as 'hoy' | 'ayer' | 'semana' | 'mes',
    );

    return this.ventasFiltradas.filter((venta) => {
      const fechaVenta = new Date(venta.fechaVenta);
      return fechaVenta >= fechaInicio && fechaVenta <= fechaFin;
    });
  }

  private obtenerDescripcionPeriodo(periodo: string): string {
    switch (periodo) {
      case 'hoy':
        return 'de hoy';
      case 'ayer':
        return 'de ayer';
      case 'semana':
        return 'de esta semana';
      case 'mes':
        return 'de este mes';
      case 'todas':
        return 'completo';
      default:
        return 'filtradas';
    }
  }

  private generarCSV(ventas: Venta[], nombreArchivo: string): void {
    const headers = [
      'Fecha',
      'Nº Venta',
      'Cliente',
      'Total',
      'Estado',
      'Método Pago',
    ];
    const csvContent = [
      headers.join(','),
      ...ventas.map((venta) =>
        [
          new Date(venta.fechaVenta).toLocaleDateString(),
          venta.numeroVenta,
          `"${venta.cliente?.nombres || 'Sin cliente'} ${venta.cliente?.apellidos || ''}"`,
          venta.total.toString(),
          venta.estado,
          venta.pago?.metodoPago || 'N/A',
        ].join(','),
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${nombreArchivo}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.messageService.add({
      severity: 'success',
      summary: '📄 CSV Generado',
      detail: `Archivo ${nombreArchivo}.csv descargado exitosamente`,
      life: 4000,
    });
  }

  private exportarPDFPersonalizado(ventas: Venta[], titulo: string): void {
    // Aquí iría la lógica de generación de PDF
    console.log('🔴 Generando PDF:', titulo, ventas.length, 'ventas');

    this.messageService.add({
      severity: 'info',
      summary: '📄 PDF en Desarrollo',
      detail: 'Funcionalidad de PDF será implementada próximamente',
      life: 4000,
    });
  }

  limpiarFiltros(): void {
    this.busquedaRapida = '';
    this.estadosSeleccionados = [];
    this.metodosSeleccionados = [];
    this.usuariosSeleccionados = [];
    this.metodoPagoSeleccionado = null;
    this.calificacionMinima = 0;
    this.rangoMonto = [0, 10000];
    this.filtrosRapidos = [];

    this.inicializarFiltros();
    this.filtrarVentas();

    this.messageService.add({
      severity: 'success',
      summary: '🧹 Filtros Limpiados',
      detail: 'Todos los filtros han sido restablecidos',
      life: 3000,
    });
  }

  aplicarFiltros(): void {
    this.filtros = {
      busqueda: this.busquedaRapida,
      fechaDesde: this.rangoFechas[0],
      fechaHasta: this.rangoFechas[1],
      estados: this.estadosSeleccionados,
      metodosPago: this.metodosSeleccionados,
      montoMinimo: this.rangoMonto[0],
      montoMaximo: this.rangoMonto[1],
      usuarios: this.usuariosSeleccionados,
      calificacionMinima: this.calificacionMinima,
    };

    this.filtrarVentas();

    this.messageService.add({
      severity: 'success',
      summary: '✅ Filtros Aplicados',
      detail: `${this.ventasFiltradas.length} ventas encontradas`,
      life: 3000,
    });
  }

  /**
   * Evento cuando cambia el rango de fechas en el calendario
   */
  onRangoFechasChange(): void {
    if (this.rangoFechas && this.rangoFechas.length === 2) {
      // Asegurar que las fechas tengan el rango completo del día
      const fechaInicio = new Date(this.rangoFechas[0]);
      fechaInicio.setHours(0, 0, 0, 0);

      const fechaFin = new Date(this.rangoFechas[1]);
      fechaFin.setHours(23, 59, 59, 999);

      this.filtros.fechaDesde = fechaInicio;
      this.filtros.fechaHasta = fechaFin;
      this.filtrarVentas();

      this.messageService.add({
        severity: 'info',
        summary: '📅 Rango de Fechas',
        detail: 'Filtro de fechas aplicado',
        life: 2000,
      });
    }
  }

  /**
   * Limpia el rango de fechas seleccionado
   */
  onLimpiarRangoFechas(): void {
    this.rangoFechas = [];
    this.filtros.fechaDesde = undefined;
    this.filtros.fechaHasta = undefined;
    this.filtrarVentas();

    this.messageService.add({
      severity: 'info',
      summary: '🗑️ Fechas Limpiadas',
      detail: 'Filtro de fechas eliminado',
      life: 2000,
    });
  }

  // ✅ ORDENAMIENTO
  ordenarVentas(): void {
    console.log('🔄 [ORDENAMIENTO] Ordenando ventas por:', this.ordenarPor);

    this.ventasFiltradas.sort((a, b) => {
      let valorA: string | number | Date, valorB: string | number | Date;

      switch (this.ordenarPor) {
        case 'fecha_desc':
          valorA = new Date(a.fechaVenta).getTime();
          valorB = new Date(b.fechaVenta).getTime();
          return valorB - valorA;
        case 'fecha_asc':
          valorA = new Date(a.fechaVenta).getTime();
          valorB = new Date(b.fechaVenta).getTime();
          return valorA - valorB;
        case 'monto_desc':
          return b.total - a.total;
        case 'monto_asc':
          return a.total - b.total;
        case 'cliente':
          valorA = (a.cliente?.nombres || '').toLowerCase();
          valorB = (b.cliente?.nombres || '').toLowerCase();
          return valorA.localeCompare(valorB);
        case 'numero':
          return a.numeroVenta.localeCompare(b.numeroVenta);
        default:
          return 0;
      }
    });

    this.actualizarPaginacion();
    console.log('✅ [ORDENAMIENTO] Ventas ordenadas correctamente');
  }

  // ✅ PAGINACIÓN
  private actualizarPaginacion(): void {
    console.log('🔄 [PAGINACION] Actualizando paginación...');

    this.totalVentas = this.ventasFiltradas.length;
    this.totalPaginas = Math.ceil(this.totalVentas / this.ventasPorPagina);

    const inicio = (this.paginaActual - 1) * this.ventasPorPagina;
    const fin = inicio + this.ventasPorPagina;

    this.ventasPaginadas = this.ventasFiltradas.slice(inicio, fin);

    console.log('✅ [PAGINACION] Paginación actualizada:', {
      totalVentas: this.totalVentas,
      totalPaginas: this.totalPaginas,
      paginaActual: this.paginaActual,
      ventasPorPagina: this.ventasPorPagina,
      ventasPaginadas: this.ventasPaginadas.length,
    });
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      this.actualizarPaginacion();
    }
  }

  cambiarVentasPorPagina(): void {
    this.paginaActual = 1;
    this.actualizarPaginacion();
  }

  get paginasVisibles(): number[] {
    const paginas: number[] = [];
    const inicio = Math.max(1, this.paginaActual - 2);
    const fin = Math.min(this.totalPaginas, this.paginaActual + 2);

    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }

    return paginas;
  }

  // ✅ ACCIONES DE VENTA
  verDetalleVenta(venta: Venta): void {
    console.log('👁️ Ver detalle de venta:', venta);
    this.ventaSeleccionada = venta;
    this.mostrarDetalleDialog = true;
  }

  cerrarDetalleDialog(): void {
    this.mostrarDetalleDialog = false;
    this.ventaSeleccionada = null;
  }

  imprimirComprobante(venta: Venta): void {
    console.log('🖨️ Imprimir comprobante:', venta);

    if (!venta?.id) {
      this.messageService.add({
        severity: 'error',
        summary: '❌ Error',
        detail: 'No se puede imprimir: Venta inválida',
        life: 4000,
      });
      return;
    }

    // Mostrar opciones de impresión
    this.mostrarOpcionesImpresion(venta);
  }

  /**
   * Muestra opciones de impresión al usuario
   */
  private mostrarOpcionesImpresion(venta: Venta): void {
    this.confirmationService.confirm({
      header: '🖨️ Opciones de Impresión',
      message: `¿Cómo deseas imprimir el comprobante de la venta ${venta.numeroVenta}?`,
      icon: 'pi pi-print',
      acceptLabel: '📄 Descargar PDF',
      rejectLabel: '🎫 Ticket',
      acceptButtonStyleClass: 'p-button-success p-button-sm',
      rejectButtonStyleClass: 'p-button-secondary p-button-sm',
      accept: () => {
        this.imprimirSoloPDF(venta);
      },
      reject: () => {
        this.imprimirSoloTicket(venta);
      },
    });
  }

  /**
   * Imprime en ticketera Y descarga PDF automáticamente
   */
  private imprimirTicketYPDF(venta: Venta): void {
    this.messageService.add({
      severity: 'info',
      summary: '⏳ Procesando',
      detail: 'Imprimiendo ticket y generando PDF...',
      life: 3000,
    });

    // Ejecutar ambas operaciones en paralelo
    // Ticket directo desde venta, PDF requiere comprobante
    Promise.all([
      this.enviarTicketDesdeVenta(venta.id, venta.numeroVenta),
      this.asegurarComprobante(venta).then((comprobante) =>
        this.descargarPDFComprobante(comprobante.id, venta.numeroVenta),
      ),
    ])
      .then((resultados) => {
        const [ticketResult, pdfResult] = resultados;

        // Mostrar resultado combinado
        if (ticketResult && pdfResult) {
          this.messageService.add({
            severity: 'success',
            summary: '✅ Impresión Completa',
            detail: `Ticket enviado a ticketera y PDF descargado para venta ${venta.numeroVenta}`,
            life: 5000,
          });
        } else {
          this.messageService.add({
            severity: 'warn',
            summary: '⚠️ Parcialmente Completado',
            detail: `${ticketResult ? 'Ticket enviado' : 'Error en ticket'} - ${pdfResult ? 'PDF descargado' : 'Error en PDF'}`,
            life: 4000,
          });
        }
      })
      .catch((error) => {
        console.error('❌ Error en impresión dual:', error);
        this.messageService.add({
          severity: 'error',
          summary: '❌ Error en Impresión',
          detail: error.message || 'Ocurrió un error durante la impresión',
          life: 4000,
        });
      });
  }

  /**
   * Solo descarga PDF (opción alternativa)
   */
  private imprimirSoloPDF(venta: Venta): void {
    this.messageService.add({
      severity: 'info',
      summary: '📄 Generando PDF',
      detail: 'Preparando comprobante PDF...',
      life: 2000,
    });

    this.asegurarComprobante(venta)
      .then((comprobante) => {
        this.descargarPDFComprobante(comprobante.id, venta.numeroVenta).then(
          (exito) => {
            if (exito) {
              this.messageService.add({
                severity: 'success',
                summary: '📄 PDF Descargado',
                detail: `Comprobante PDF de venta ${venta.numeroVenta} descargado`,
                life: 4000,
              });
            }
          },
        );
      })
      .catch((error) => {
        console.error('❌ Error generando PDF:', error);
        this.messageService.add({
          severity: 'error',
          summary: '❌ Error',
          detail: 'No se pudo generar el PDF',
          life: 4000,
        });
      });
  }

  /**
   * Solo imprime ticket en ticketera
   */
  private imprimirSoloTicket(venta: Venta): void {
    this.messageService.add({
      severity: 'info',
      summary: '🎫 Imprimiendo Ticket',
      detail: 'Enviando a ticketera...',
      life: 2000,
    });

    this.enviarTicketDesdeVenta(venta.id, venta.numeroVenta)
      .then((exito) => {
        if (exito) {
          this.messageService.add({
            severity: 'success',
            summary: '✅ Ticket Enviado',
            detail: `Ticket de venta ${venta.numeroVenta} enviado a ticketera`,
            life: 4000,
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: '❌ Error',
            detail: 'No se pudo imprimir el ticket',
            life: 4000,
          });
        }
      })
      .catch((error) => {
        console.error('❌ Error imprimiendo ticket:', error);
        this.messageService.add({
          severity: 'error',
          summary: '❌ Error',
          detail: 'Error al enviar ticket a ticketera',
          life: 4000,
        });
      });
  }

  /**
   * Asegura que existe un comprobante para la venta (lo genera si no existe)
   */
  private async asegurarComprobante(venta: Venta): Promise<any> {
    return new Promise((resolve, reject) => {
      // Primero intentar obtener comprobante existente
      this.comprobantesService.obtenerComprobantePorVenta(venta.id).subscribe({
        next: (comprobante: any) => {
          console.log(
            `✅ Usando comprobante existente ID: ${comprobante.id} para venta ${venta.numeroVenta}`,
          );
          resolve(comprobante);
        },
        error: (error: any) => {
          // Verificar si es un error 404 (comprobante no encontrado)
          const esError404 =
            error.status === 404 ||
            error?.message?.includes('no encontrado') ||
            error?.message?.includes('404');

          if (esError404) {
            console.log(
              `� Generando comprobante automáticamente para venta ${venta.numeroVenta}...`,
            );
            // Generar comprobante nuevo
            this.generarComprobanteCompleto(venta).then(resolve).catch(reject);
          } else {
            console.error('❌ Error inesperado obteniendo comprobante:', error);
            reject(error);
          }
        },
      });
    });
  }

  /**
   * Genera un comprobante completo (BOLETA o FACTURA según cliente)
   */
  private async generarComprobanteCompleto(venta: Venta): Promise<any> {
    return new Promise((resolve, reject) => {
      // Determinar tipo de comprobante según cliente
      const tipoDocumento =
        venta.cliente?.ruc && venta.cliente.ruc.length > 8
          ? 'FACTURA'
          : 'BOLETA';
      const serie = tipoDocumento === 'FACTURA' ? 'F001' : 'B001';

      const comprobanteRequest = {
        ventaId: venta.id,
        tipoDocumento: tipoDocumento as any,
        serie: serie,
        observaciones: `Comprobante generado para impresión - ${venta.numeroVenta}`,
      };

      this.comprobantesService
        .generarComprobante(comprobanteRequest)
        .subscribe({
          next: (comprobante: any) => {
            console.log(`✅ ${tipoDocumento} generado:`, comprobante.id);
            resolve(comprobante);
          },
          error: (error: any) => {
            console.error('❌ Error generando comprobante:', error);
            reject(error);
          },
        });
    });
  }

  /**
   * Envía ticket directo desde venta (sin necesidad de comprobante)
   */
  private async enviarTicketDesdeVenta(
    ventaId: number,
    numeroVenta: string,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      this.comprobantesService.imprimirTicketDesdeVenta(ventaId).subscribe({
        next: (response: any) => {
          if (response.success) {
            console.log('✅ Ticket enviado exitosamente desde venta');
            resolve(true);
          } else {
            console.warn('⚠️ Error en ticketera:', response.message);
            resolve(false);
          }
        },
        error: (error: any) => {
          console.error('❌ Error enviando ticket desde venta:', error);
          resolve(false);
        },
      });
    });
  }

  /**
   * Envía comprobante a la ticketera (retorna Promise)
   * @deprecated Usar enviarTicketDesdeVenta para imprimir directo desde venta
   */
  private async enviarATicketera(
    comprobanteId: number,
    numeroVenta: string,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      this.comprobantesService.imprimirEnTicketera(comprobanteId).subscribe({
        next: (response: any) => {
          if (response.success) {
            console.log('✅ Ticket enviado exitosamente');
            resolve(true);
          } else {
            console.warn('⚠️ Error en ticketera:', response.message);
            resolve(false);
          }
        },
        error: (error: any) => {
          console.error('❌ Error enviando a ticketera:', error);
          resolve(false);
        },
      });
    });
  }

  /**
   * Descarga PDF del comprobante (retorna Promise)
   */
  private async descargarPDFComprobante(
    comprobanteId: number,
    numeroVenta: string,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      this.comprobantesService.descargarPDF(comprobanteId).subscribe({
        next: (pdfBlob: any) => {
          // Crear enlace de descarga
          const url = window.URL.createObjectURL(pdfBlob);
          const enlace = document.createElement('a');
          enlace.href = url;
          enlace.download = `Comprobante_${numeroVenta}.pdf`;
          document.body.appendChild(enlace);
          enlace.click();
          document.body.removeChild(enlace);
          window.URL.revokeObjectURL(url);

          console.log('✅ PDF descargado exitosamente');
          resolve(true);
        },
        error: (error: any) => {
          console.error('❌ Error descargando PDF:', error);
          resolve(false);
        },
      });
    });
  }

  confirmarAnulacion(venta: Venta): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de anular la venta ${venta.numeroVenta}?`,
      header: 'Confirmar Anulación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Anular',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.anularVenta(venta);
      },
    });
  }

  anularVenta(venta: Venta): void {
    console.log('❌ Anular venta:', venta);

    // TODO: Implementar lógica de anulación
    venta.estado = 'ANULADA';

    this.messageService.add({
      severity: 'warn',
      summary: '❌ Venta Anulada',
      detail: `La venta ${venta.numeroVenta} ha sido anulada`,
      life: 5000,
    });
  }

  mostrarMenuContextual(evento: Event, venta: Venta): void {
    this.ventaSeleccionada = venta;
    this.contextMenu.show(evento);
  }

  // ✅ EXPORTACIÓN MODERNA A EXCEL

  /**
   * Exportar ventas por período de tiempo específico
   * @param periodo - Período a exportar: 'hoy', 'ayer', 'semana', 'mes'
   */
  exportarPorPeriodo(periodo: 'hoy' | 'ayer' | 'semana' | 'mes'): void {
    try {
      console.log(`📅 Exportando ventas del período: ${periodo}`);

      // Calcular rango de fechas según el período
      const { fechaInicio, fechaFin } = this.calcularRangoFechas(periodo);

      // Filtrar ventas por el período
      const ventasPeriodo = this.ventasFiltradas.filter((venta) => {
        const fechaVenta = new Date(venta.fechaVenta);
        return fechaVenta >= fechaInicio && fechaVenta <= fechaFin;
      });

      if (ventasPeriodo.length === 0) {
        this.messageService.add({
          severity: 'warn',
          summary: '⚠️ Sin Datos',
          detail: `No hay ventas ${this.obtenerDescripcionPeriodo(periodo)}`,
          life: 4000,
        });
        return;
      }

      this.messageService.add({
        severity: 'info',
        summary: '📊 Exportando',
        detail: `Generando reporte ${this.obtenerDescripcionPeriodo(periodo)}...`,
        life: 2000,
      });

      // Preparar datos para exportar
      const datosExportar =
        this.prepararDatosExportacionPorPeriodo(ventasPeriodo);

      // Crear archivo Excel con nombre personalizado
      this.crearArchivoExcelPeriodo(datosExportar, periodo);

      this.messageService.add({
        severity: 'success',
        summary: '✅ Exportación Exitosa',
        detail: `${ventasPeriodo.length} ventas ${this.obtenerDescripcionPeriodo(periodo)} exportadas`,
        life: 4000,
      });
    } catch (error) {
      console.error('❌ Error al exportar por período:', error);
      this.messageService.add({
        severity: 'error',
        summary: '❌ Error',
        detail: 'No se pudo exportar el archivo. Intenta nuevamente.',
        life: 4000,
      });
    }
  }

  /**
   * Calcular rango de fechas según el período
   */
  private calcularRangoFechas(periodo: 'hoy' | 'ayer' | 'semana' | 'mes'): {
    fechaInicio: Date;
    fechaFin: Date;
  } {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaFin = new Date();
    fechaFin.setHours(23, 59, 59, 999);

    let fechaInicio = new Date();

    switch (periodo) {
      case 'hoy':
        fechaInicio = new Date(hoy);
        break;

      case 'ayer':
        fechaInicio = new Date(hoy);
        fechaInicio.setDate(fechaInicio.getDate() - 1);
        fechaFin.setDate(fechaFin.getDate() - 1);
        fechaFin.setHours(23, 59, 59, 999);
        break;

      case 'semana':
        fechaInicio = new Date(hoy);
        const diaSemana = fechaInicio.getDay();
        const diferencia = diaSemana === 0 ? 6 : diaSemana - 1; // Lunes = 0
        fechaInicio.setDate(fechaInicio.getDate() - diferencia);
        break;

      case 'mes':
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        break;
    }

    return { fechaInicio, fechaFin };
  }

  /**
   * Obtener descripción del período para mensajes
   */

  /**
   * Preparar datos de ventas por período para exportación
   */
  private prepararDatosExportacionPorPeriodo(ventas: Venta[]): any[] {
    return ventas.map((venta) => ({
      'Número Venta': venta.numeroVenta || '',
      Fecha: this.formatearFechaExcel(venta.fechaVenta),
      Hora: this.formatearHoraExcel(venta.fechaVenta),
      Cliente:
        `${venta.cliente?.nombres || ''} ${venta.cliente?.apellidos || ''}`.trim() ||
        'Cliente General',
      'DNI/RUC': venta.cliente?.dni || venta.cliente?.ruc || 'S/N',
      Comprobante: `${venta.tipoComprobante} ${venta.serieComprobante}`,
      'Cantidad Productos': venta.detalles?.length || 0,
      'Método Pago': venta.pago?.metodoPago || 'EFECTIVO',
      Subtotal: venta.subtotal || 0,
      Total: venta.total || 0,
      Estado: venta.estado || 'PENDIENTE',
    }));
  }

  /**
   * Crear archivo Excel con nombre personalizado por período
   */
  private crearArchivoExcelPeriodo(datos: any[], periodo: string): void {
    if (datos.length === 0) {
      console.warn('⚠️ No hay datos para exportar');
      return;
    }

    // Crear hoja de cálculo
    const ws = this.crearHojaCalculo(datos);

    // Crear libro de trabajo
    const wb = {
      Sheets: { Ventas: ws },
      SheetNames: ['Ventas'],
    };

    // Generar buffer
    const buffer = this.generarBufferExcel(wb);

    // Descargar con nombre personalizado
    const nombreArchivo = this.generarNombreArchivoPeriodo(periodo);
    this.descargarExcel(buffer, nombreArchivo);
  }

  /**
   * Generar nombre de archivo con período
   */
  private generarNombreArchivoPeriodo(periodo: string): string {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const hora = String(fecha.getHours()).padStart(2, '0');
    const minutos = String(fecha.getMinutes()).padStart(2, '0');

    const periodoMayus = periodo.charAt(0).toUpperCase() + periodo.slice(1);

    return `Ventas_${periodoMayus}_${año}${mes}${dia}_${hora}${minutos}.csv`;
  }

  /**
   * Exportar a Excel moderno con formato profesional
   */
  exportarExcelModerno(): void {
    try {
      console.log('� Iniciando exportación a Excel...');

      this.messageService.add({
        severity: 'info',
        summary: '📊 Exportando',
        detail: 'Generando archivo Excel...',
        life: 2000,
      });

      // Preparar datos para exportar
      const datosExportar = this.prepararDatosExportacion();

      // Crear archivo Excel
      this.crearArchivoExcel(datosExportar);

      this.messageService.add({
        severity: 'success',
        summary: '✅ Exportación Exitosa',
        detail: `${datosExportar.length} ventas exportadas correctamente`,
        life: 4000,
      });
    } catch (error) {
      console.error('❌ Error al exportar:', error);
      this.messageService.add({
        severity: 'error',
        summary: '❌ Error',
        detail: 'No se pudo exportar el archivo. Intenta nuevamente.',
        life: 4000,
      });
    }
  }

  /**
   * Preparar datos para exportación
   */
  private prepararDatosExportacion(): any[] {
    return this.ventasFiltradas.map((venta) => ({
      'Número Venta': venta.numeroVenta || '',
      Fecha: this.formatearFechaExcel(venta.fechaVenta),
      Hora: this.formatearHoraExcel(venta.fechaVenta),
      Cliente:
        `${venta.cliente?.nombres || ''} ${venta.cliente?.apellidos || ''}`.trim() ||
        'Cliente General',
      'DNI/RUC': venta.cliente?.dni || venta.cliente?.ruc || 'S/N',
      Comprobante: `${venta.tipoComprobante} ${venta.serieComprobante}`,
      'Cantidad Productos': venta.detalles?.length || 0,
      'Método Pago': venta.pago?.metodoPago || 'EFECTIVO',
      Subtotal: venta.subtotal || 0,
      Total: venta.total || 0,
      Estado: venta.estado || 'PENDIENTE',
    }));
  }

  /**
   * Crear y descargar archivo Excel
   */
  private crearArchivoExcel(datos: any[]): void {
    // Crear un libro de trabajo
    const ws: any = this.crearHojaCalculo(datos);
    const wb: any = { Sheets: { Ventas: ws }, SheetNames: ['Ventas'] };

    // Generar archivo Excel
    const excelBuffer: any = this.generarBufferExcel(wb);

    // Descargar archivo
    this.descargarExcel(excelBuffer, this.generarNombreArchivo());
  }

  /**
   * Crear hoja de cálculo con formato
   */
  private crearHojaCalculo(datos: any[]): any {
    // Aquí usaremos una implementación simple
    // En producción, usarías una librería como xlsx

    const hoja: any = {};
    const headers = Object.keys(datos[0] || {});

    // Agregar encabezados
    headers.forEach((header, colIndex) => {
      const cellRef = this.obtenerReferenciaCelda(0, colIndex);
      hoja[cellRef] = { v: header, t: 's' };
    });

    // Agregar datos
    datos.forEach((fila, rowIndex) => {
      headers.forEach((header, colIndex) => {
        const cellRef = this.obtenerReferenciaCelda(rowIndex + 1, colIndex);
        const value = fila[header];

        // Determinar tipo de dato
        if (typeof value === 'number') {
          hoja[cellRef] = { v: value, t: 'n' };
        } else {
          hoja[cellRef] = { v: value, t: 's' };
        }
      });
    });

    // Definir rango
    hoja['!ref'] =
      `A1:${this.obtenerReferenciaCelda(datos.length, headers.length - 1)}`;

    return hoja;
  }

  /**
   * Generar buffer del archivo Excel
   */
  private generarBufferExcel(workbook: any): any {
    // Conversión simplificada a CSV para compatibilidad sin librería externa
    const hojaVentas = workbook.Sheets['Ventas'];
    const datos: string[][] = [];

    // Extraer rango
    const rango = hojaVentas['!ref'];
    if (!rango) return '';

    const [inicio, fin] = rango.split(':');
    const [, filaInicio] = this.parsearReferenciaCelda(inicio);
    const [, filaFin] = this.parsearReferenciaCelda(fin);

    // Obtener headers
    const headers: string[] = [];
    let colIndex = 0;
    while (true) {
      const cellRef = this.obtenerReferenciaCelda(0, colIndex);
      const cell = hojaVentas[cellRef];
      if (!cell) break;
      headers.push(cell.v);
      colIndex++;
    }

    // Construir CSV
    let csv = headers.join(',') + '\n';

    for (let row = filaInicio + 1; row <= filaFin; row++) {
      const fila: string[] = [];
      for (let col = 0; col < headers.length; col++) {
        const cellRef = this.obtenerReferenciaCelda(row, col);
        const cell = hojaVentas[cellRef];
        const value = cell ? cell.v : '';
        fila.push(`"${value}"`);
      }
      csv += fila.join(',') + '\n';
    }

    return csv;
  }

  /**
   * Descargar archivo Excel
   */
  private descargarExcel(buffer: any, nombreArchivo: string): void {
    const blob = new Blob([buffer], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', nombreArchivo.replace('.xlsx', '.csv'));
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Generar nombre de archivo con fecha
   */
  private generarNombreArchivo(): string {
    const fecha = new Date();
    const fechaFormateada = `${fecha.getFullYear()}${(fecha.getMonth() + 1).toString().padStart(2, '0')}${fecha.getDate().toString().padStart(2, '0')}`;
    const horaFormateada = `${fecha.getHours().toString().padStart(2, '0')}${fecha.getMinutes().toString().padStart(2, '0')}`;
    return `Ventas_${fechaFormateada}_${horaFormateada}.xlsx`;
  }

  /**
   * Obtener referencia de celda (A1, B2, etc.)
   */
  private obtenerReferenciaCelda(fila: number, columna: number): string {
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let col = '';
    let num = columna;

    while (num >= 0) {
      col = letras[num % 26] + col;
      num = Math.floor(num / 26) - 1;
    }

    return col + (fila + 1);
  }

  /**
   * Parsear referencia de celda
   */
  private parsearReferenciaCelda(ref: string): [number, number] {
    const match = ref.match(/^([A-Z]+)(\d+)$/);
    if (!match) return [0, 0];

    const colStr = match[1];
    const rowStr = match[2];

    let col = 0;
    for (let i = 0; i < colStr.length; i++) {
      col = col * 26 + colStr.charCodeAt(i) - 65 + 1;
    }

    return [col - 1, parseInt(rowStr) - 1];
  }

  /**
   * Formatear fecha para Excel
   */
  private formatearFechaExcel(fecha: Date | string): string {
    const f = new Date(fecha);
    return `${f.getDate().toString().padStart(2, '0')}/${(f.getMonth() + 1).toString().padStart(2, '0')}/${f.getFullYear()}`;
  }

  /**
   * Formatear hora para Excel
   */
  private formatearHoraExcel(fecha: Date | string): string {
    const f = new Date(fecha);
    return `${f.getHours().toString().padStart(2, '0')}:${f.getMinutes().toString().padStart(2, '0')}`;
  }

  /**
   * Exportar PDF con diseño moderno y profesional
   */
  exportarPDF(): void {
    try {
      console.log('📄 Iniciando exportación a PDF...');

      this.messageService.add({
        severity: 'info',
        summary: '📄 Generando PDF',
        detail: 'Creando documento profesional...',
        life: 2000,
      });

      const datos = this.prepararDatosExportacion();

      if (datos.length === 0) {
        this.messageService.add({
          severity: 'warn',
          summary: '⚠️ Sin Datos',
          detail: 'No hay ventas para exportar',
          life: 3000,
        });
        return;
      }

      this.generarPDFProfesional(datos);

      this.messageService.add({
        severity: 'success',
        summary: '✅ PDF Generado',
        detail: `Reporte de ${datos.length} ventas generado exitosamente`,
        life: 4000,
      });
    } catch (error) {
      console.error('❌ Error al generar PDF:', error);
      this.messageService.add({
        severity: 'error',
        summary: '❌ Error',
        detail: 'No se pudo generar el PDF. Intenta nuevamente.',
        life: 4000,
      });
    }
  }

  /**
   * Generar PDF con diseño profesional y moderno
   */
  private generarPDFProfesional(datos: any[]): void {
    // Crear documento PDF en formato A4 horizontal para mejor visualización
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // Colores del tema (moderno y profesional) - definidos como tuplas
    const colorPrimario: [number, number, number] = [41, 128, 185]; // Azul profesional
    const colorSecundario: [number, number, number] = [52, 73, 94]; // Azul oscuro
    const colorTexto: [number, number, number] = [44, 62, 80]; // Gris oscuro
    const colorFondo: [number, number, number] = [236, 240, 241]; // Gris claro

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // ============================================
    // ENCABEZADO PRINCIPAL
    // ============================================

    // Fondo del encabezado con degradado simulado
    doc.setFillColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.rect(0, 0, pageWidth, 35, 'F');

    // Línea decorativa inferior del encabezado
    doc.setFillColor(
      colorSecundario[0],
      colorSecundario[1],
      colorSecundario[2],
    );
    doc.rect(0, 35, pageWidth, 2, 'F');

    // Logo/Icono (simulado con texto)
    doc.setFillColor(255, 255, 255);
    doc.circle(20, 17.5, 8, 'F');
    doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('📊', 16, 21);

    // Título principal
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE VENTAS', 35, 15);

    // Subtítulo
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Gestión de Inventario', 35, 23);

    // Información de fecha y hora (derecha)
    const fechaActual = new Date();
    const fechaFormateada = fechaActual.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const horaFormateada = fechaActual.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
    });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${fechaFormateada}`, pageWidth - 15, 15, {
      align: 'right',
    });
    doc.text(`Hora: ${horaFormateada}`, pageWidth - 15, 21, { align: 'right' });
    doc.text(`Total Ventas: ${datos.length}`, pageWidth - 15, 27, {
      align: 'right',
    });

    // ============================================
    // INFORMACIÓN RESUMIDA (Tarjetas de métricas)
    // ============================================

    const yInicio = 42;
    const totalGeneral = datos.reduce(
      (sum, venta) => sum + (parseFloat(venta['Total']) || 0),
      0,
    );
    const promedioVenta = totalGeneral / datos.length;
    const ventasCompletadas = datos.filter(
      (v) => v['Estado'] === 'COMPLETADA',
    ).length;

    // Tarjeta 1: Total General
    this.dibujarTarjetaMetrica(
      doc,
      15,
      yInicio,
      'TOTAL GENERAL',
      `S/. ${totalGeneral.toFixed(2)}`,
      colorPrimario,
    );

    // Tarjeta 2: Promedio por Venta
    this.dibujarTarjetaMetrica(
      doc,
      90,
      yInicio,
      'PROMEDIO VENTA',
      `S/. ${promedioVenta.toFixed(2)}`,
      [46, 204, 113],
    );

    // Tarjeta 3: Ventas Completadas
    this.dibujarTarjetaMetrica(
      doc,
      165,
      yInicio,
      'COMPLETADAS',
      `${ventasCompletadas}/${datos.length}`,
      [52, 152, 219],
    );

    // Tarjeta 4: Período
    const periodoTexto = this.obtenerTextoPeriodo();
    this.dibujarTarjetaMetrica(
      doc,
      240,
      yInicio,
      'PERÍODO',
      periodoTexto,
      [155, 89, 182],
    );

    // ============================================
    // TABLA DE DATOS
    // ============================================

    const yTabla = yInicio + 30;

    // Preparar datos para la tabla
    const headers = Object.keys(datos[0]);
    const rows = datos.map((venta) =>
      Object.values(venta).map((v) => String(v)),
    );

    // Configurar autoTable con diseño moderno
    autoTable(doc, {
      startY: yTabla,
      head: [headers],
      body: rows,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
        font: 'helvetica',
        textColor: colorTexto,
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: colorSecundario,
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        cellPadding: 4,
      },
      alternateRowStyles: {
        fillColor: colorFondo,
      },
      columnStyles: {
        0: { cellWidth: 25, halign: 'left' }, // Número Venta
        1: { cellWidth: 22, halign: 'center' }, // Fecha
        2: { cellWidth: 18, halign: 'center' }, // Hora
        3: { cellWidth: 35, halign: 'left' }, // Cliente
        4: { cellWidth: 22, halign: 'center' }, // DNI/RUC
        5: { cellWidth: 30, halign: 'left' }, // Comprobante
        6: { cellWidth: 18, halign: 'center' }, // Cantidad
        7: { cellWidth: 25, halign: 'center' }, // Método Pago
        8: { cellWidth: 20, halign: 'right' }, // Subtotal
        9: { cellWidth: 20, halign: 'right' }, // Total
        10: { cellWidth: 22, halign: 'center' }, // Estado
      },
      didParseCell: (data) => {
        // Colorear columna de estado
        if (data.column.index === 10 && data.section === 'body') {
          const estado = data.cell.raw as string;
          if (estado === 'COMPLETADA') {
            data.cell.styles.textColor = [46, 204, 113]; // Verde
            data.cell.styles.fontStyle = 'bold';
          } else if (estado === 'PENDIENTE') {
            data.cell.styles.textColor = [243, 156, 18]; // Naranja
            data.cell.styles.fontStyle = 'bold';
          } else if (estado === 'ANULADA') {
            data.cell.styles.textColor = [231, 76, 60]; // Rojo
            data.cell.styles.fontStyle = 'bold';
          }
        }

        // Formatear montos
        if (
          (data.column.index === 8 || data.column.index === 9) &&
          data.section === 'body'
        ) {
          const valor = parseFloat(data.cell.raw as string);
          if (!isNaN(valor)) {
            data.cell.text = [`S/. ${valor.toFixed(2)}`];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
      margin: { top: yTabla, left: 10, right: 10, bottom: 25 },
      didDrawPage: (data) => {
        // Pie de página en cada página
        this.dibujarPiePagina(doc, data.pageNumber, colorTexto, colorPrimario);
      },
    });

    // Guardar el PDF
    const nombreArchivo = this.generarNombreArchivoPDF();
    doc.save(nombreArchivo);
  }

  /**
   * Dibujar tarjeta de métrica (diseño moderno)
   */
  private dibujarTarjetaMetrica(
    doc: jsPDF,
    x: number,
    y: number,
    titulo: string,
    valor: string,
    color: number[],
  ): void {
    const ancho = 65;
    const alto = 20;

    // Sombra suave
    doc.setFillColor(200, 200, 200);
    doc.roundedRect(x + 1, y + 1, ancho, alto, 3, 3, 'F');

    // Fondo blanco de la tarjeta
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, ancho, alto, 3, 3, 'F');

    // Borde coloreado
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, y, ancho, alto, 3, 3, 'S');

    // Barra de color superior
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(x, y, ancho, 3, 'F');

    // Título
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(titulo, x + ancho / 2, y + 9, { align: 'center' });

    // Valor
    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(valor, x + ancho / 2, y + 16, { align: 'center' });
  }

  /**
   * Dibujar pie de página
   */
  private dibujarPiePagina(
    doc: jsPDF,
    numeroPagina: number,
    colorTexto: number[],
    colorPrimario: number[],
  ): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Línea superior del pie
    doc.setDrawColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.setLineWidth(0.5);
    doc.line(10, pageHeight - 15, pageWidth - 10, pageHeight - 15);

    // Información del pie
    doc.setTextColor(colorTexto[0], colorTexto[1], colorTexto[2]);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');

    // Izquierda: Sistema
    doc.text('Sistema de Gestión de Inventario © 2025', 10, pageHeight - 10);

    // Centro: Advertencia
    doc.text(
      'Documento generado automáticamente',
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' },
    );

    // Derecha: Número de página
    doc.text(`Página ${numeroPagina}`, pageWidth - 10, pageHeight - 10, {
      align: 'right',
    });
  }

  /**
   * Obtener texto del período actual (para tarjeta de métricas)
   */
  private obtenerTextoPeriodo(): string {
    const hoy = new Date();
    const mes = hoy
      .toLocaleDateString('es-PE', { month: 'short' })
      .toUpperCase();
    const año = hoy.getFullYear();
    return `${mes} ${año}`;
  }

  /**
   * Generar nombre de archivo PDF
   */
  private generarNombreArchivoPDF(): string {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const hora = String(fecha.getHours()).padStart(2, '0');
    const minutos = String(fecha.getMinutes()).padStart(2, '0');

    return `Reporte_Ventas_${año}${mes}${dia}_${hora}${minutos}.pdf`;
  }

  /**
   * Exportar CSV simple (alternativa)
   */
  exportarCSV(): void {
    try {
      const datos = this.prepararDatosExportacion();
      const headers = Object.keys(datos[0] || {});

      // Crear CSV
      let csv = headers.join(',') + '\n';
      datos.forEach((fila) => {
        const valores = headers.map((header) => `"${fila[header]}"`);
        csv += valores.join(',') + '\n';
      });

      // Descargar
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        this.generarNombreArchivo().replace('.xlsx', '.csv'),
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      this.messageService.add({
        severity: 'success',
        summary: '✅ CSV Exportado',
        detail: 'Archivo CSV descargado correctamente',
        life: 3000,
      });
    } catch (error) {
      console.error('Error al exportar CSV:', error);
      this.messageService.add({
        severity: 'error',
        summary: '❌ Error',
        detail: 'No se pudo exportar el archivo CSV',
        life: 3000,
      });
    }
  }

  // Métodos heredados (compatibilidad)
  exportarVentas(formato: string): void {
    console.log('📥 Exportar ventas en formato:', formato);

    if (formato === 'excel' || formato === 'excel-detallado') {
      this.exportarExcelModerno();
    } else if (formato === 'csv') {
      this.exportarCSV();
    } else if (formato === 'pdf' || formato === 'pdf-resumen') {
      this.exportarPDF();
    }
  }

  exportarPrincipal(): void {
    this.exportarExcelModerno();
  }

  exportarData(): void {
    this.exportarPrincipal();
  }

  exportarReporteActual(): void {
    this.exportarPrincipal();
  }

  hayFiltrosActivos(): boolean {
    return !!(
      this.busquedaRapida?.trim() ||
      this.estadosSeleccionados?.length ||
      this.metodosSeleccionados?.length ||
      this.usuariosSeleccionados?.length ||
      this.metodoPagoSeleccionado ||
      this.calificacionMinima > 0 ||
      (this.rangoMonto &&
        (this.rangoMonto[0] > 0 || this.rangoMonto[1] < 10000)) ||
      this.filtrosRapidos?.length ||
      this.periodoSeleccionado !== 'todos'
    );
  }

  private descargarArchivo(formato: string): void {
    console.log('💾 Descargando archivo:', formato);
    this.exportarExcelModerno();
  }

  // ✅ VISTA Y INTERFAZ
  cambiarVista(vista: TipoVista): void {
    this.tipoVista = vista;

    this.messageService.add({
      severity: 'info',
      summary: '👁️ Vista Cambiada',
      detail: `Mostrando en vista de ${vista === 'list' ? 'lista' : 'tarjetas'}`,
      life: 2000,
    });
  }

  // ✅ UTILIDADES Y HELPERS
  trackByVentaId(index: number, venta: Venta): number {
    return venta.id;
  }

  formatearMoneda(monto: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
    }).format(monto);
  }

  private mapearEstado(estado: string): EstadoVenta {
    console.log('🔄 [MAPEO] Mapeando estado:', estado);

    const estados: Record<string, EstadoVenta> = {
      PENDIENTE: 'PENDIENTE',
      COMPLETADA: 'COMPLETADA',
      ANULADA: 'ANULADA',
      PROCESANDO: 'PROCESANDO',
    };

    const estadoMapeado = estados[estado] || 'PENDIENTE';
    console.log('✅ [MAPEO] Estado mapeado:', estado, '→', estadoMapeado);

    return estadoMapeado;
  }

  private determinarMetodoPago(): MetodoPago {
    console.log('🔄 [PAGO] Determinando método de pago...');

    // Por defecto asumir efectivo, puedes ajustar según tu lógica de negocio
    const metodoPago = 'EFECTIVO';
    console.log('✅ [PAGO] Método de pago determinado:', metodoPago);

    return metodoPago;
  }

  getEstadoClass(estado: EstadoVenta): string {
    const clases = {
      PENDIENTE: 'bg-yellow-100 text-yellow-800',
      COMPLETADA: 'bg-green-100 text-green-800',
      ANULADA: 'bg-red-100 text-red-800',
      PROCESANDO: 'bg-blue-100 text-blue-800',
    };
    return clases[estado] || 'bg-gray-100 text-gray-800';
  }

  getEstadoSeverity(
    estado: EstadoVenta,
  ): 'warn' | 'success' | 'danger' | 'info' | 'secondary' {
    const severities: Record<
      EstadoVenta,
      'warn' | 'success' | 'danger' | 'info' | 'secondary'
    > = {
      PENDIENTE: 'warn',
      COMPLETADA: 'success',
      ANULADA: 'danger',
      PROCESANDO: 'info',
    };
    return severities[estado] || 'secondary';
  }

  getMetodoPagoIcon(metodo: MetodoPago): string {
    const iconos = {
      EFECTIVO: 'pi pi-money-bill',
      TARJETA_DEBITO: 'pi pi-credit-card',
      TARJETA_CREDITO: 'pi pi-credit-card',
      YAPE: 'pi pi-mobile',
      PLIN: 'pi pi-mobile',
      TRANSFERENCIA: 'pi pi-send',
    };
    return iconos[metodo] || 'pi pi-question';
  }

  getClienteInitials(cliente: Cliente | undefined): string {
    if (!cliente) return 'PG';
    const nombres = cliente.nombres || '';
    const apellidos = cliente.apellidos || '';
    return (nombres.charAt(0) + apellidos.charAt(0)).toUpperCase();
  }

  // ✅ ACCIONES ADICIONALES
  actualizarDatos(): void {
    console.log('🔄 Actualizando datos...');
    this.cargarDatosIniciales();

    this.messageService.add({
      severity: 'success',
      summary: '🔄 Datos Actualizados',
      detail: 'La información ha sido actualizada exitosamente',
      life: 3000,
    });
  }

  abrirGraficoTendencias(): void {
    console.log('📈 Abrir gráfico de tendencias');
    // TODO: Implementar modal con gráficos detallados
  }

  abrirConfiguracion(): void {
    console.log('⚙️ Abrir configuración');
    // TODO: Implementar panel de configuración
  }

  private aplicarFiltrosYOrdenamiento(): void {
    this.filtrarVentas();
  }

  // ✅ ATAJOS DE TECLADO
  @HostListener('document:keydown', ['$event'])
  handleKeyboardShortcuts(event: KeyboardEvent): void {
    // F5 - Actualizar
    if (event.key === 'F5') {
      event.preventDefault();
      this.actualizarDatos();
      return;
    }

    // Ctrl + E - Exportar
    if (event.ctrlKey && event.key === 'e') {
      event.preventDefault();
      this.exportarPrincipal();
      return;
    }

    // Ctrl + F - Buscar
    if (event.ctrlKey && event.key === 'f') {
      event.preventDefault();
      // TODO: Enfocar campo de búsqueda
      return;
    }

    // ESC - Cerrar modales
    if (event.key === 'Escape') {
      if (this.mostrarDetalleDialog) {
        this.cerrarDetalleDialog();
      }
      return;
    }
  }

  // ✅ MÉTODO DE DATOS DE EJEMPLO - YA NO SE USA
  // Se mantiene comentado por si se necesita en desarrollo futuro
  /*
  private generarVentasEjemplo(): Venta[] {
    const ventas: Venta[] = [];
    const estados: EstadoVenta[] = ['COMPLETADA', 'PENDIENTE', 'PROCESANDO', 'ANULADA'];
    const metodos: MetodoPago[] = ['EFECTIVO', 'TARJETA_DEBITO', 'YAPE', 'PLIN'];
    
    for (let i = 1; i <= 100; i++) {
      const fechaBase = new Date();
      fechaBase.setDate(fechaBase.getDate() - Math.floor(Math.random() * 30));
      
      const total = Math.random() * 500 + 50;
      const subtotal = total;
      
      ventas.push({
        id: i,
        numeroVenta: `V-2024-${String(i).padStart(6, '0')}`,
        fechaVenta: fechaBase,
        cliente: {
          id: i,
          nombres: `Cliente ${i}`,
          apellidos: `Apellido ${i}`,
          dni: `1234567${i.toString().padStart(2, '0')}`,
          calificacion: Math.floor(Math.random() * 5) + 1,
          compras: Math.floor(Math.random() * 20) + 1,
          totalCompras: Math.random() * 5000 + 500
        },
        usuario: {
          id: 1,
          nombres: 'Emerson147',
          apellidos: 'Usuario',
          email: 'emerson147@email.com'
        },
        total: total,
        subtotal: subtotal,
        estado: estados[Math.floor(Math.random() * estados.length)],
        tipoComprobante: Math.random() > 0.5 ? 'BOLETA' : 'FACTURA',
        serieComprobante: Math.random() > 0.5 ? 'B001' : 'F001',
        pago: {
          id: i,
          metodoPago: metodos[Math.floor(Math.random() * metodos.length)],
          monto: total
        },
        detalles: [
          {
            id: i,
            producto: { id: i, nombre: `Producto ${i}` },
            cantidad: Math.floor(Math.random() * 5) + 1,
            precioUnitario: Math.random() * 100 + 10,
            subtotal: Math.random() * 200 + 50
          }
        ]
      });
    }
    
    return ventas;
  }
  */
}

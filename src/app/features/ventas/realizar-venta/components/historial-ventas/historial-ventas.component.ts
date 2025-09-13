import { Component, OnInit, OnDestroy, ViewChild, HostListener, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// PrimeNG Imports
import { MessageService, ConfirmationService, MenuItem, LazyLoadEvent } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { CalendarModule } from 'primeng/calendar';
import { SliderModule } from 'primeng/slider';
import { ChipsModule } from 'primeng/chips';
import { AutoCompleteModule, AutoCompleteSelectEvent } from 'primeng/autocomplete';
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

import { VentasService } from '../../../../../core/services/ventas.service';
import { EstadisticasVentasService } from '../../../../../core/services/estadisticas-ventas.service';
import { VentaResponse } from '../../../../../core/models/venta.model';

// Interfaces
interface Venta {
  id: number;
  numeroVenta: string;
  fechaVenta: Date;
  cliente?: Cliente;
  usuario?: Usuario;
  total: number;
  subtotal: number;
  igv: number;
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
type MetodoPago = 'EFECTIVO' | 'TARJETA_DEBITO' | 'TARJETA_CREDITO' | 'YAPE' | 'PLIN' | 'TRANSFERENCIA';
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
    TooltipModule
  ],
  templateUrl: './historial-ventas.component.html',
  styleUrls: ['./historial-ventas.component.scss']
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
    metaDiaria: 10000
  };

  // ✅ DATOS PARA GRÁFICOS Y PROGRESO
  progresoMeta = 0;
  datosGraficoTendencia: DatosGrafico = {
    labels: [],
    datasets: []
  };
  opcionesGrafico: OpcionesGrafico = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        display: false
      },
      y: {
        display: false
      }
    }
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
    { label: 'Procesando', value: 'PROCESANDO' }
  ];

  metodosPago: OpcionSelect[] = [
    { label: '💵 Efectivo', value: 'EFECTIVO' },
    { label: '💳 Tarjeta Débito', value: 'TARJETA_DEBITO' },
    { label: '💳 Tarjeta Crédito', value: 'TARJETA_CREDITO' },
    { label: '📱 Yape', value: 'YAPE' },
    { label: '📱 Plin', value: 'PLIN' },
    { label: '🏦 Transferencia', value: 'TRANSFERENCIA' }
  ];

  usuarios: OpcionSelect[] = [
    { label: 'Juan Pérez', value: 1 },
    { label: 'María García', value: 2 },
    { label: 'Carlos López', value: 3 }
  ];

  opcionesVista: OpcionSelect[] = [
    { label: 'Lista', value: 'list', icon: 'pi pi-list' },
    { label: 'Tarjetas', value: 'grid', icon: 'pi pi-th-large' }
  ];

  opcionesOrdenamiento: OpcionSelect[] = [
    { label: 'Fecha (Más reciente)', value: 'fecha_desc', icon: 'pi pi-calendar' },
    { label: 'Fecha (Más antigua)', value: 'fecha_asc', icon: 'pi pi-calendar' },
    { label: 'Monto (Mayor)', value: 'monto_desc', icon: 'pi pi-dollar' },
    { label: 'Monto (Menor)', value: 'monto_asc', icon: 'pi pi-dollar' },
    { label: 'Cliente (A-Z)', value: 'cliente', icon: 'pi pi-user' },
    { label: 'Número de venta', value: 'numero', icon: 'pi pi-hashtag' }
  ];

  // ✅ MENÚS Y ACCIONES
  accionesRapidas: MenuItem[] = [];
  menuAcciones: MenuItem[] = [];
  opcionesExportacion: MenuItem[] = [];
  menuContextual: MenuItem[] = [];

  // ✅ OBSERVABLE PARA CLEANUP
  private destroy$ = new Subject<void>();

  private messageService: MessageService = inject(MessageService);
  private confirmationService: ConfirmationService = inject(ConfirmationService);
  private ventasService: VentasService = inject(VentasService); // Reemplazar con tu servicio real
    // private exportService: any   // Reemplazar con tu servicio de exportación
  private estadisticasVentasService = inject(EstadisticasVentasService);

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
    
    // Verificar servicio
    console.log('🔧 [SERVICIO] VentasService:', this.ventasService);
    
    this.inicializarComponente();
    this.cargarDatosIniciales();
    this.configurarRelojes();
    this.configurarBusquedaInteligente();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
    
    document.removeEventListener('keydown', this.handleKeyboardShortcuts);
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
    console.log('📚 [CARGA] Iniciando carga de datos...');
    this.cargandoVentas = true;
    
    // TEST: Primero cargar datos de ejemplo
    console.log('🧪 [TEST] Cargando datos de ejemplo primero...');
    this.ventas = this.generarVentasEjemplo();
    this.aplicarFiltrosYOrdenamiento();
    
    // Después intentar cargar datos reales
    this.cargarVentasReales();
    this.cargarEstadisticas();
    
    this.cargandoVentas = false;
  }
  

  private cargarVentasReales(): void {
    console.log('🔄 [API] Intentando cargar ventas desde API...');
    
    const filtrosApi = {
      fechaDesde: this.rangoFechas[0],
      fechaHasta: this.rangoFechas[1]
    };
    
    console.log('📋 [FILTROS] Filtros para API:', filtrosApi);
    
    this.ventasService.obtenerVentas(filtrosApi)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('✅ [API SUCCESS] Datos recibidos:', {
            cantidad: data?.length || 0,
            ejemplo: data?.[0] || 'Sin datos'
          });
          
          if (data && data.length > 0) {
            this.procesarVentasAPI(data);
          } else {
            console.log('⚠️ [API] No hay datos, manteniendo ejemplos');
          }
        },
        error: (error) => {
          console.error('❌ [API ERROR] Error al cargar ventas:', error);
          console.log('📝 [FALLBACK] Manteniendo datos de ejemplo');
          
          this.messageService.add({
            severity: 'warn',
            summary: '⚠️ Modo Offline',
            detail: 'Mostrando datos de ejemplo. Verifique conexión.',
            life: 5000
          });
        }
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

  // ✅ CONFIGURACIÓN DE MENÚS
  private configurarMenus(): void {
    this.accionesRapidas = [
      {
        icon: 'pi pi-refresh',
        command: () => this.actualizarDatos(),
        tooltipOptions: { tooltipLabel: 'Actualizar datos' }
      },
      {
        icon: 'pi pi-download',
        command: () => this.exportarPrincipal(),
        tooltipOptions: { tooltipLabel: 'Exportar reporte' }
      },
      {
        icon: 'pi pi-chart-line',
        command: () => this.abrirGraficoTendencias(),
        tooltipOptions: { tooltipLabel: 'Ver gráficos' }
      },
      {
        icon: 'pi pi-cog',
        command: () => this.abrirConfiguracion(),
        tooltipOptions: { tooltipLabel: 'Configuración' }
      }
    ];

    this.menuAcciones = [
      {
        label: 'Actualizar',
        icon: 'pi pi-refresh',
        command: () => this.actualizarDatos()
      },
      {
        label: 'Exportar',
        icon: 'pi pi-download',
        items: [
          {
            label: 'Excel',
            icon: 'pi pi-file-excel',
            command: () => this.exportarVentas('excel')
          },
          {
            label: 'PDF',
            icon: 'pi pi-file-pdf',
            command: () => this.exportarVentas('pdf')
          },
          {
            label: 'CSV',
            icon: 'pi pi-file',
            command: () => this.exportarVentas('csv')
          }
        ]
      }
    ];

    this.opcionesExportacion = [
      {
        label: 'Excel Detallado',
        icon: 'pi pi-file-excel',
        command: () => this.exportarVentas('excel-detallado')
      },
      {
        label: 'PDF Resumen',
        icon: 'pi pi-file-pdf',
        command: () => this.exportarVentas('pdf-resumen')
      },
      {
        label: 'CSV Simple',
        icon: 'pi pi-file',
        command: () => this.exportarVentas('csv')
      }
    ];

    this.menuContextual = [
      {
        label: 'Ver Detalle',
        icon: 'pi pi-eye',
        command: () => this.verDetalleVenta(this.ventaSeleccionada!)
      },
      {
        label: 'Imprimir',
        icon: 'pi pi-print',
        command: () => this.imprimirComprobante(this.ventaSeleccionada!)
      },
      {
        separator: true
      },
      {
        label: 'Anular Venta',
        icon: 'pi pi-ban',
        command: () => this.confirmarAnulacion(this.ventaSeleccionada!),
        disabled: this.ventaSeleccionada?.estado !== 'COMPLETADA'
      }
    ];
  }

  private configurarGraficos(): void {
    this.opcionesGrafico = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          display: false
        },
        y: {
          display: false
        }
      }
    };

    this.datosGraficoTendencia = {
      labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
      datasets: [
        {
          data: [12, 19, 3, 5, 2, 3, 9],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };
  }

  private inicializarFiltros(): void {
    this.filtros = {
      fechaDesde: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 días
      fechaHasta: new Date(),
      estados: [],
      metodosPago: [],
      montoMinimo: 0,
      montoMaximo: 50000
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
      estado: this.estadosSeleccionados.length === 1 ? this.estadosSeleccionados[0] : undefined,
      termino: this.busquedaRapida || undefined
    };
    
    // Llamar al servicio real
    this.ventasService.obtenerVentas(filtrosApi)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.ventas = data.map(venta => ({
            id: venta.id,
            numeroVenta: venta.numeroVenta,
            fechaVenta: new Date(venta.fechaCreacion),
            cliente: venta.cliente ? {
              id: venta.cliente.id,
              nombres: venta.cliente.nombres,
              apellidos: venta.cliente.apellidos,
              dni: venta.cliente.documento,
              ruc: venta.cliente.documento,
              email: '',
              telefono: '',
              calificacion: 0
            } : undefined,
            usuario: venta.usuario ? {
              id: venta.usuario.id,
              nombres: venta.usuario.nombre,
              apellidos: '',
              email: ''
            } : undefined,
            total: venta.total,
            subtotal: venta.subtotal,
            igv: venta.igv,
            estado: venta.estado as EstadoVenta,
            tipoComprobante: venta.tipoComprobante,
            serieComprobante: venta.serieComprobante,
            pago: undefined,
            detalles: [],
            observaciones: venta.observaciones
          }));
          
          this.aplicarFiltrosYOrdenamiento();
          this.cargandoVentas = false;
          
          this.messageService.add({
            severity: 'success',
            summary: '✅ Datos Cargados',
            detail: `${this.ventasFiltradas.length} ventas encontradas`,
            life: 3000
          });
        },
        error: (error) => {
          console.error('Error al cargar ventas:', error);
          this.cargandoVentas = false;
          
          // Mostrar mensaje de error
          this.messageService.add({
            severity: 'error',
            summary: '❌ Error',
            detail: `No se pudieron cargar las ventas: ${error.message || 'Error del servidor'}`,
            life: 5000
          });
          
          // Cargar datos de ejemplo como fallback (opcional)
          this.ventas = this.generarVentasEjemplo();
          this.aplicarFiltrosYOrdenamiento();
        }
      });
  }

  private procesarVentasAPI(data: VentaResponse[]): void {
    console.log('🔄 [MAPEO] Procesando ventas del API con estructura correcta...');
    
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
          cliente: venta.cliente ? {
            id: venta.cliente.id,
            nombres: venta.cliente.nombres,
            apellidos: venta.cliente.apellidos,
            dni: venta.cliente.documento,
            ruc: venta.cliente.documento,
            email: '',
            telefono: '',
            calificacion: Math.floor(Math.random() * 5) + 1 // Temporal hasta que tengas este dato
          } : {
            id: 0,
            nombres: 'Público',
            apellidos: 'General',
            dni: '',
            calificacion: 0
          },
          
          // Usuario con estructura correcta
          usuario: venta.usuario ? {
            id: venta.usuario.id,
            nombres: venta.usuario.nombre,
            apellidos: venta.usuario.username,
            email: `${venta.usuario.username}@sistema.com`
          } : {
            id: 1,
            nombres: 'Emerson147',
            apellidos: 'Sistema',
            email: 'emerson147@sistema.com'
          },
          
          // Montos
          total: venta.total,
          subtotal: venta.subtotal,
          igv: venta.igv,
          
          // Estado y comprobante
          estado: this.mapearEstado(venta.estado),
          tipoComprobante: venta.tipoComprobante,
          serieComprobante: venta.serieComprobante,
          
          // Pago (asumir efectivo por defecto, puedes agregar lógica específica)
          pago: {
            id: venta.id,
            metodoPago: this.determinarMetodoPago(),
            monto: venta.total
          },
          
          // Detalles mapeados correctamente
          detalles: venta.detalles?.map(detalle => ({
            id: detalle.id,
            producto: {
              id: detalle.producto.id,
              nombre: detalle.producto.nombre,
              codigo: detalle.producto.codigo
            },
            cantidad: detalle.cantidad,
            precioUnitario: detalle.precioUnitario,
            subtotal: detalle.subtotal
          })) || [],
          
          observaciones: venta.observaciones || ''
        };
        
        return ventaMapeada;
      });
      
      console.log('✅ [MAPEO] Ventas procesadas correctamente:', {
        total: this.ventas.length,
        primeraVenta: this.ventas[0],
        estructura: 'Mapeado según API real'
      });
      
      this.aplicarFiltrosYOrdenamiento();
      
      this.messageService.add({
        severity: 'success',
        summary: '✅ Ventas Reales Cargadas',
        detail: `${this.ventas.length} ventas cargadas desde la base de datos`,
        life: 4000
      });
      
    } catch (error) {
      console.error('❌ [MAPEO ERROR] Error al procesar ventas:', error);
      this.messageService.add({
        severity: 'error',
        summary: '❌ Error de Mapeo',
        detail: 'Error al procesar los datos del servidor',
        life: 5000
      });
    }
  }
  

  private cargarEstadisticas(): void {
    console.log('📊 [ESTADISTICAS] Solicitando estadísticas del API...');
    
    this.ventasService.obtenerResumenDiario()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resumen) => {
          console.log('✅ [ESTADISTICAS] Resumen recibido del API:', resumen);
          
          // ✅ MAPEO CORREGIDO según la estructura real del API
          this.estadisticas = {
            ventasHoy: resumen.cantidadVentas || 0, // Usar cantidadVentas, no totalVentas
            totalVentasHoy: resumen.totalVentas || 0, // Usar totalVentas
            clientesUnicos: resumen.clientesUnicos || 0,
            clientesNuevos: resumen.clientesNuevos || 0,
            productosVendidos: resumen.cantidadProductos || 0, // Usar cantidadProductos
            tiposProductos: resumen.tiposProductos || resumen.cantidadProductos || 0,
            porcentajeCrecimiento: resumen.porcentajeCrecimiento || 0,
            promedioVenta: resumen.totalVentas && resumen.cantidadVentas 
              ? resumen.totalVentas / resumen.cantidadVentas 
              : 0,
            metaDiaria: 10000
          };
          
          // Actualizar progreso de meta
          this.progresoMeta = Math.min(100, Math.round((this.estadisticas.totalVentasHoy / this.estadisticas.metaDiaria) * 100));
          
          console.log('📊 [ESTADISTICAS] Estadísticas procesadas CORREGIDAS:', this.estadisticas);
          
          // Generar datos complementarios desde el API
          this.generarDatosComplementariosDesdeAPI();
          
          this.messageService.add({
            severity: 'success',
            summary: '📊 Estadísticas Cargadas',
            detail: `${this.estadisticas.ventasHoy} ventas hoy - S/ ${this.estadisticas.totalVentasHoy}`,
            life: 4000
          });
        },
        error: (error) => {
          console.error('❌ [ESTADISTICAS ERROR]:', error);
          this.cargarEstadisticasPorDefecto();
          
          this.messageService.add({
            severity: 'warn',
            summary: '⚠️ Estadísticas Offline',
            detail: 'Mostrando estadísticas de ejemplo',
            life: 3000
          });
        }
      });
  }
  
  private generarDatosComplementariosDesdeAPI(): void {
    console.log('🔄 [COMPLEMENTARIOS] Generando datos complementarios...');
    
    // Generar distribución de pagos por defecto ya que ResumenDiarioResponse no incluye esta info
    this.distribucionPagos = [
      { nombre: 'Efectivo', cantidad: 25, porcentaje: 55, color: '#10b981' },
      { nombre: 'Tarjeta', cantidad: 15, porcentaje: 33, color: '#3b82f6' },
      { nombre: 'Digital', cantidad: 5, porcentaje: 12, color: '#8b5cf6' }
    ];
    
    // Top productos por defecto ya que ResumenDiarioResponse no incluye esta info
    this.topProductos = [
      { nombre: 'Producto A', cantidad: 25 },
      { nombre: 'Producto B', cantidad: 18 },
      { nombre: 'Producto C', cantidad: 12 }
    ];
    
    console.log('✅ [COMPLEMENTARIOS] Datos generados:', {
      distribucionPagos: this.distribucionPagos.length,
      topProductos: this.topProductos.length
    });
    
    // Actividad reciente
    this.actividadReciente = [
      { 
        titulo: 'Resumen actualizado', 
        descripcion: `${this.estadisticas.ventasHoy} ventas registradas hoy`, 
        tiempo: 'hace 1 min' 
      },
      { 
        titulo: 'Total del día', 
        descripcion: `S/ ${this.estadisticas.totalVentasHoy.toFixed(2)} en ventas`, 
        tiempo: 'hace 2 min' 
      },
      { 
        titulo: 'Sistema activo', 
        descripcion: 'Conexión con API establecida', 
        tiempo: 'hace 3 min' 
      }
    ];
    
    console.log('📊 [COMPLEMENTARIOS] Datos generados:', {
      distribucionPagos: this.distribucionPagos,
      topProductos: this.topProductos
    });
  }

  private cargarEstadisticasPorDefecto(): void {
    console.log('🔄 [ESTADISTICAS] Cargando estadísticas por defecto...');
    
    this.estadisticas = {
      ventasHoy: 12,
      totalVentasHoy: 2450.75,
      clientesUnicos: 8,
      clientesNuevos: 3,
      productosVendidos: 25,
      tiposProductos: 15,
      porcentajeCrecimiento: 15.2,
      promedioVenta: 204.23,
      metaDiaria: 10000
    };
    
    this.progresoMeta = Math.min(100, Math.round((this.estadisticas.totalVentasHoy / this.estadisticas.metaDiaria) * 100));
    
    this.generarDatosComplementarios();
    
    console.log('✅ [ESTADISTICAS] Estadísticas por defecto cargadas:', this.estadisticas);
  }
  
  

  private generarDatosComplementarios(): void {
    this.distribucionPagos = [
      { nombre: 'Efectivo', cantidad: 25, porcentaje: 55, color: '#10b981' },
      { nombre: 'Tarjeta', cantidad: 15, porcentaje: 33, color: '#3b82f6' },
      { nombre: 'Digital', cantidad: 5, porcentaje: 12, color: '#8b5cf6' }
    ];
    
    this.topProductos = [
      { nombre: 'Producto A', cantidad: 25 },
      { nombre: 'Producto B', cantidad: 18 },
      { nombre: 'Producto C', cantidad: 12 }
    ];
    
    this.actividadReciente = [
      { titulo: 'Venta completada', descripcion: 'V-2024-001234 - S/ 125.50', tiempo: 'hace 2 min' },
      { titulo: 'Cliente nuevo', descripcion: 'Juan Pérez registrado', tiempo: 'hace 5 min' },
      { titulo: 'Pago procesado', descripcion: 'Tarjeta terminada en 1234', tiempo: 'hace 8 min' }
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
          fill: true
        }
      ]
    };
  }

  // ✅ FILTRADO Y BÚSQUEDA
  filtrarVentas(): void {
    console.log('🔍 [FILTROS] Aplicando filtros...', {
      totalVentas: this.ventas.length,
      busquedaRapida: this.busquedaRapida,
      estadosSeleccionados: this.estadosSeleccionados,
      metodosSeleccionados: this.metodosSeleccionados,
      rangoMonto: this.rangoMonto
    });
    
    this.ventasFiltradas = this.ventas.filter(venta => {
      // Filtro por búsqueda rápida
      if (this.busquedaRapida) {
        const busqueda = this.busquedaRapida.toLowerCase();
        const coincide = 
          venta.numeroVenta.toLowerCase().includes(busqueda) ||
          (venta.cliente?.nombres + ' ' + venta.cliente?.apellidos).toLowerCase().includes(busqueda) ||
          venta.cliente?.dni?.includes(busqueda) ||
          venta.cliente?.ruc?.includes(busqueda);
        
        if (!coincide) return false;
      }

      // Filtro por fechas
      if (this.filtros.fechaDesde && venta.fechaVenta < this.filtros.fechaDesde) return false;
      if (this.filtros.fechaHasta && venta.fechaVenta > this.filtros.fechaHasta) return false;

      // Filtro por estados
      if (this.estadosSeleccionados.length > 0 && !this.estadosSeleccionados.includes(venta.estado)) {
        return false;
      }

      // Filtro por métodos de pago
      if (this.metodosSeleccionados.length > 0 && venta.pago?.metodoPago && !this.metodosSeleccionados.includes(venta.pago.metodoPago)) {
        return false;
      }

      // Filtro por rango de monto
      if (venta.total < this.rangoMonto[0] || venta.total > this.rangoMonto[1]) {
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
      totalPaginas: this.totalPaginas
    });
  }

  buscarSugerencias(evento: EventoAutoComplete): void {
    const query = evento.query.toLowerCase();
    
    // TODO: Implementar búsqueda real en el backend
    this.sugerenciasBusqueda = [
      { label: 'V-2024-001234', tipo: 'Venta', icon: 'pi pi-receipt' },
      { label: 'Juan Pérez', tipo: 'Cliente', icon: 'pi pi-user' },
      { label: 'Producto ABC', tipo: 'Producto', icon: 'pi pi-box' }
    ].filter(item => item.label.toLowerCase().includes(query));
  }

  seleccionarSugerencia(evento: AutoCompleteSelectEvent): void {
    this.busquedaRapida = evento.value?.label || '';
    this.filtrarVentas();
  }

  filtrarPorPeriodo(periodo: string): void {
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(hoy.getDate() - 1);

    switch (periodo) {
      case 'hoy':
        this.rangoFechas = [hoy, hoy];
        break;
      case 'ayer':
        this.rangoFechas = [ayer, ayer];
        break;
      case 'semana': {
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(hoy.getDate() - hoy.getDay());
        this.rangoFechas = [inicioSemana, hoy];
        break;
      }
      case 'mes': {
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        this.rangoFechas = [inicioMes, hoy];
        break;
      }
    }

    this.filtros.fechaDesde = this.rangoFechas[0];
    this.filtros.fechaHasta = this.rangoFechas[1];
    this.filtrarVentas();

    this.messageService.add({
      severity: 'info',
      summary: '📅 Filtro Aplicado',
      detail: `Mostrando ventas de: ${periodo}`,
      life: 3000
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
      life: 3000
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
      calificacionMinima: this.calificacionMinima
    };

    this.filtrarVentas();

    this.messageService.add({
      severity: 'success',
      summary: '✅ Filtros Aplicados',
      detail: `${this.ventasFiltradas.length} ventas encontradas`,
      life: 3000
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
      ventasPaginadas: this.ventasPaginadas.length
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
    
    // TODO: Implementar lógica de impresión
    this.messageService.add({
      severity: 'info',
      summary: '🖨️ Imprimiendo',
      detail: `Generando comprobante de venta ${venta.numeroVenta}`,
      life: 3000
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
      }
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
      life: 5000
    });
  }

  mostrarMenuContextual(evento: Event, venta: Venta): void {
    this.ventaSeleccionada = venta;
    this.contextMenu.show(evento);
  }

  // ✅ EXPORTACIÓN
  exportarVentas(formato: string): void {
    console.log('📥 Exportar ventas en formato:', formato);
    
    this.messageService.add({
      severity: 'info',
      summary: '📥 Exportando',
      detail: `Generando reporte en formato ${formato.toUpperCase()}`,
      life: 4000
    });

    // TODO: Implementar lógica real de exportación
    setTimeout(() => {
      this.messageService.add({
        severity: 'success',
        summary: '✅ Exportación Completa',
        detail: `Reporte de ${this.ventasFiltradas.length} ventas generado exitosamente`,
        life: 5000,
        data: {
          acciones: [{
            label: 'Descargar',
            action: () => this.descargarArchivo(formato),
            style: 'px-3 py-1.5 text-xs font-medium bg-green-500 text-white rounded-lg hover:bg-green-600'
          }]
        }
      });
    }, 2000);
  }

  exportarPrincipal(): void {
    this.exportarVentas('excel');
  }

  private descargarArchivo(formato: string): void {
    // TODO: Implementar descarga real
    console.log('💾 Descargando archivo:', formato);
  }

  // ✅ VISTA Y INTERFAZ
  cambiarVista(vista: TipoVista): void {
    this.tipoVista = vista;
    
    this.messageService.add({
      severity: 'info',
      summary: '👁️ Vista Cambiada',
      detail: `Mostrando en vista de ${vista === 'list' ? 'lista' : 'tarjetas'}`,
      life: 2000
    });
  }

  // ✅ UTILIDADES Y HELPERS
  trackByVentaId(index: number, venta: Venta): number {
    return venta.id;
  }

  formatearMoneda(monto: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(monto);
  }

  private mapearEstado(estado: string): EstadoVenta {
    console.log('🔄 [MAPEO] Mapeando estado:', estado);
    
    const estados: Record<string, EstadoVenta> = {
      'PENDIENTE': 'PENDIENTE',
      'COMPLETADA': 'COMPLETADA',
      'ANULADA': 'ANULADA',
      'PROCESANDO': 'PROCESANDO'
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
      'PENDIENTE': 'bg-yellow-100 text-yellow-800',
      'COMPLETADA': 'bg-green-100 text-green-800',
      'ANULADA': 'bg-red-100 text-red-800',
      'PROCESANDO': 'bg-blue-100 text-blue-800'
    };
    return clases[estado] || 'bg-gray-100 text-gray-800';
  }

getEstadoSeverity(estado: EstadoVenta): 'warn' | 'success' | 'danger' | 'info' | 'secondary' {
  const severities: Record<EstadoVenta, 'warn' | 'success' | 'danger' | 'info' | 'secondary'> = {
    'PENDIENTE': 'warn',
    'COMPLETADA': 'success',
    'ANULADA': 'danger',
    'PROCESANDO': 'info'
  };
  return severities[estado] || 'secondary';
}

  getMetodoPagoIcon(metodo: MetodoPago): string {
    const iconos = {
      'EFECTIVO': 'pi pi-money-bill',
      'TARJETA_DEBITO': 'pi pi-credit-card',
      'TARJETA_CREDITO': 'pi pi-credit-card',
      'YAPE': 'pi pi-mobile',
      'PLIN': 'pi pi-mobile',
      'TRANSFERENCIA': 'pi pi-send'
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
      life: 3000
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

  // ✅ DATOS DE EJEMPLO (TEMPORAL)
  private generarVentasEjemplo(): Venta[] {
    const ventas: Venta[] = [];
    const estados: EstadoVenta[] = ['COMPLETADA', 'PENDIENTE', 'PROCESANDO', 'ANULADA'];
    const metodos: MetodoPago[] = ['EFECTIVO', 'TARJETA_DEBITO', 'YAPE', 'PLIN'];
    
    for (let i = 1; i <= 100; i++) {
      const fechaBase = new Date();
      fechaBase.setDate(fechaBase.getDate() - Math.floor(Math.random() * 30));
      
      const total = Math.random() * 500 + 50;
      const subtotal = total / 1.18;
      const igv = total - subtotal;
      
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
        igv: igv,
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
}
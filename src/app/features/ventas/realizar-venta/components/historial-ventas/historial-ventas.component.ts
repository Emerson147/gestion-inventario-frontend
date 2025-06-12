import { Component, OnInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { Subject, Observable, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// PrimeNG Imports
import { MessageService, ConfirmationService, MenuItem, LazyLoadEvent } from 'primeng/api';
import { TableModule, Table } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { CalendarModule } from 'primeng/calendar';
import { SliderModule } from 'primeng/slider';
import { ChipsModule } from 'primeng/chips';
import { AutoCompleteModule } from 'primeng/autocomplete';
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

interface DetalleVenta {
  id: number;
  producto?: any;
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
  totalVentas: number = 0;

  // ✅ ESTADOS DE LA INTERFAZ
  cargandoVentas: boolean = false;
  mostrarDetalleDialog: boolean = false;
  tipoVista: TipoVista = 'list';
  paginaActual: number = 1;
  ventasPorPagina: number = 25;
  totalPaginas: number = 0;

  // ✅ FILTROS Y BÚSQUEDA
  filtros: FiltrosVenta = {};
  busquedaRapida: string = '';
  sugerenciasBusqueda: any[] = [];
  filtrosRapidos: string[] = [];
  rangoFechas: Date[] = [];
  rangoMonto: number[] = [0, 10000];

  // ✅ SELECCIONES MÚLTIPLES
  estadosSeleccionados: EstadoVenta[] = [];
  metodosSeleccionados: MetodoPago[] = [];
  usuariosSeleccionados: number[] = [];
  metodoPagoSeleccionado: MetodoPago | null = null;
  calificacionMinima: number = 0;

  // ✅ ORDENAMIENTO
  ordenarPor: string = 'fecha_desc';
  campoOrden: string = 'fechaVenta';
  direccionOrden: 'asc' | 'desc' = 'desc';

    // Agregar estas propiedades si faltan:
  ventasHoy: number = 0;
  totalVentasHoy: number = 0;
  clientesUnicos: number = 0;
  clientesNuevos: number = 0;
  productosVendidos: number = 0;
  tiposProductos: number = 0;
  porcentajeCrecimiento: number = 0;
  promedioVenta: number = 0;
  metaDiaria: number = 10000;

  // Propiedades para fechas
  fechaDesde?: Date;
  fechaHasta?: Date;

  // Math para templates
  Math = Math;

  getProgresoFromDetail(detail: string): number {
  const match = detail.match(/(\d+)%/);
  return match ? parseInt(match[1]) : 0;
}
  // ✅ ESTADÍSTICAS
  estadisticas: EstadisticasVenta = {
    ventasHoy: 0,
    totalVentasHoy: 0,
    clientesUnicos: 0,
    clientesNuevos: 0,
    productosVendidos: 0,
    tiposProductos: 0,
    porcentajeCrecimiento: 0,
    promedioVenta: 0,
    metaDiaria: 10000
  };

  // ✅ DATOS PARA GRÁFICOS Y PROGRESO
  progresoMeta: number = 0;
  datosGraficoTendencia: any = {};
  opcionesGrafico: any = {};
  distribucionPagos: any[] = [];
  actividadReciente: any[] = [];
  topMetodosPago: any[] = [];
  topProductos: any[] = [];

  // ✅ FECHAS Y TIEMPO
  fechaActual: Date = new Date();
  horaActual: string = '';

  // ✅ OPCIONES PARA COMPONENTES
  estadosVenta: any[] = [
    { label: 'Pendiente', value: 'PENDIENTE' },
    { label: 'Completada', value: 'COMPLETADA' },
    { label: 'Anulada', value: 'ANULADA' },
    { label: 'Procesando', value: 'PROCESANDO' }
  ];

  metodosPago: any[] = [
    { label: '💵 Efectivo', value: 'EFECTIVO' },
    { label: '💳 Tarjeta Débito', value: 'TARJETA_DEBITO' },
    { label: '💳 Tarjeta Crédito', value: 'TARJETA_CREDITO' },
    { label: '📱 Yape', value: 'YAPE' },
    { label: '📱 Plin', value: 'PLIN' },
    { label: '🏦 Transferencia', value: 'TRANSFERENCIA' }
  ];

  usuarios: any[] = [
    { label: 'Juan Pérez', value: 1 },
    { label: 'María García', value: 2 },
    { label: 'Carlos López', value: 3 }
  ];

  opcionesVista: any[] = [
    { label: 'Lista', value: 'list', icon: 'pi pi-list' },
    { label: 'Tarjetas', value: 'grid', icon: 'pi pi-th-large' }
  ];

  opcionesOrdenamiento: any[] = [
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

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private ventasService: VentasService, // Reemplazar con tu servicio real
    // private exportService: any   // Reemplazar con tu servicio de exportación
  ) {
    this.inicializarConfiguraciones();
  }

  ngOnInit(): void {
    console.log('🚀 Inicializando Historial de Ventas...');
    this.inicializarComponente();
    this.cargarDatosIniciales();
    this.configurarRelojes();
    this.configurarBusquedaInteligente();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
    this.cargandoVentas = true;
    
    // Cargar ventas
    this.cargarVentas();
    
    // Cargar estadísticas
    this.cargarEstadisticas();
    
    // Cargar datos para gráficos
    this.cargarDatosGraficos();
    
    this.cargandoVentas = false;
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
    
    console.log('📊 Cargando ventas...', evento);
    
    // TODO: Implementar llamada real al servicio
    setTimeout(() => {
      this.ventas = this.generarVentasEjemplo();
      this.aplicarFiltrosYOrdenamiento();
      this.cargandoVentas = false;
      
      this.messageService.add({
        severity: 'success',
        summary: '✅ Datos Cargados',
        detail: `${this.ventasFiltradas.length} ventas encontradas`,
        life: 3000
      });
    }, 1000);
  }

  private cargarEstadisticas(): void {
    // TODO: Implementar carga real de estadísticas
    this.estadisticas = {
      ventasHoy: 45,
      totalVentasHoy: 8750.50,
      clientesUnicos: 32,
      clientesNuevos: 8,
      productosVendidos: 156,
      tiposProductos: 23,
      porcentajeCrecimiento: 12.5,
      promedioVenta: 194.46,
      metaDiaria: 10000
    };

    this.progresoMeta = Math.round((this.estadisticas.totalVentasHoy / this.estadisticas.metaDiaria) * 100);
    
    this.distribucionPagos = [
      { nombre: 'Efectivo', cantidad: 25, porcentaje: 55 },
      { nombre: 'Tarjeta', cantidad: 15, porcentaje: 33 },
      { nombre: 'Digital', cantidad: 5, porcentaje: 12 }
    ];

    this.topProductos = [
      { nombre: 'Producto A', cantidad: 25 },
      { nombre: 'Producto B', cantidad: 18 },
      { nombre: 'Producto C', cantidad: 12 }
    ];

    this.actividadReciente = [
      {
        titulo: 'Venta completada',
        descripcion: 'V-2024-001234 - S/ 125.50',
        tiempo: 'hace 2 min'
      },
      {
        titulo: 'Cliente nuevo',
        descripcion: 'Juan Pérez registrado',
        tiempo: 'hace 5 min'
      },
      {
        titulo: 'Pago procesado',
        descripcion: 'Tarjeta terminada en 1234',
        tiempo: 'hace 8 min'
      }
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
    console.log('🔍 Aplicando filtros...', this.filtros);
    
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
      if (this.metodosSeleccionados.length > 0 && !this.metodosSeleccionados.includes(venta.pago?.metodoPago!)) {
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
  }

  buscarSugerencias(evento: any): void {
    const query = evento.query.toLowerCase();
    
    // TODO: Implementar búsqueda real en el backend
    this.sugerenciasBusqueda = [
      { label: 'V-2024-001234', tipo: 'Venta', icon: 'pi pi-receipt' },
      { label: 'Juan Pérez', tipo: 'Cliente', icon: 'pi pi-user' },
      { label: 'Producto ABC', tipo: 'Producto', icon: 'pi pi-box' }
    ].filter(item => item.label.toLowerCase().includes(query));
  }

  seleccionarSugerencia(evento: any): void {
    this.busquedaRapida = evento.label;
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
      case 'semana':
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(hoy.getDate() - hoy.getDay());
        this.rangoFechas = [inicioSemana, hoy];
        break;
      case 'mes':
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        this.rangoFechas = [inicioMes, hoy];
        break;
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
    this.ventasFiltradas.sort((a, b) => {
      let valorA: any, valorB: any;

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
  }

  // ✅ PAGINACIÓN
  private actualizarPaginacion(): void {
    this.totalVentas = this.ventasFiltradas.length;
    this.totalPaginas = Math.ceil(this.totalVentas / this.ventasPorPagina);
    
    const inicio = (this.paginaActual - 1) * this.ventasPorPagina;
    const fin = inicio + this.ventasPorPagina;
    
    this.ventasPaginadas = this.ventasFiltradas.slice(inicio, fin);
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

  getEstadoClass(estado: EstadoVenta): string {
    const clases = {
      'PENDIENTE': 'bg-yellow-100 text-yellow-800',
      'COMPLETADA': 'bg-green-100 text-green-800',
      'ANULADA': 'bg-red-100 text-red-800',
      'PROCESANDO': 'bg-blue-100 text-blue-800'
    };
    return clases[estado] || 'bg-gray-100 text-gray-800';
  }

getEstadoSeverity(estado: EstadoVenta): any {  // ✅ Cambiar el tipo de retorno
  const severities = {
    'PENDIENTE': 'warning',
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
            producto: { nombre: `Producto ${i}` },
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
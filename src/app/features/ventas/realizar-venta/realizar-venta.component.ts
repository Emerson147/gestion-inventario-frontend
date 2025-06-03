import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { VentaRequest, VentaResponse, VentaDetalleRequest, VentaDetalleResponse } from '../../../core/models/venta.model';
import { Cliente } from '../../../core/models/cliente.model';
import { Producto } from '../../../core/models/product.model';
import { VentasService } from '../../../core/services/ventas.service';
import { PagosService } from '../../../core/services/pagos.service';
import { ClienteService } from '../../../core/services/clientes.service';
import { ProductoService } from '../../../core/services/producto.service';
import { InventarioService } from '../../../core/services/inventario.service';
import { MessageService, ConfirmationService, MenuItem } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { DropdownModule } from 'primeng/dropdown';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { TabViewModule } from 'primeng/tabview';
import { PanelModule } from 'primeng/panel';
import { TooltipModule } from 'primeng/tooltip';
import { MenuModule } from 'primeng/menu';
import { SplitterModule } from 'primeng/splitter';
import { BadgeModule } from 'primeng/badge';
import { DividerModule } from 'primeng/divider';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { CalendarModule } from 'primeng/calendar';
import { ChartModule } from 'primeng/chart';
import { StepsModule } from 'primeng/steps';
import { PermissionService, PermissionType } from '../../../core/services/permission.service';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PagoRequest, PagoResponse } from '../../../core/models/pago.model';
import { Inventario } from '../../../core/models/inventario.model';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { AvatarModule } from 'primeng/avatar';
import { KnobModule } from 'primeng/knob';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageModule } from 'primeng/message';

interface OpcionSelect {
  label: string;
  value: string;
}

interface ItemCarrito {
  inventarioId: number;
  producto: any;
  color: any;
  talla: any;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  stock: number;
  codigoCompleto: string;
}

interface EstadisticasVentas {
  totalVentasHoy: number;
  montoVentasHoy: number;
  ventasEsteMes: number;
  montoEsteMes: number;
  productoMasVendido: string;
  clienteFrecuente: string;
  ventasPendientes: number;
  pagosContado: number;
  pagosCredito: number;
}

interface FiltrosVentas {
  fechaInicio: Date | null;
  fechaFin: Date | null;
  cliente: string;
  estado: string;
  tipoComprobante: string;
  metodoPago: string;
}

@Component({
  selector: 'app-ventas',
  imports: [
    CommonModule,
    FormsModule,
    IconFieldModule,
    InputIconModule,
    ToolbarModule,
    TableModule,
    ButtonModule,
    DialogModule,
    ToastModule,
    ConfirmDialogModule,
    InputTextModule,
    CardModule,
    DropdownModule,
    AutoCompleteModule,
    TabViewModule,
    PanelModule,
    TooltipModule,
    MenuModule,
    SplitterModule,
    BadgeModule,
    DividerModule,
    InputNumberModule,
    CheckboxModule,
    CalendarModule,
    ChartModule,
    StepsModule,
    TagModule,
    BreadcrumbModule,
    AvatarModule,
    KnobModule,
    ProgressBarModule,
    MessageModule
  ],
  templateUrl: './realizar-venta.component.html',
  styleUrls: ['./realizar-venta.component.scss'],
  providers: [MessageService, ConfirmationService]
})
export class RealizarVentaComponent implements OnInit, OnDestroy {
  @ViewChild('codigoInput') codigoInput!: ElementRef;
  @ViewChild('menuAcciones') menuAcciones: any;

  // Control de permisos
  permissionTypes = PermissionType;
  canCreate = false;
  canEdit = false;
  canDelete = false;
  canViewReports = false;
  isDarkMode = false;
  currentTime = new Date();
  clientesRecientes: Cliente[] = [];

  // Timer para actualizar la hora
  private timeInterval: any;
  
  // Para gestionar suscripciones
  private destroy$ = new Subject<void>();
  
  // Vista activa
  activeTabIndex = 0;
  
  // ==================== DATOS PRINCIPALES ====================
  ventas: VentaResponse[] = [];
  ventasFiltradas: VentaResponse[] = [];
  clientes: Cliente[] = [];
  productos: Producto[] = [];
  inventarios: Inventario[] = [];

  
 // Variables para menú contextual
 itemsMenuAcciones: MenuItem[] = [];
  
  // ==================== POS - NUEVA VENTA ====================
  nuevaVenta: VentaRequest = this.initNuevaVenta();
  clienteSeleccionado: Cliente | null = null;
  clientesFiltrados: Cliente[] = [];
  productosAutoComplete: any[] = [];
  carrito: ItemCarrito[] = [];
  
  // Variables de entrada
  codigoBusqueda: string = '';
  cantidadInput: number = 1;
  
  // Cálculos
  subtotalVenta: number = 0;
  igvVenta: number = 0;
  totalVenta: number = 0;
  igvPorcentaje: number = 0.18; // 18% IGV
  
  // ==================== PAGO ====================
  procesandoPago = false;
  pagoDialog = false;
  pagoActual: PagoRequest = this.initPago();
  montoPagado: number = 0;
  vuelto: number = 0;
  pagosPendientes: PagoResponse[] = [];
  
  // ==================== COMPROBANTES ====================
  comprobanteDialog = false;
  ventaParaComprobante: VentaResponse | null = null;
  
  // ==================== HISTORIAL ====================
  loading = false;
  selectedVentas: VentaResponse[] = [];
  filtros: FiltrosVentas = this.initFiltros();
  
  // ==================== REPORTES ====================
  estadisticas: EstadisticasVentas = this.initEstadisticas();
  chartVentas: any;
  chartOptions: any;
  reportesDialog = false;
  
  // ==================== DEVOLUCIONES ====================
  devolucionDialog = false;
  ventaDevolucion: VentaResponse | null = null;
  itemsDevolucion: any[] = [];
  motivoDevolucion: string = '';
  
  // ==================== CONFIGURACIONES ====================
  metodosPago: OpcionSelect[] = [
    { label: 'Efectivo', value: 'EFECTIVO' },
    { label: 'Tarj. Crédito', value: 'TARJETA_CREDITO' },
    { label: 'Tarj. Débito', value: 'TARJETA_DEBITO' },
    { label: 'Transferencia', value: 'TRANSFERENCIA' },
    { label: 'Yape', value: 'YAPE' },
    { label: 'Plin', value: 'PLIN' },
    { label: 'Otros', value: 'OTROS' }
  ];

  tiposComprobante: OpcionSelect[] = [
    { label: 'Factura', value: 'FACTURA' },
    { label: 'Boleta', value: 'BOLETA' },
    { label: 'Nota de Venta', value: 'NOTA_VENTA' },
    { label: 'Ticket', value: 'TICKET' }
  ];
  
  estadosVenta: OpcionSelect[] = [
    { label: 'Todos', value: '' },
    { label: 'Pendiente', value: 'PENDIENTE' },
    { label: 'Pagada', value: 'PAGADA' },
    { label: 'Anulada', value: 'ANULADA' },
    { label: 'Devuelta', value: 'DEVUELTA' }
  ];
  
  // ==================== PASOS DEL PROCESO ====================
  pasos: MenuItem[] = [
    { label: 'Cliente', icon: 'pi pi-user' },
    { label: 'Productos', icon: 'pi pi-shopping-cart' },
    { label: 'Pago', icon: 'pi pi-credit-card' },
    { label: 'Comprobante', icon: 'pi pi-file' }
  ];
  pasoActual: number = 0;

  tabsInfo = [
    { icon: 'pi pi-shopping-cart', label: 'POS' },
    { icon: 'pi pi-history', label: 'Historial' },
    { icon: 'pi pi-chart-bar', label: 'Reportes' },
    { icon: 'pi pi-cog', label: 'Config' }
  ];
  
  // Estados de pestañas
  ventasPendientesCount = 0;
  ventasHoyCount = 0;
  montoTotalHoy = 0;
  loadingReportes = false;
  configPendientes = 2;
  isFullscreen = false;

  // Lista de productos populares / recientes
productosPopulares: any[] = [];

// Cliente recientemente buscado
clienteBusqueda: any = null;
productoBusqueda: any = null;

// Variables para descuentos
aplicarDescuento: boolean = false;
porcentajeDescuento: number = 0;
descuentoVenta: number = 0;
tipoDescuento: 'porcentaje' | 'monto' = 'porcentaje';

// Variables para el scanner
scannerActive: boolean = false;
videoElement!: ElementRef;
stream: MediaStream | null = null;

// Variables para el pago
minFechaCredito = new Date();
fechaVencimientoCredito = new Date(this.minFechaCredito.getTime() + 30*24*60*60*1000); // +30 días
cuotasCredito: number = 1;
esVentaCredito: boolean = false;
opcionesCuotas = [
  { label: '1 cuota', value: 1 },
  { label: '2 cuotas', value: 2 },
  { label: '3 cuotas', value: 3 },
  { label: '6 cuotas', value: 6 },
  { label: '12 cuotas', value: 12 }
];
pasoPagoActual: number = 0;
pasosPago = [
  { label: 'Verificar', icon: 'pi pi-check-circle' },
  { label: 'Cobrar', icon: 'pi pi-credit-card' },
  { label: 'Finalizar', icon: 'pi pi-send' }
];

// Series de comprobantes
seriesComprobante: { label: string, value: string }[] = [
  { label: 'B001', value: 'B001' },
  { label: 'B002', value: 'B002' },
  { label: 'F001', value: 'F001' },
  { label: 'F002', value: 'F002' },
  { label: 'NV001', value: 'NV001' },
];

  // Datos para gráficos mini
  miniGraficoVentas = [45, 62, 38, 75, 89, 56, 92, 67, 84, 71, 95, 83];

  ping = 12;


  constructor(
    private ventasService: VentasService,
    private pagosService: PagosService,
    private clienteService: ClienteService,
    private productoService: ProductoService,
    private inventarioService: InventarioService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private permissionService: PermissionService
  ) {
    this.initChartOptions();
  }

  ngOnInit() {
    this.loadPermissions();
    this.cargarDatosIniciales();
    this.cargarEstadisticas();
    this.inicializarChart();
    this.startTimeUpdate();
    this.setupKeyboardShortcuts();
    this.setupTabNavigation();
    this.calculateTabStats();
    this.cargarProductosPopulares();
    this.cargarClientesRecientes();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
    this.cerrarScanner();
  }

// ==== PRODUCTOS ====

private cargarProductosPopulares(): void {
  // En una implementación real esto vendría del servidor
  // Por ahora filtramos productos con stock > 0 y tomamos los primeros 4
  this.productosPopulares = this.inventarios
    .filter(p => p.cantidad > 0)
    .sort(() => 0.5 - Math.random()) // Ordenamiento aleatorio
    .slice(0, 4);
    
  // Agregar imagen aleatoria para demostración
  this.productosPopulares.forEach((producto, index) => {
    producto.imagen = `/assets/images/product-${(index % 4) + 1}.jpg`;
  });
}

seleccionarProductoPopular(producto: any): void {
  if (!this.clienteSeleccionado) {
    this.mostrarError('Cliente requerido', 'Debe seleccionar un cliente primero');
    return;
  }
  
  this.agregarProductoAlCarrito(producto);
}

getStockClass(stock: number): string {
  if (stock <= 5) return 'low';
  if (stock <= 15) return 'medium';
  return 'high';
}

// ==== CLIENTES ====

private cargarClientesRecientes(): void {
  // En una implementación real esto vendría del servidor
  // Por ahora tomamos algunos clientes aleatorios
  if (this.clientes.length > 0) {
    this.clientesRecientes = this.clientes
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
      
    // Agregar datos simulados
    this.clientesRecientes.forEach(cliente => {
      cliente.compras = Math.floor(Math.random() * 20) + 1;
      cliente.totalCompras = Math.random() * 10000;
      cliente.ultimaCompra = new Date(
        Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000
      ).toLocaleDateString();
    });
  }
}

onClienteSelect(event: any): void {
  if (event && event.value) {
    this.seleccionarCliente(event.value);
  }
}

nuevoCliente(): void {
  this.mostrarInfo('Nuevo Cliente', 'Abriendo formulario para registrar nuevo cliente...');
  // Aquí se implementaría la apertura de un formulario de registro de cliente
}

editarCliente(): void {
  if (!this.clienteSeleccionado) return;
  
  this.mostrarInfo('Editar Cliente', `Editando cliente: ${this.clienteSeleccionado.nombres} ${this.clienteSeleccionado.apellidos}`);
  // Aquí se implementaría la apertura de un formulario de edición
}

// ==== DESCUENTOS ====

toggleDescuento(): void {
  if (!this.aplicarDescuento) {
    this.porcentajeDescuento = 0;
    this.descuentoVenta = 0;
    this.calcularTotales();
  }
}

toggleTipoDescuento(): void {
  this.tipoDescuento = this.tipoDescuento === 'porcentaje' ? 'monto' : 'porcentaje';
  this.calcularDescuento();
}

calcularDescuento(): void {
  if (!this.aplicarDescuento || this.carrito.length === 0) {
    this.descuentoVenta = 0;
    return;
  }
  
  if (this.tipoDescuento === 'porcentaje') {
    this.descuentoVenta = (this.subtotalVenta * this.porcentajeDescuento) / 100;
  } else {
    this.descuentoVenta = this.porcentajeDescuento;
  }
  
  this.calcularTotales();
}

canProcessPayment(): boolean {
  return this.clienteSeleccionado !== null && 
         this.carrito.length > 0 && 
         this.totalVenta > 0 &&
         !!this.nuevaVenta.tipoComprobante &&
         !!this.nuevaVenta.serieComprobante;
}

onComprobanteChange(): void {
  // Ajustar serie según tipo de comprobante
  if (this.nuevaVenta.tipoComprobante === 'BOLETA') {
    this.seriesComprobante = [
      { label: 'B001', value: 'B001' },
      { label: 'B002', value: 'B002' }
    ];
    this.nuevaVenta.serieComprobante = 'B001';
  } else if (this.nuevaVenta.tipoComprobante === 'FACTURA') {
    this.seriesComprobante = [
      { label: 'F001', value: 'F001' },
      { label: 'F002', value: 'F002' }
    ];
    this.nuevaVenta.serieComprobante = 'F001';
  } else {
    this.seriesComprobante = [
      { label: 'NV001', value: 'NV001' },
      { label: 'T001', value: 'T001' }
    ];
    this.nuevaVenta.serieComprobante = 'NV001';
  }
}

pagoRapido(metodoPago: string): void {
  if (!this.canProcessPayment()) return;
  
  this.iniciarPago();
  
  // Pre-seleccionar el método de pago
  setTimeout(() => {
    this.seleccionarMetodoPago(metodoPago);
  }, 300);
}



seleccionarMetodoPago(metodo: string): void {
  this.pagoActual.metodoPago = metodo;
  
  // Si es efectivo, actualizar el monto pagado para mostrar el vuelto
  if (metodo === 'EFECTIVO') {
    // Redondear a múltiplos de 10 para simular pago con billetes
    const montoRedondeado = Math.ceil(this.totalVenta / 10) * 10;
    this.montoPagado = montoRedondeado;
    this.calcularVuelto();
  }
}

cancelarPago(): void {
  this.pagoDialog = false;
  this.pasoPagoActual = 0;
}

isPagoValid(): boolean {
  if (this.montoPagado < this.totalVenta) {
    return false;
  }
  
  if (this.pagoActual.metodoPago === 'TARJETA_CREDITO' || 
      this.pagoActual.metodoPago === 'TARJETA_DEBITO') {
    if (!this.pagoActual.nombreTarjeta?.trim() || 
        !this.pagoActual.ultimos4Digitos?.trim()) {
      return false;
    }
  }
  
  if (this.pagoActual.metodoPago === 'TRANSFERENCIA' || 
      this.pagoActual.metodoPago === 'YAPE' || 
      this.pagoActual.metodoPago === 'PLIN') {
    if (!this.pagoActual.numeroReferencia?.trim()) {
      return false;
    }
  }
  
  return true;
}

// procesarVenta(): void {
//   if (!this.isPagoValid()) return;
  
//   this.procesandoPago = true;
//   this.pasoPagoActual = 2;
  
//   // Preparar detalles de la venta
//   this.nuevaVenta.detalles = this.carrito.map(item => ({
//     inventarioId: item.inventarioId,
//     cantidad: item.cantidad
//   }));

//   // Simular llamada al API
//   setTimeout(() => {
//     this.ventasService.registrarVenta(this.nuevaVenta)
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (venta) => {
//           // Procesar pago
//           this.pagoActual.ventaId = venta.id;
//           this.procesarPago(venta);
//         },
//         error: (error) => {
//           this.mostrarError('Error al procesar venta', error.message);
//           this.procesandoPago = false;
//           this.pasoPagoActual = 1;
//         }
//       });
//   }, 1500);
// }

cerrarComprobante(): void {
  this.comprobanteDialog = false;
  this.ventaParaComprobante = null;
}


descargarComprobantePDF(venta: any): void {
  this.mostrarInfo('Descargando', 'Generando archivo PDF del comprobante...');
}


// ==== SCANNER ====

activarScanner(): void {
  this.scannerActive = true;
  
  setTimeout(() => {
    this.iniciarCamara();
  }, 100);
}

cerrarScanner(): void {
  this.scannerActive = false;
  if (this.stream) {
    this.stream.getTracks().forEach(track => track.stop());
    this.stream = null;
  }
}

private iniciarCamara(): void {
  if (!this.videoElement) return;
  
  try {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        this.stream = stream;
        this.videoElement.nativeElement.srcObject = stream;
        
        // Aquí se implementaría la detección de códigos de barras
        // Se podría usar bibliotecas como QuaggaJS o zxing
      })
      .catch(err => {
        console.error('Error accediendo a la cámara:', err);
        this.mostrarError('Error de cámara', 'No se pudo acceder a la cámara');
        this.cerrarScanner();
      });
  } catch (err) {
    console.error('Error al iniciar el scanner:', err);
    this.mostrarError('Scanner no disponible', 'El scanner de códigos no está disponible');
    this.cerrarScanner();
  }
}

  // ====================  HEADER ================

  // Usuario actual
currentUser = {
  name: 'Emerson Rafael',
  role: 'Administrador de Ventas',
  avatar: '/assets/images/girl.jpg'
};

// Breadcrumb
breadcrumbHome = { icon: 'pi pi-home', routerLink: '/dashboard' };
breadcrumbItems = [
  { label: 'Dashboard', icon: 'pi pi-home', routerLink: '/dashboard' },
  { label: 'Ventas', icon: 'pi pi-shopping-cart' }
];

// Performance score para el knob
performanceScore = 96;

// Función para obtener tiempo actual
getCurrentTime(): Date {
  return this.currentTime;
}

// Actualizar tiempo cada segundo
private startTimeUpdate(): void {
  this.timeInterval = setInterval(() => {
    this.currentTime = new Date();
  }, 1000);
}

// Configurar shortcuts de teclado
private setupKeyboardShortcuts(): void {
  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey) return;
    
    switch(event.key) {
      case 'F1':
        event.preventDefault();
        this.nuevaVentaRapida();
        break;
      case 'F2':
        event.preventDefault();
        this.busquedaRapida();
        break;
      case 'F3':
        event.preventDefault();
        this.reportesRapidos();
        break;
      case 'F4':
        event.preventDefault();
        this.exportarRapido();
        break;
      case 'F5':
        event.preventDefault();
        this.configuracionRapida();
        break;
      case 'F6':
        event.preventDefault();
        this.toggleTheme();
        break;
    }
  });
}

// Funciones de acciones rápidas
nuevaVentaRapida(): void {
  this.activeTabIndex = 0;
  this.pasoActual = 0;
  this.limpiarFormularioVenta();
  this.mostrarExito('Nueva Venta', 'Iniciando nueva venta...');
  setTimeout(() => {
    this.codigoInput?.nativeElement?.focus();
  }, 100);
}

busquedaRapida(): void {
  this.mostrarInfo('Búsqueda Rápida', 'Función de búsqueda global activada');
}

reportesRapidos(): void {
  this.activeTabIndex = 2;
  this.mostrarInfo('Reportes', 'Navegando a la sección de reportes');
}

exportarRapido(): void {
  this.exportarReporte('excel');
}

configuracionRapida(): void {
  this.mostrarInfo('Configuración', 'Abriendo panel de configuración');
}

toggleTheme(): void {
  this.isDarkMode = !this.isDarkMode;
  document.documentElement.classList.toggle('dark', this.isDarkMode);
  this.mostrarInfo('Tema', `Modo ${this.isDarkMode ? 'oscuro' : 'claro'} activado`);
}

// Funciones de métricas
verDetalleVentasHoy(): void {
  const hoy = new Date();
  this.filtros.fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  this.filtros.fechaFin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);
  this.aplicarFiltrosVentas();
  this.activeTabIndex = 1;
  this.mostrarInfo('Ventas de Hoy', 'Mostrando ventas del día actual');
}

verPendientes(): void {
  this.filtros.estado = 'PENDIENTE';
  this.aplicarFiltrosVentas();
  this.activeTabIndex = 1;
  this.mostrarInfo('Ventas Pendientes', 'Mostrando ventas que requieren atención');
}

  // ============ pestanias ============
  // Navegación de pestañas
onTabChange(event: any): void {
  const tabIndex = event.index;
  this.activeTabIndex = tabIndex;
  
  // Cargar datos específicos de la pestaña
  switch(tabIndex) {
    case 0: // POS
      this.onPOSTabActivated();
      break;
    case 1: // Historial
      this.onHistorialTabActivated();
      break;
    case 2: // Reportes
      this.onReportesTabActivated();
      break;
    case 3: // Configuración
      this.onConfigTabActivated();
      break;
  }
  
  this.mostrarInfo('Navegación', `Cambiando a ${this.getTabName(tabIndex)}`);
}

// Funciones de activación de pestañas
onPOSTabActivated(): void {
  // Enfocar en el campo de búsqueda si existe
  setTimeout(() => {
    this.codigoInput?.nativeElement?.focus();
  }, 100);
}

onHistorialTabActivated(): void {
  // Refrescar datos del historial
  this.cargarVentas();
  this.calculateTabStats();
}

onReportesTabActivated(): void {
  this.loadingReportes = true;
  // Simular carga de reportes
  setTimeout(() => {
    this.loadingReportes = false;
    this.cargarEstadisticas();
  }, 1500);
}

onConfigTabActivated(): void {
  // Cargar configuraciones
  this.verificarConfiguracionesPendientes();
}

// Cálculos para estadísticas de pestañas
calculateTabStats(): void {
  const hoy = new Date();
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  
  // Ventas de hoy
  const ventasHoy = this.ventas.filter(v => 
    new Date(v.fechaCreacion) >= inicioHoy
  );
  
  this.ventasHoyCount = ventasHoy.length;
  this.montoTotalHoy = ventasHoy.reduce((sum, v) => sum + v.total, 0);
  
  // Ventas pendientes
  this.ventasPendientesCount = this.ventas.filter(v => 
    v.estado === 'PENDIENTE'
  ).length;
}

// Obtener progreso del paso actual
getPasoProgress(): number {
  return ((this.pasoActual + 1) / 4) * 100;
}

// Obtener estado de la pestaña actual
getTabStatus(): string {
  switch(this.activeTabIndex) {
    case 0:
      if (this.clienteSeleccionado && this.carrito.length > 0) {
        return 'Listo para procesar pago';
      } else if (this.clienteSeleccionado) {
        return 'Cliente seleccionado - Agregue productos';
      } else {
        return 'Seleccione un cliente para comenzar';
      }
    case 1:
      return `Mostrando ${this.ventasFiltradas.length} ventas`;
    case 2:
      return this.loadingReportes ? 'Cargando reportes...' : 'Reportes actualizados';
    case 3:
      return `${this.configPendientes} configuraciones pendientes`;
    default:
      return 'Sistema activo';
  }
}

// Obtener nombre de pestaña
getTabName(index: number): string {
  const names = ['Punto de Venta', 'Historial', 'Reportes', 'Configuración'];
  return names[index] || 'Desconocido';
}

// Configurar navegación con teclado
setupTabNavigation(): void {
  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey) {
      switch(event.key) {
        case '1':
          event.preventDefault();
          this.activeTabIndex = 0;
          break;
        case '2':
          event.preventDefault();
          this.activeTabIndex = 1;
          break;
        case '3':
          event.preventDefault();
          this.activeTabIndex = 2;
          break;
        case '4':
          event.preventDefault();
          this.activeTabIndex = 3;
          break;
      }
    }
    
    // Shortcuts específicos
    switch(event.key) {
      case 'F5':
        if (!event.ctrlKey) {
          event.preventDefault();
          this.refrescarPestanaActual();
        }
        break;
      case 'F1':
        if (!event.ctrlKey) {
          event.preventDefault();
          this.mostrarAyuda();
        }
        break;
      case 'F11':
        event.preventDefault();
        this.toggleFullscreen();
        break;
    }
  });
}

// Refrescar pestaña actual
refrescarPestanaActual(): void {
  switch(this.activeTabIndex) {
    case 0:
      this.limpiarFormularioVenta();
      break;
    case 1:
      this.cargarVentas();
      break;
    case 2:
      this.cargarEstadisticas();
      break;
    case 3:
      this.verificarConfiguracionesPendientes();
      break;
  }
  
  this.mostrarExito('Actualizado', 'Datos refrescados correctamente');
}

// Mostrar ayuda contextual
mostrarAyuda(): void {
  const ayudas = [
    'POS: Use F1 para nueva venta, escanee códigos o busque productos',
    'Historial: Filtre por fechas, estados o clientes específicos',
    'Reportes: Analice tendencias y exporte datos en múltiples formatos',
    'Configuración: Personalice el sistema según sus necesidades'
  ];
  
  this.mostrarInfo('Ayuda', ayudas[this.activeTabIndex]);
}

// Toggle fullscreen
toggleFullscreen(): void {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    this.isFullscreen = true;
  } else {
    document.exitFullscreen();
    this.isFullscreen = false;
  }
}

// Verificar configuraciones pendientes
verificarConfiguracionesPendientes(): void {
  // Lógica para verificar configuraciones pendientes
  // Por ahora es un número simulado
  this.configPendientes = Math.floor(Math.random() * 5);
}




  // ==================== INICIALIZACIÓN ====================
  
  private loadPermissions(): void {
    this.canCreate = this.permissionService.canCreate('ventas');
    this.canEdit = this.permissionService.canEdit('ventas');
    this.canDelete = this.permissionService.canDelete('ventas');
    this.canViewReports = this.permissionService.canView('reportes');
  }

  private initNuevaVenta(): VentaRequest {
    return {
      clienteId: 0,
      usuarioId: 1, // TODO: obtener del servicio de autenticación
      tipoComprobante: 'BOLETA',
      serieComprobante: 'B001',
      observaciones: '',
      detalles: []
    };
  }
  
  private initPago(): PagoRequest {
    return {
      ventaId: 0,
      usuarioId: 1,
      monto: 0,
      metodoPago: 'EFECTIVO',
      numeroReferencia: '',
      nombreTarjeta: '',
      ultimos4Digitos: '',
      observaciones: ''
    };
  }
  
  private initFiltros(): FiltrosVentas {
    return {
      fechaInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      fechaFin: new Date(),
      cliente: '',
      estado: '',
      tipoComprobante: '',
      metodoPago: ''
    };
  }
  
  private initEstadisticas(): EstadisticasVentas {
    return {
      totalVentasHoy: 0,
      montoVentasHoy: 0,
      ventasEsteMes: 0,
      montoEsteMes: 0,
      productoMasVendido: '',
      clienteFrecuente: '',
      ventasPendientes: 0,
      pagosContado: 0,
      pagosCredito: 0
    };
  }

  private initChartOptions(): void {
    this.chartOptions = {
      plugins: {
        legend: {
          labels: {
            usePointStyle: true,
            color: '#495057'
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#495057'
          },
          grid: {
            color: '#ebedef'
          }
        },
        y: {
          ticks: {
            color: '#495057'
          },
          grid: {
            color: '#ebedef'
          }
        }
      }
    };
  }

  // ==================== CARGA DE DATOS ====================
  
  private cargarDatosIniciales(): void {
    this.cargarClientes();
    this.cargarProductos();
    this.cargarVentas();
    this.cargarInventarios();
  }

  private cargarClientes(): void {
    this.clienteService.listar()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.clientes = data;
          this.clientesFiltrados = data;
        },
        error: (error) => this.mostrarError('Error al cargar clientes', error.message)
      });
  }

  private cargarProductos(): void {
    this.productoService.getProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.productos = data;
        },
        error: (error: any) => this.mostrarError('Error al cargar productos', error.message)
      });
  }

  private cargarInventarios(): void {
    this.inventarioService.obtenerInventarios()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Handle both array and PagedResponse cases
          this.inventarios = Array.isArray(response) ? response : (response.contenido || []);
        },
        error: (error) => this.mostrarError('Error al cargar inventario', error.message)
      });
  }

  private cargarVentas(): void {
    this.loading = true;
    this.ventasService.listar()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.ventas = data;
          this.aplicarFiltrosVentas();
          this.loading = false;
        },
        error: (error) => {
          this.mostrarError('Error al cargar ventas', error.message);
          this.loading = false;
        }
      });
  }

  private cargarEstadisticas(): void {
    // TODO: Implementar servicios específicos para estadísticas
    // Por ahora calculamos básicas desde las ventas cargadas
    this.calcularEstadisticasBasicas();
  }

  private calcularEstadisticasBasicas(): void {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    const ventasHoy = this.ventas.filter(v => 
      new Date(v.fechaCreacion).toDateString() === hoy.toDateString()
    );
    
    const ventasMes = this.ventas.filter(v => 
      new Date(v.fechaCreacion) >= inicioMes
    );

    this.estadisticas = {
      totalVentasHoy: ventasHoy.length,
      montoVentasHoy: ventasHoy.reduce((sum, v) => sum + v.total, 0),
      ventasEsteMes: ventasMes.length,
      montoEsteMes: ventasMes.reduce((sum, v) => sum + v.total, 0),
      productoMasVendido: 'Calculating...',
      clienteFrecuente: 'Calculating...',
      ventasPendientes: this.ventas.filter(v => v.estado === 'PENDIENTE').length,
      pagosContado: 0,
      pagosCredito: 0
    };
  }

  private inicializarChart(): void {
    // Datos de ejemplo para el chart de ventas
    this.chartVentas = {
      labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
      datasets: [
        {
          label: 'Ventas 2024',
          data: [65, 59, 80, 81, 56, 55],
          fill: false,
          backgroundColor: '#3b82f6',
          borderColor: '#3b82f6',
          tension: 0.4
        }
      ]
    };
  }

  // ==================== POS - GESTIÓN DE CLIENTES ====================
  
  buscarClientes(event: any): void {
    const query = event.query.toLowerCase();
    this.clientesFiltrados = this.clientes.filter(cliente => 
      cliente.nombres?.toLowerCase().includes(query) ||
      cliente.apellidos?.toLowerCase().includes(query) ||
      cliente.dni?.includes(query) ||
      cliente.ruc?.includes(query)
    );
  }

  seleccionarCliente(event: any): void {
    // Extraer el cliente del evento
    const cliente = event.value || event;
    this.clienteSeleccionado = cliente;
    this.nuevaVenta.clienteId = cliente.id!;
    this.pasoActual = 1;
    this.mostrarExito('Cliente seleccionado', `${cliente.nombres} ${cliente.apellidos}`);
    setTimeout(() => {
      this.codigoInput?.nativeElement?.focus();
    }, 100);
  }


  limpiarClienteSeleccionado(): void {
    this.clienteSeleccionado = null;
    this.nuevaVenta.clienteId = 0;
    this.pasoActual = 0;
  }

  // ==================== POS - GESTIÓN DE PRODUCTOS ====================
  
  buscarProductoPorCodigo(): void {
    if (!this.codigoBusqueda.trim()) return;
    
    const inventario = this.inventarios.find(inv => 
      inv.serie === this.codigoBusqueda ||
      inv.producto?.codigo === this.codigoBusqueda
    );
    
    if (inventario) {
      this.agregarProductoAlCarrito(inventario);
      this.codigoBusqueda = '';
      this.cantidadInput = 1;
    } else {
      this.mostrarError('Producto no encontrado', 'El código ingresado no existe en el inventario');
    }
  }

  buscarProductosAutoComplete(event: any): void {
    const query = event.query.toLowerCase();
    this.productosAutoComplete = this.inventarios.filter(inv => 
      inv.producto?.nombre?.toLowerCase().includes(query) ||
      inv.producto?.codigo?.toLowerCase().includes(query) ||
      inv.producto?.precioVenta?.toString().includes(query) ||
      inv.serie?.toLowerCase().includes(query)
    ).map(inv => ({
      ...inv,
      displayLabel: `${inv.producto?.nombre} - ${inv.color?.nombre} - ${inv.talla?.numero} - ${inv.producto?.codigo} - ${inv.producto?.precioVenta} (${inv.serie})`
    }));
  }

  seleccionarProductoAutoComplete(producto: any): void {
    this.agregarProductoAlCarrito(producto);
  }

  agregarProductoAlCarrito(inventario: any): void {
    if (!this.clienteSeleccionado) {
      this.mostrarError('Cliente requerido', 'Debe seleccionar un cliente antes de agregar productos');
      return;
    }

    if (inventario.stock < this.cantidadInput) {
      this.mostrarError('Stock insuficiente', `Solo hay ${inventario.stock} unidades disponibles`);
      return;
    }

    const itemExistente = this.carrito.find(item => item.inventarioId === inventario.id);
    
    if (itemExistente) {
      const nuevaCantidad = itemExistente.cantidad + this.cantidadInput;
      if (nuevaCantidad > inventario.stock) {
        this.mostrarError('Stock insuficiente', `Solo hay ${inventario.stock} unidades disponibles`);
        return;
      }
      itemExistente.cantidad = nuevaCantidad;
      itemExistente.subtotal = itemExistente.cantidad * itemExistente.precioUnitario;
    } else {
      const nuevoItem: ItemCarrito = {
        inventarioId: inventario.id,
        producto: inventario.producto,
        color: inventario.color,
        talla: inventario.talla,
        cantidad: this.cantidadInput,
        precioUnitario: inventario.precioVenta || 0,
        subtotal: this.cantidadInput * (inventario.precioVenta || 0),
        stock: inventario.stock,
        codigoCompleto: inventario.serie
      };
      this.carrito.push(nuevoItem);
    }

    this.calcularTotales();
    this.mostrarExito('Producto agregado', `${inventario.producto?.nombre} añadido al carrito`);
    
    // Resetear entrada
    this.cantidadInput = 1;
    setTimeout(() => {
      this.codigoInput?.nativeElement?.focus();
    }, 100);
  }

  actualizarCantidadItem(item: ItemCarrito, nuevaCantidad: number): void {
    if (nuevaCantidad <= 0) {
      this.eliminarItemCarrito(item);
      return;
    }
    
    if (nuevaCantidad > item.stock) {
      this.mostrarError('Stock insuficiente', `Solo hay ${item.stock} unidades disponibles`);
      return;
    }
    
    item.cantidad = nuevaCantidad;
    item.subtotal = item.cantidad * item.precioUnitario;
    this.calcularTotales();
  }

  eliminarItemCarrito(item: ItemCarrito): void {
    const index = this.carrito.indexOf(item);
    if (index > -1) {
      this.carrito.splice(index, 1);
      this.calcularTotales();
      this.mostrarInfo('Producto eliminado', 'Item removido del carrito');
    }
  }

  limpiarCarrito(): void {
    this.confirmationService.confirm({
      header: 'Confirmar limpieza',
      message: '¿Está seguro que desea limpiar todo el carrito?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, limpiar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.carrito = [];
        this.calcularTotales();
        this.pasoActual = 1;
        this.mostrarInfo('Carrito limpiado', 'Todos los productos han sido removidos');
      }
    });
  }

  private calcularTotales(): void {
    this.subtotalVenta = this.carrito.reduce((sum, item) => sum + item.subtotal, 0);
    this.igvVenta = this.subtotalVenta * this.igvPorcentaje;
    this.totalVenta = this.subtotalVenta + this.igvVenta;
    
    if (this.carrito.length > 0) {
      this.pasoActual = 2;
    }
  }

  // ==================== GESTIÓN DE PAGOS ====================
  
  iniciarPago(): void {
    if (!this.clienteSeleccionado) {
      this.mostrarError('Cliente requerido', 'Debe seleccionar un cliente');
      return;
    }
    
    if (this.carrito.length === 0) {
      this.mostrarError('Carrito vacío', 'Debe agregar productos antes de procesar el pago');
      return;
    }
    
    this.pagoActual = this.initPago();
    this.pagoActual.monto = this.totalVenta;
    this.montoPagado = this.totalVenta;
    this.calcularVuelto();
    this.pagoDialog = true;
  }

  calcularVuelto(): void {
    this.vuelto = Math.max(0, this.montoPagado - this.totalVenta);
  }

  procesarVenta(): void {
    if (!this.validarVenta()) return;
    
    this.procesandoPago = true;
    
    // Preparar detalles de la venta
    this.nuevaVenta.detalles = this.carrito.map(item => ({
      inventarioId: item.inventarioId,
      cantidad: item.cantidad
    }));

    this.ventasService.registrarVenta(this.nuevaVenta)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (venta) => {
          // Procesar pago
          this.pagoActual.ventaId = venta.id;
          this.procesarPago(venta);
        },
        error: (error) => {
          this.mostrarError('Error al procesar venta', error.message);
          this.procesandoPago = false;
        }
      });
  }

  private procesarPago(venta: VentaResponse): void {
    this.pagosService.registrarPago(this.pagoActual)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pago) => {
          this.mostrarExito('Venta procesada', `Venta ${venta.numeroVenta} creada exitosamente`);
          this.pagoDialog = false;
          this.procesandoPago = false;
          this.pasoActual = 3;
          
          // Mostrar comprobante
          this.ventaParaComprobante = venta;
          this.comprobanteDialog = true;
          
          // Limpiar formulario
          this.limpiarFormularioVenta();
          
          // Recargar datos
          this.cargarVentas();
          this.cargarEstadisticas();
        },
        error: (error) => {
          this.mostrarError('Error al procesar pago', error.message);
          this.procesandoPago = false;
        }
      });
  }

  private validarVenta(): boolean {
    if (!this.clienteSeleccionado) {
      this.mostrarError('Cliente requerido', 'Debe seleccionar un cliente');
      return false;
    }
    
    if (this.carrito.length === 0) {
      this.mostrarError('Productos requeridos', 'Debe agregar al menos un producto');
      return false;
    }
    
    if (this.pagoActual.monto <= 0) {
      this.mostrarError('Monto inválido', 'El monto del pago debe ser mayor a 0');
      return false;
    }
    
    if (this.montoPagado < this.totalVenta) {
      this.mostrarError('Pago insuficiente', 'El monto pagado debe cubrir el total de la venta');
      return false;
    }
    
    return true;
  }

  private limpiarFormularioVenta(): void {
    this.nuevaVenta = this.initNuevaVenta();
    this.clienteSeleccionado = null;
    this.carrito = [];
    this.calcularTotales();
    this.pasoActual = 0;
    this.codigoBusqueda = '';
    this.cantidadInput = 1;
  }

  // ==================== HISTORIAL DE VENTAS ====================
  
  aplicarFiltrosVentas(): void {
    let ventasFiltradas = [...this.ventas];
    
    if (this.filtros.fechaInicio) {
      ventasFiltradas = ventasFiltradas.filter(v => 
        new Date(v.fechaCreacion) >= this.filtros.fechaInicio!
      );
    }
    
    if (this.filtros.fechaFin) {
      const fechaFin = new Date(this.filtros.fechaFin);
      fechaFin.setHours(23, 59, 59, 999);
      ventasFiltradas = ventasFiltradas.filter(v => 
        new Date(v.fechaCreacion) <= fechaFin
      );
    }
    
    if (this.filtros.cliente) {
      const clienteQuery = this.filtros.cliente.toLowerCase();
      ventasFiltradas = ventasFiltradas.filter(v => 
        v.cliente.nombres.toLowerCase().includes(clienteQuery) ||
        v.cliente.apellidos.toLowerCase().includes(clienteQuery) ||
        v.cliente.documento.includes(clienteQuery)
      );
    }
    
    if (this.filtros.estado) {
      ventasFiltradas = ventasFiltradas.filter(v => v.estado === this.filtros.estado);
    }
    
    if (this.filtros.tipoComprobante) {
      ventasFiltradas = ventasFiltradas.filter(v => v.tipoComprobante === this.filtros.tipoComprobante);
    }
    
    this.ventasFiltradas = ventasFiltradas;
  }

  limpiarFiltros(): void {
    this.filtros = this.initFiltros();
    this.aplicarFiltrosVentas();
  }

  verDetalleVenta(venta: VentaResponse): void {
    this.ventaParaComprobante = venta;
    this.comprobanteDialog = true;
  }

  // ==================== DEVOLUCIONES ====================
  
  iniciarDevolucion(venta: VentaResponse): void {
    if (venta.estado !== 'PAGADA') {
      this.mostrarError('Devolución no permitida', 'Solo se pueden devolver ventas pagadas');
      return;
    }
    
    this.ventaDevolucion = venta;
    this.itemsDevolucion = venta.detalles.map(detalle => ({
      ...detalle,
      cantidadDevolver: 0,
      seleccionado: false
    }));
    this.motivoDevolucion = '';
    this.devolucionDialog = true;
  }

  procesarDevolucion(): void {
    const itemsADevolver = this.itemsDevolucion.filter(item => 
      item.seleccionado && item.cantidadDevolver > 0
    );
    
    if (itemsADevolver.length === 0) {
      this.mostrarError('Items requeridos', 'Debe seleccionar al menos un item para devolver');
      return;
    }
    
    // TODO: Implementar servicio de devoluciones
    this.confirmationService.confirm({
      header: 'Confirmar devolución',
      message: `¿Está seguro que desea procesar la devolución de ${itemsADevolver.length} item(s)?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, procesar',
      rejectLabel: 'Cancelar',
      accept: () => {
        // Aquí iría la lógica de devolución
        this.mostrarExito('Devolución procesada', 'La devolución ha sido registrada exitosamente');
        this.devolucionDialog = false;
        this.cargarVentas();
      }
    });
  }

  // ==================== REPORTES ====================
  
  mostrarReportes(): void {
    if (!this.canViewReports) {
      this.mostrarError('Sin permisos', 'No tiene permisos para ver reportes');
      return;
    }
    this.reportesDialog = true;
  }

  exportarReporte(tipo: string): void {
    // TODO: Implementar exportación de reportes
    this.mostrarInfo('Exportando', `Generando reporte de ${tipo}...`);
  }

  // ==================== UTILIDADES ====================
  
  getSeverityEstado(estado: string): string {
    switch (estado) {
      case 'PAGADA': return 'success';
      case 'PENDIENTE': return 'warning';
      case 'ANULADA': return 'danger';
      case 'DEVUELTA': return 'info';
      default: return 'secondary';
    }
  }

  getIconEstado(estado: string): string {
    switch (estado) {
      case 'PAGADA': return 'pi pi-check-circle';
      case 'PENDIENTE': return 'pi pi-clock';
      case 'ANULADA': return 'pi pi-times-circle';
      case 'DEVUELTA': return 'pi pi-refresh';
      default: return 'pi pi-circle';
    }
  }

  formatearMoneda(monto: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(monto);
  }

  // ==================== MENSAJES ====================
  
  private mostrarExito(summary: string, detail: string): void {
    this.messageService.add({ 
      severity: 'success', 
      summary, 
      detail,
      life: 3000
    });
  }

  private mostrarError(summary: string, detail: string): void {
    this.messageService.add({ 
      severity: 'error', 
      summary, 
      detail,
      life: 5000
    });
  }

  private mostrarInfo(summary: string, detail: string): void {
    this.messageService.add({ 
      severity: 'info', 
      summary, 
      detail,
      life: 4000
    });
  }

  // Añadir estas funciones al componente TypeScript

// Función para cambio de método de pago
onMetodoPagoChange(): void {
  // Limpiar campos específicos cuando cambia el método
  this.pagoActual.numeroReferencia = '';
  this.pagoActual.nombreTarjeta = '';
  this.pagoActual.ultimos4Digitos = '';
}

// Función para trackBy del carrito
trackByInventarioId(index: number, item: ItemCarrito): number {
  return item.inventarioId;
}

// Función para imprimir comprobante
imprimirComprobante(venta: VentaResponse): void {
  // TODO: Implementar impresión
  this.mostrarInfo('Imprimiendo', 'Enviando comprobante a la impresora...');
}

// Función para enviar por email
enviarComprobantePorEmail(venta: VentaResponse): void {
  // TODO: Implementar envío por email
  this.mostrarInfo('Enviando', 'Enviando comprobante por email...');
}

// Función para mostrar menú de venta
mostrarMenuVenta(event: Event, venta: VentaResponse): void {
  this.itemsMenuAcciones = [
    {
      label: 'Ver Detalle',
      icon: 'pi pi-eye',
      command: () => this.verDetalleVenta(venta)
    },
    {
      label: 'Imprimir',
      icon: 'pi pi-print',
      command: () => this.imprimirComprobante(venta)
    },
    {
      label: 'Enviar por Email',
      icon: 'pi pi-envelope',
      command: () => this.enviarComprobantePorEmail(venta)
    },
    { separator: true },
    {
      label: 'Procesar Devolución',
      icon: 'pi pi-refresh',
      command: () => this.iniciarDevolucion(venta),
      visible: venta.estado === 'PAGADA'
    }
  ];
  this.menuAcciones.toggle(event);
}

// Función para obtener fecha actual
getCurrentDate(): Date {
  return new Date();
}

// Agregar estas funciones al componente TypeScript

// Funciones para el resumen de devolución
getItemsSeleccionados(): number {
  if (!this.itemsDevolucion) return 0;
  return this.itemsDevolucion.filter(item => item.seleccionado).length;
}

getCantidadTotalDevolver(): number {
  if (!this.itemsDevolucion) return 0;
  return this.itemsDevolucion.reduce((total, item) => {
    return total + (item.seleccionado ? (item.cantidadDevolver || 0) : 0);
  }, 0);
}

getMontoTotalDevolver(): number {
  if (!this.itemsDevolucion) return 0;
  return this.itemsDevolucion.reduce((total, item) => {
    return total + (item.seleccionado ? ((item.cantidadDevolver || 0) * item.precioUnitario) : 0);
  }, 0);
}

isDevolucionValid(): boolean {
  if (!this.motivoDevolucion?.trim()) return false;
  if (!this.itemsDevolucion) return false;
  
  const itemsValidos = this.itemsDevolucion.filter(item => 
    item.seleccionado && (item.cantidadDevolver || 0) > 0
  );
  
  return itemsValidos.length > 0;
}

// ==== UTILIDADES ====

getTipoComprobanteLabel(tipo: string): string {
  const tipoFind = this.tiposComprobante.find(t => t.value === tipo);
  return tipoFind ? tipoFind.label : tipo;
}

getMetodoPagoLabel(tipo: string): string {
  const metodoFind = this.metodosPago.find(m => m.value === tipo);
  return metodoFind ? metodoFind.label : tipo;
}

getMetodoPagoIcon(tipo: string): string {
  switch(tipo) {
    case 'EFECTIVO': return 'pi pi-wallet';
    case 'TARJETA_CREDITO': return 'pi pi-credit-card';
    case 'TARJETA_DEBITO': return 'pi pi-credit-card';
    case 'TRANSFERENCIA': return 'pi pi-send';
    case 'YAPE': return 'pi pi-mobile';
    case 'PLIN': return 'pi pi-mobile';
    default: return 'pi pi-money-bill';
  }
}

getTotalItems(): number {
  return this.carrito.reduce((sum, item) => sum + item.cantidad, 0);
}


}
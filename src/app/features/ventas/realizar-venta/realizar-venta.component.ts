import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener, inject, ChangeDetectorRef, ChangeDetectionStrategy, TrackByFunction } from '@angular/core';
import { VentaRequest, VentaResponse } from '../../../core/models/venta.model';
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

import { InputTextModule } from 'primeng/inputtext';
import { TabViewModule } from 'primeng/tabview';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputMaskModule } from 'primeng/inputmask';
import { CheckboxModule } from 'primeng/checkbox';
import { MenuModule } from 'primeng/menu';
import { PermissionService, PermissionType } from '../../../core/services/permission.service';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PagoRequest, PagoResponse } from '../../../core/models/pago.model';
import { Inventario } from '../../../core/models/inventario.model';


// Componentes modulares
import { HeaderVentasComponent } from './components/header-ventas/header-ventas.component';
import { SkeletonLoaderComponent } from './components/skeleton-loader/skeleton-loader.component';

import { MetricaVenta } from './components/metrics/metric-card.interface';
import { UserInfo } from './components/user-info/user-info-card.component';
import { HistorialVentasComponent } from "./components/historial-ventas/historial-ventas.component";
import { ReportesComponent } from "./components/reporte-ventas/reporte-ventas.component";
import { ConfiguracionComponent } from './components/configuracion/configuracion.component';

import { environment } from '../../../../environments/environment';
import { Color, Talla } from '../../../core/models/colors.model';
import { ChartData, ChartOptions } from 'chart.js';
import { PosVentasComponent } from './components/pos-ventas/pos-ventas.component';
import { ToastNotificationComponent } from '../../../shared/components/toast-notification/toast-notification.component';
import { ToastService } from '../../../shared/services/toast.service';
import { ComprobantesService } from '../../../core/services/comprobantes.service';


interface OpcionSelect {
  label: string;
  value: string;
}

interface ItemCarrito {
  inventarioId: number;
  producto: Producto;
  color: Color;
  talla: Talla;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  stock: number;
  codigoCompleto: string;
}

// Agregar esta interfaz después de ItemCarrito
interface ItemDevolucion extends ItemCarrito {
  cantidadDevolver: number;
  seleccionado: boolean;
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

// Agregar interfaz Tendencia
interface Tendencia {
  direccion: 'up' | 'down' | 'neutral';
  porcentaje: number;
  periodo: string;
}

@Component({
  selector: 'app-ventas',
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    DialogModule,
    ConfirmDialogModule,
    InputTextModule,
    TabViewModule,
    InputNumberModule,
    InputMaskModule,
    CheckboxModule,
    MenuModule,
    // Componentes modulares
    HeaderVentasComponent,
    SkeletonLoaderComponent,
    PosVentasComponent,
    HistorialVentasComponent,
    ReportesComponent,
    ToastNotificationComponent,
    ConfiguracionComponent
],
  templateUrl: './realizar-venta.component.html',
  styleUrls: ['./realizar-venta.component.scss'],
  providers: [MessageService, ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RealizarVentaComponent implements OnInit, OnDestroy {

  @ViewChild('codigoInput') codigoInput!: ElementRef;
  @ViewChild('menuAcciones') menuAcciones!: ElementRef;
  @ViewChild(PosVentasComponent) posComponent!: PosVentasComponent;

  // Inyección de servicios modernos
  public toastService = inject(ToastService);

   private cdr = inject(ChangeDetectorRef);

  // Estados de carga
  isLoading: boolean = false;
  loadingReportes: boolean = false;

  // Nueva propiedad para las métricas
  metricas: MetricaVenta[] = [];
  showDashboard = false;


  // Métodos para TabView optimizado
    abrirSelectorCliente(): void {
      this.mostrarInfo('Selector de cliente', 'Abriendo selector de clientes...');
      // Aquí podrías abrir un modal o enfocar el input de búsqueda
    }

    quitarCliente(): void {
      this.clienteSeleccionado = null;
      this.mostrarInfo('Cliente eliminado', 'Se ha quitado el cliente de la venta');
    }

    seleccionarMetodo(alias: string): void {
      const map: Record<string, string> = {
        efectivo: 'EFECTIVO',
        tarjeta: 'TARJETA_CREDITO',
        credito: 'CREDITO'
      };
      const metodo = map[alias] || alias;
      this.seleccionarMetodoPago(metodo);
    }

    cancelarVenta(): void {
      this.carrito = [];
      this.subtotalVenta = 0;
      this.totalVenta = 0;
      this.nuevaVenta = this.initNuevaVenta();
      this.clienteSeleccionado = null;
      this.mostrarInfo('Venta cancelada', 'La venta actual ha sido cancelada');
    }

    finalizarVenta(): void {
      if (!this.canProcessPayment()) {
        this.mostrarError('No se puede cobrar', 'Falta información: cliente, productos o comprobante');
        return;
      }
      this.pagoDialog = true;
    }

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
  private timeInterval: ReturnType<typeof setInterval> | undefined;
  
  // Para gestionar suscripciones
  private destroy$ = new Subject<void>();
  
  // Vista activa
  activeTabIndex = 0;
  
  // Control de estado de caja
  cajaAbierta = false;
  
  // 
  showKeyboardHelp = false;

   // Estado del panel de atajos
  mostrarPanelAtajos = false;

    // Auto-hide del panel
  private panelAtajosTimeout: ReturnType<typeof setTimeout> | undefined;

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
  productosAutoComplete: Inventario[] = [];
  carrito: ItemCarrito[] = [];
  
  // Variables de entrada
  codigoBusqueda = '';
  cantidadInput = 1;
  
  // Cálculos
  subtotalVenta = 0;
  totalVenta = 0;
  
  // ==================== PAGO ====================
  procesandoPago = false;
  pagoDialog = false;
  pagoActual: PagoRequest = this.initPago();
  montoPagado = 0;
  vuelto = 0;
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
  chartVentas: ChartData = {
    labels: [],
    datasets: []
  };
  chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false
  };
  reportesDialog = false;
  
  // ==================== DEVOLUCIONES ====================
  devolucionDialog = false;
  ventaDevolucion: VentaResponse | null = null;
  itemsDevolucion: ItemDevolucion[] = [];
  motivoDevolucion = '';
  
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
  pasoActual = 0;

  tabsInfo = [
    { icon: 'pi pi-shopping-cart', label: 'Punto de Venta', shortLabel: 'POS' },
    { icon: 'pi pi-history', label: 'Historial de Ventas', shortLabel: 'Historial' },
    { icon: 'pi pi-chart-bar', label: 'Reportes y Analytics', shortLabel: 'Reportes' },
    { icon: 'pi pi-cog', label: 'Configuración', shortLabel: 'Config' }
  ];

  
  
  // Estados de pestañas
  ventasPendientesCount = 0;
  ventasHoyCount = 0;
  montoTotalHoy = 0;
  configPendientes = 2;
  isFullscreen = false;

  // Lista de productos populares / recientes
productosPopulares: Inventario[] = [];

// Cliente recientemente buscado
clienteBusqueda: Cliente | null = null;
productoBusqueda: Producto | null = null;

// Variables para descuentos
aplicarDescuento = false;
porcentajeDescuento = 0;
descuentoVenta = 0;
tipoDescuento: 'porcentaje' | 'monto' = 'porcentaje';

// Variables para el scanner
scannerActive = false;
videoElement!: ElementRef;
stream: MediaStream | null = null;

  loadingImpresion = false;


  // Variables optimizadas

  private ventasService: VentasService = inject(VentasService);
  private pagosService: PagosService = inject(PagosService);
  private clienteService: ClienteService = inject(ClienteService);
  private productoService: ProductoService = inject(ProductoService);
  private inventarioService: InventarioService = inject(InventarioService);
  private comprobantesService: ComprobantesService = inject(ComprobantesService);
  private messageService: MessageService = inject(MessageService);
  private confirmationService: ConfirmationService = inject(ConfirmationService);
  private permissionService: PermissionService = inject(PermissionService);
  private changeDetectorRef: ChangeDetectorRef = inject(ChangeDetectorRef);

  
  constructor(
   
  ) {
    this.initChartOptions();
    this.mostrarPanelBienvenida();

  }

  ngOnInit() {
    this.loadPermissions();
    this.inicializarEstadoCaja(); // Nuevo método para gestionar estado de caja
    this.cargarDatosIniciales();
      // ✅ FORZAR CARGA DE PRODUCTOS DIRECTAMENTE
    setTimeout(() => {
      console.log('🚨 FORZAR CARGA DE PRODUCTOS...');
      this.cargarProductos();
    }, 1000);
  
    this.cargarEstadisticas();
    this.inicializarChart();
    this.startTimeUpdate();
    this.setupTabNavigation();
    this.calculateTabStats();
    this.cargarProductosPopulares();
    this.cargarClientesRecientes();
    this.inicializarMetricas();
    // this.initAudio(); // Lo agregaremos después
    this.setupKeyboardShortcuts();
    this.inicializarComponente();
    this.configurarActualizacionesTiempoReal();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
    this.cerrarScanner();
    
    // ⚠️ NO limpiar el estado de caja aquí
    // El estado debe persistir entre navegaciones
    // Solo se limpia con cerrarCaja() o al cambiar de día
    console.log('🔄 Componente destruido, pero estado de caja se mantiene en localStorage');
  }


  
    analizarIngresos(): void {
      console.log('Analizar ingresos');
    }
  
    optimizarPerformance(): void {
      console.log('Optimizar performance');
    }

    // Método para optimizar el *ngFor
    trackByMetricaId(index: number, metrica: MetricaVenta): string {
      return metrica.id;
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
    producto.producto!.imagen = `/assets/images/product-${(index % 4) + 1}.jpg`;
  });
}

  seleccionarProductoPopular(inventario: Inventario): void {
  if (!this.clienteSeleccionado) {
    this.mostrarError('Cliente requerido', 'Debe seleccionar un cliente primero');
    return;
  }
  
  this.agregarProductoAlCarrito(inventario);
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

onClienteSelect(event: { value: Cliente }): void {
  if (event && event.value && event.value.id) {
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
  } else {
    if (this.tipoDescuento === 'porcentaje') {
      this.descuentoVenta = (this.subtotalVenta * this.porcentajeDescuento) / 100;
    } else {
      this.descuentoVenta = this.porcentajeDescuento;
    }
  }
  
  console.log('💰 CÁLCULO DE DESCUENTO:', {
    aplicarDescuento: this.aplicarDescuento,
    tipoDescuento: this.tipoDescuento,
    porcentajeDescuento: this.porcentajeDescuento,
    subtotalVenta: this.subtotalVenta,
    descuentoCalculado: this.descuentoVenta
  });
  
  // Recalcular totales con el nuevo descuento
  this.totalVenta = this.subtotalVenta - this.descuentoVenta;
}

canProcessPayment(): boolean {
  return this.clienteSeleccionado !== null && 
         this.carrito.length > 0 && 
         this.totalVenta > 0 &&
         !!this.nuevaVenta.tipoComprobante &&
         !!this.nuevaVenta.serieComprobante;
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
  console.log('❌ Intentando cancelar pago...');
  
  // ✅ SI ESTÁ PROCESANDO, PEDIR CONFIRMACIÓN
  if (this.procesandoPago) {
    const confirmar = confirm('⚠️ Se está procesando el pago. ¿Está seguro de cancelar?');
    
    if (!confirmar) {
      console.log('🛑 Cancelación abortada por el usuario');
      return;
    }
    
    console.log('🛑 Forzando cancelación durante procesamiento');
  }
  
  // ✅ RESETEAR ESTADO COMPLETO
  this.procesandoPago = false;
  this.pagoDialog = false;
  
  // ✅ LIMPIAR ESTADO DE PAGO
  this.resetearEstadoPago();
  
  // ✅ MENSAJE APROPIADO
  const mensaje = this.procesandoPago ? 
    'Procesamiento de pago cancelado forzadamente' : 
    'Pago cancelado correctamente';
    
  this.messageService.add({
    severity: this.procesandoPago ? 'warn' : 'info',
    summary: this.procesandoPago ? '🛑 Cancelación Forzada' : 'ℹ️ Pago Cancelado',
    detail: mensaje,
    life: 4000
  });
  
  console.log('✅ Cancelación de pago completada');
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

cerrarComprobante(): void {
  this.comprobanteDialog = false;
  this.ventaParaComprobante = null;
}


descargarComprobantePDF(venta: VentaResponse): void {
  if (!venta?.id) {
    this.toastService.error('❌ Error', 'No se puede descargar el comprobante: Venta inválida');
    return;
  }

  const nombreArchivo = `comprobante-${venta.numeroVenta}.pdf`;
  console.log('🔽 [PARENT] Iniciando descarga PDF para venta:', venta.id, 'Archivo:', nombreArchivo);
  
  // Mostrar notificación de inicio
  this.toastService.info('⏳ Descargando', `Generando archivo PDF: ${nombreArchivo}`, { duration: 2000 });

  // Primero obtener el comprobante asociado a la venta
  this.comprobantesService.obtenerComprobantePorVenta(venta.id).subscribe({
    next: (comprobante) => {
      console.log('✅ [PARENT] Comprobante encontrado:', comprobante);
      
      // Descargar el PDF del comprobante
      this.comprobantesService.descargarPDF(comprobante.id).subscribe({
        next: (blob) => {
          try {
            // Descargar el archivo usando la utilidad del servicio
            this.comprobantesService.descargarArchivo(blob, nombreArchivo);
            
            // Notificación de éxito
            this.toastService.success(
              '✅ Descarga Completada', 
              `El comprobante ${nombreArchivo} se ha descargado exitosamente`,
              { duration: 3000 }
            );
            
            console.log('✅ [PARENT] PDF descargado exitosamente:', nombreArchivo);
            
          } catch (error) {
            console.error('❌ [PARENT] Error procesando descarga:', error);
            this.toastService.error(
              '❌ Error de Descarga',
              'Hubo un problema al procesar el archivo descargado',
              { duration: 4000 }
            );
          }
        },
        error: (error) => {
          console.error('❌ [PARENT] Error descargando PDF:', error);
          this.toastService.error(
            '❌ Error de Descarga',
            `No se pudo descargar el PDF: ${error.message || 'Error desconocido'}`,
            { duration: 4000 }
          );
        }
      });
    },
    error: (error) => {
      console.error('❌ [PARENT] Error obteniendo comprobante:', error);
      console.log('🔍 [PARENT] Status del error:', error.status);
      console.log('🔍 [PARENT] Mensaje del error:', error.message);
      
      // Si no existe el comprobante (404), intentar generarlo automáticamente
      const esComprobanteFaltante = error.status === 404 || 
                                   error.message?.toLowerCase().includes('no encontrado') || 
                                   error.message?.toLowerCase().includes('not found') ||
                                   error.message?.includes('404');
      
      if (esComprobanteFaltante) {
        console.log('🔄 [PARENT] Comprobante no existe (404), intentando generar automáticamente...');
        this.generarComprobanteAutomatico(venta);
      } else {
        this.toastService.error(
          '❌ Error de Comprobante',
          `Error al obtener comprobante: ${error.message || 'Error desconocido'}`,
          { duration: 4000 }
        );
      }
    }
  });
}

/**
 * Genera automáticamente un comprobante si no existe y luego descarga el PDF
 */
private generarComprobanteAutomatico(venta: VentaResponse): void {
  console.log('🔄 [PARENT] Generando comprobante automático para venta:', venta.id);
  
  const comprobanteRequest = {
    ventaId: venta.id,
    tipoDocumento: 'BOLETA' as const, // Por defecto BOLETA, puedes ajustar según tu lógica
    serie: 'B001', // Serie por defecto, ajustar según tu configuración
    observaciones: `Comprobante generado automáticamente para descarga PDF`
  };

  this.comprobantesService.generarComprobante(comprobanteRequest).subscribe({
    next: (comprobante) => {
      console.log('✅ [PARENT] Comprobante generado automáticamente:', comprobante);
      
      this.toastService.success(
        '✅ Comprobante Generado',
        'Se ha generado el comprobante automáticamente. Descargando PDF...',
        { duration: 3000 }
      );

      // Ahora descargar el PDF del comprobante recién generado
      const nombreArchivo = `comprobante-${venta.numeroVenta}.pdf`;
      this.comprobantesService.descargarPDF(comprobante.id).subscribe({
        next: (blob) => {
          try {
            this.comprobantesService.descargarArchivo(blob, nombreArchivo);
            this.toastService.success(
              '✅ Descarga Completada',
              `El comprobante ${nombreArchivo} se ha descargado exitosamente`,
              { duration: 3000 }
            );
          } catch (error) {
            console.error('❌ [PARENT] Error procesando descarga:', error);
            this.toastService.error('❌ Error de Descarga', 'Error al procesar el archivo');
          }
        },
        error: (error) => {
          console.error('❌ [PARENT] Error descargando PDF generado:', error);
          this.toastService.error('❌ Error de Descarga', 'No se pudo descargar el PDF generado');
        }
      });
    },
    error: (error) => {
      console.error('❌ [PARENT] Error generando comprobante automático:', error);
      this.toastService.error(
        '❌ Error de Generación',
        `No se pudo generar el comprobante: ${error.message || 'Error desconocido'}`,
        { duration: 4000 }
      );
    }
  });
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

  currentUserInfo: UserInfo = {
    name: 'Emerson147',
    role: 'Administrador',
    avatar: '/assets/images/avatar-default.jpg',
    isOnline: true,
    productividad: 92,
    nivel: 'Pro'
  };


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


// Funciones de acciones rápidas

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
onTabChange(event: { index: number }): void {
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
  console.log('🚨 cargarDatosIniciales() ejecutándose...');
  
  this.cargarClientes();
  this.cargarProductos(); // ← Esta línea debe estar aquí
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
  console.log('🚨🚨🚨 EJECUTANDO cargarProductos()...');
  
  this.productoService.getProducts(0, 500)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response: { contenido?: Producto[], content?: Producto[], data?: Producto[] }) => {
        this.productos = response?.contenido || response?.content || response?.data || [];
      },
      error: (error: Error) => {
        this.mostrarError('Error al cargar productos', error.message);
      }
    });
}

  obtenerPrecioProducto(productoId: number): number {
    // ✅ VERIFICACIÓN COMPLETA
    if (!this.productos || !Array.isArray(this.productos) || this.productos.length === 0) {
      console.warn('⚠️ productos no disponible, cargando...', this.productos);
      return 0;
    }
    
    const producto = this.productos.find(p => p?.id === productoId);
    console.log(`🔍 Buscando precio para ID ${productoId}:`, producto);
    return producto?.precioVenta || 0;
  }

  private cargarInventarios(): void {
  this.inventarioService.obtenerInventarios(0, 5000) // Cargar hasta 5000 items
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response: { contenido?: Inventario[], content?: Inventario[], data?: Inventario[] }) => {
        this.inventarios = response?.contenido || response?.content || response?.data || [];
      },
      error: (error: Error) => this.mostrarError('Error al cargar inventarios', error.message)
    });
}

  private cargarVentas(): void {
    this.loading = true;
    this.ventasService.obtenerTodasLasVentas()
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
  
  buscarClientes(event: { query: string }): void {
    const query = event.query.toLowerCase();
    this.clientesFiltrados = this.clientes.filter(cliente => 
      cliente.nombres?.toLowerCase().includes(query) ||
      cliente.apellidos?.toLowerCase().includes(query) ||
      cliente.dni?.includes(query) ||
      cliente.ruc?.includes(query)
    );
  }

  seleccionarCliente(event: { value?: Cliente } | Cliente): void {
    const cliente = 'value' in event ? event.value : event;
    if (!cliente || !('nombres' in cliente)) return;
    
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

  buscarProductosAutoComplete(event: { query: string }): void {
  const query = event.query.toLowerCase();
  
  console.log(`🔍 INICIANDO BÚSQUEDA: "${query}"`);
  console.log(`🔍 TOTAL INVENTARIOS DISPONIBLES: ${this.inventarios?.length}`);
  
  // ✅ SI NO HAY PRODUCTOS, CARGARLOS PRIMERO
  if (!this.productos || this.productos.length === 0) {
    console.log('🚨 Cargando productos...');
    this.cargarProductos();
    setTimeout(() => this.buscarProductosAutoComplete(event), 1000);
    return;
  }
  
  // ✅ INCLUIR TANTO DISPONIBLE COMO BAJO_STOCK
  const inventariosDisponibles = this.inventarios.filter(inv => {
    // Solo excluir si no hay stock
    if (inv.cantidad <= 0) {
      console.log(`❌ EXCLUIDO por stock 0: ${inv.producto?.nombre}`);
      return false;
    }
    
    // Incluir DISPONIBLE y BAJO_STOCK
    if (inv.estado !== 'DISPONIBLE' && inv.estado !== 'BAJO_STOCK') {
      console.log(`❌ EXCLUIDO por estado: ${inv.producto?.nombre} - Estado: ${inv.estado}`);
      return false;
    }
    
    return true;
  });
  
  console.log(`🔍 INVENTARIOS VENDIBLES (DISPONIBLE + BAJO_STOCK): ${inventariosDisponibles.length}`);
  
  // ✅ APLICAR FILTRO DE BÚSQUEDA
  const inventariosFiltrados = inventariosDisponibles.filter(inv => {
    if (!query || query.length === 0) {
      return true;
    }
    
    const nombre = inv.producto?.nombre?.toLowerCase() || '';
    const codigo = inv.producto?.codigo?.toLowerCase() || '';
    const serie = inv.serie?.toLowerCase() || '';
    const color = inv.color?.nombre?.toLowerCase() || '';
    const talla = inv.talla?.numero?.toLowerCase() || '';
    
    return nombre.includes(query) || 
           codigo.includes(query) || 
           serie.includes(query) ||
           color.includes(query) ||
           talla.includes(query);
  });
  
  console.log(`🔍 DESPUÉS DEL FILTRO: ${inventariosFiltrados.length}`);
  
  // ✅ MAPEAR CON PRECIOS Y INDICADOR DE STOCK
  this.productosAutoComplete = inventariosFiltrados.map(inv => {

    const precio = inv.producto && typeof inv.producto.id === 'number'
      ? this.obtenerPrecioProducto(inv.producto.id)
      : 0;
    
    return {
      ...inv,
      precioVenta: precio,
      displayLabel: `${inv.producto?.nombre} - ${inv.color?.nombre} - ${inv.talla?.numero} - ${this.formatearMoneda(precio)} ${inv.estado === 'BAJO_STOCK' ? '⚠️' : ''}`
    };
  }).sort((a, b) => {
    // Ordenar: primero DISPONIBLE, luego BAJO_STOCK
    if (a.estado !== b.estado) {
      if (a.estado === 'DISPONIBLE') return -1;
      if (b.estado === 'DISPONIBLE') return 1;
    }
    
    const nombreA = a.producto?.nombre || '';
    const nombreB = b.producto?.nombre || '';
    if (nombreA !== nombreB) {
      return nombreA.localeCompare(nombreB);
    }
    return parseInt(a.talla?.numero || '0') - parseInt(b.talla?.numero || '0');
  });
  
  console.log(`✅ RESULTADO FINAL: ${this.productosAutoComplete.length}`);
}


seleccionarProductoAutoComplete(event: { value?: Inventario } | Inventario): void {
  const producto = 'value' in event ? event.value : event;
  if (!producto || !('producto' in producto)) return;
  
  this.agregarProductoAlCarrito(producto);
}

  agregarProductoAlCarrito(inventario: Inventario): void {
  if (!this.clienteSeleccionado) {
    this.mostrarError('Cliente requerido', 'Debe seleccionar un cliente antes de agregar productos');
    return;
  }

  if (!inventario.id || !inventario.producto || !inventario.color || !inventario.talla || !inventario.serie) {
    this.mostrarError('Datos incompletos', 'El inventario no tiene todos los datos requeridos');
    return;
  }

  if (inventario.cantidad < this.cantidadInput) {
    this.mostrarError('Stock insuficiente', `Solo hay ${inventario.cantidad} unidades disponibles`);
    return;
  }

  const itemExistente = this.carrito.find(item => item.inventarioId === inventario.id);
  
  if (itemExistente) {
    const nuevaCantidad = itemExistente.cantidad + this.cantidadInput;
    if (nuevaCantidad > inventario.cantidad) {
      this.mostrarError('Stock insuficiente', `Solo hay ${inventario.cantidad} unidades disponibles`);
      return;
    }
    itemExistente.cantidad = nuevaCantidad;
    itemExistente.subtotal = itemExistente.cantidad * itemExistente.precioUnitario;
  } else {
    const precio = this.obtenerPrecioProducto(inventario.producto.id || 0);
    const nuevoItem: ItemCarrito = {
      inventarioId: inventario.id,
      producto: inventario.producto,
      color: inventario.color,
      talla: inventario.talla,
      cantidad: this.cantidadInput,
      precioUnitario: precio,
      subtotal: this.cantidadInput * precio,
      stock: inventario.cantidad,
      codigoCompleto: inventario.serie
    };
    this.carrito.push(nuevoItem);
  }

  this.calcularTotales();
  this.mostrarExito('Producto agregado', `${inventario.producto.nombre} añadido al carrito`);
  
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
    
    // Calcular descuento si está habilitado
    if (this.aplicarDescuento && this.carrito.length > 0) {
      if (this.tipoDescuento === 'porcentaje') {
        this.descuentoVenta = (this.subtotalVenta * this.porcentajeDescuento) / 100;
      } else {
        this.descuentoVenta = this.porcentajeDescuento;
      }
    } else {
      this.descuentoVenta = 0;
    }
    
    // Aplicar descuento si existe
    this.totalVenta = this.subtotalVenta - this.descuentoVenta;
    
    console.log('🧮 CÁLCULO DE TOTALES:', {
      'Subtotal': this.subtotalVenta,
      'Descuento aplicado': this.descuentoVenta,
      'Total final': this.totalVenta,
      'Carrito items': this.carrito.length,
      'Detalle carrito': this.carrito.map(item => ({
        producto: item.producto.nombre,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        subtotal: item.subtotal
      }))
    });
    
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

  // Método para manejar el evento de procesar pago desde el componente POS
  onProcesarPagoDesdePOS(datosPago: {
    carrito: any[];
    cliente: any;
    totalVenta: number;
    subtotalVenta: number;
    descuentoVenta: number;
    tipoComprobante?: string;
    serieComprobante?: string;
  }): void {
    console.log('💳 Recibiendo datos de pago desde POS:', datosPago);
    
    // Actualizar los datos del componente padre con los datos del POS
    this.carrito = datosPago.carrito;
    this.clienteSeleccionado = datosPago.cliente;
    this.totalVenta = datosPago.totalVenta;
    this.subtotalVenta = datosPago.subtotalVenta;
    this.descuentoVenta = datosPago.descuentoVenta;
    
    // Actualizar tipo de comprobante si se proporciona
    if (datosPago.tipoComprobante) {
      this.nuevaVenta.tipoComprobante = datosPago.tipoComprobante;
    }
    if (datosPago.serieComprobante) {
      this.nuevaVenta.serieComprobante = datosPago.serieComprobante;
    }
    
    // Inicializar el pago
    this.pagoActual = this.initPago();
    this.pagoActual.monto = this.totalVenta;
    this.montoPagado = this.totalVenta;
    this.calcularVuelto();
    
    // Abrir el diálogo de pago
    this.pagoDialog = true;
    
    console.log('✅ Diálogo de pago abierto desde POS');
  }

  calcularVuelto(): void {
    this.vuelto = Math.max(0, this.montoPagado - this.totalVenta);
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
      inventarioId: detalle.id,
      producto: { 
        id: detalle.producto.id, 
        codigo: detalle.producto.codigo, 
        nombre: detalle.producto.nombre, 
        marca: detalle.producto.marca || '', 
        modelo: '', 
        precioCompra: 0, 
        precioVenta: detalle.precioUnitario 
      },
      color: detalle.color,
      talla: detalle.talla,
      cantidad: detalle.cantidad,
      precioUnitario: detalle.precioUnitario,
      subtotal: detalle.subtotal,
      stock: detalle.cantidad,
      codigoCompleto: `${detalle.producto.codigo}-${detalle.color.nombre}-${detalle.talla.numero}`,
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

 formatearMoneda(monto: string | number): string {
  const valor = typeof monto === 'string' ? parseFloat(monto) : monto;
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN'
  }).format(valor);
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


  private mostrarVentaInfo(venta: VentaResponse, mensaje: string): void {
    const detail = `
      Número: ${venta.numeroVenta}
      Cliente: ${venta.cliente.nombres} ${venta.cliente.apellidos}
      Total: S/ ${venta.total.toFixed(2)}
      Estado: ${venta.estado}
      ${mensaje}
    `;
    
    this.messageService.add({
      severity: 'info',
      summary: 'Información de Venta',
      detail: detail.trim(),
      life: 8000,
      sticky: true
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
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🖨️ [INICIO] imprimirComprobante() llamado');
  console.log('📦 Datos de venta recibidos:', venta);
  console.log('🔍 ventaParaComprobante:', this.ventaParaComprobante);
  
  if (!venta) {
    console.error('❌ ERROR: venta es null o undefined');
    this.toastService.error('❌ Error', 'No se puede imprimir: Venta no proporcionada');
    return;
  }
  
  if (!venta.id) {
    console.error('❌ ERROR: venta.id es null o undefined. Venta completa:', venta);
    this.toastService.error('❌ Error', 'No se puede imprimir: Venta sin ID');
    return;
  }

  console.log('✅ Validación exitosa - Venta ID:', venta.id);
  console.log('📋 Tipo de comprobante:', venta.tipoComprobante);
  console.log('📋 Serie:', venta.serieComprobante);
  console.log('💰 Total:', venta.total);
  console.log('👤 Cliente:', venta.cliente?.nombres, venta.cliente?.apellidos);
  console.log('🛒 Cantidad de productos:', venta.detalles?.length);
  
  console.log('➡️ Llamando a mostrarOpcionesImpresion()...');
  
  // Mostrar opciones de impresión al usuario
  this.mostrarOpcionesImpresion(venta);
  
  console.log('✅ mostrarOpcionesImpresion() ejecutado');
  console.log('═══════════════════════════════════════════════════════════');
}

private mostrarOpcionesImpresion(venta: VentaResponse): void {
  console.log('───────────────────────────────────────────────────────────');
  console.log('📋 [INICIO] mostrarOpcionesImpresion()');
  console.log('🔍 Venta recibida:', venta);
  console.log('🔍 confirmationService disponible:', !!this.confirmationService);
  
  try {
    this.confirmationService.confirm({
      header: '🖨️ Opciones de Impresión',
      message: '¿Cómo deseas imprimir el comprobante?',
      icon: 'pi pi-print',
      acceptLabel: '🎫 Ticket + PDF',
      rejectLabel: '📄 Solo PDF',
      acceptButtonStyleClass: 'p-button-success p-button-sm',
      rejectButtonStyleClass: 'p-button-secondary p-button-sm',
      accept: () => {
        console.log('✅ Usuario seleccionó: Ticket + PDF');
        console.log('➡️ Llamando a imprimirTicketYPDF()...');
        this.imprimirTicketYPDF(venta);
      },
      reject: () => {
        console.log('✅ Usuario seleccionó: Solo PDF');
        console.log('➡️ Llamando a imprimirSoloPDF()...');
        this.imprimirSoloPDF(venta);
      }
    });
    
    console.log('✅ Diálogo de confirmación creado exitosamente');
    console.log('⏳ Esperando selección del usuario...');
    console.log('───────────────────────────────────────────────────────────');
  } catch (error) {
    console.error('❌ ERROR creando diálogo de confirmación:', error);
    this.toastService.error('❌ Error', 'No se pudo mostrar opciones de impresión');
  }
}

 private async imprimirTicketYPDF(venta: VentaResponse): Promise<void> {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🎫 [INICIO] imprimirTicketYPDF()');
    console.log('📦 Venta ID:', venta.id);
    console.log('📋 Venta completa:', venta);
    
    try {
      this.loadingImpresion = true;
      console.log('⏳ loadingImpresion = true');
      
      this.toastService.info('🔄 Preparando', 'Impresión dual (Ticket + PDF)...', { duration: 3000 });
      console.log('✅ Toast de preparación mostrado');

      console.log('➡️ Llamando a asegurarComprobantePOS()...');
      // Asegurar que existe el comprobante
      const comprobanteId = await this.asegurarComprobantePOS(venta);
      console.log('✅ Comprobante asegurado. ID:', comprobanteId);
      
      console.log('➡️ Ejecutando operaciones en paralelo...');
      console.log('   1️⃣ imprimirSoloTicket(venta)');
      console.log('   2️⃣ descargarSoloPDF(comprobanteId)');
      
      // Ejecutar ambas operaciones en paralelo
      const [resultadoTicket, resultadoPDF] = await Promise.allSettled([
        this.imprimirSoloTicket(venta),
        this.descargarSoloPDF(comprobanteId)
      ]);

      console.log('✅ Operaciones completadas');
      console.log('📊 Resultado Ticket:', resultadoTicket);
      console.log('📊 Resultado PDF:', resultadoPDF);

      let mensajesExito: string[] = [];
      let errores: string[] = [];

      // Evaluar resultado del ticket
      if (resultadoTicket.status === 'fulfilled') {
        console.log('✅ Ticket impreso exitosamente');
        mensajesExito.push('🎫 Ticket impreso');
      } else {
        console.error('❌ Error imprimiendo ticket:', resultadoTicket.reason);
        errores.push(`Ticket: ${resultadoTicket.reason?.message || 'Error desconocido'}`);
      }

      // Evaluar resultado del PDF
      if (resultadoPDF.status === 'fulfilled') {
        console.log('✅ PDF descargado exitosamente');
        mensajesExito.push('📄 PDF descargado');
      } else {
        console.error('❌ Error descargando PDF:', resultadoPDF.reason);
        errores.push(`PDF: ${resultadoPDF.reason?.message || 'Error al descargar'}`);
      }

      // Mostrar resultados
      if (mensajesExito.length > 0) {
        console.log('🎉 Mostrando mensaje de éxito:', mensajesExito.join(' | '));
        this.toastService.success('✅ Éxito', mensajesExito.join(' | '), { duration: 5000 });
      }

      if (errores.length > 0) {
        this.toastService.warning('⚠️ Parcial', errores.join(' | '), { duration: 6000 });
      }

    } catch (error: any) {
      console.error('Error en impresión dual:', error);
      this.toastService.error('❌ Error', 'Error en el proceso de impresión dual');
    } finally {
      this.loadingImpresion = false;
    }
  }

  /**
   * Solo descarga PDF
   */
  private async imprimirSoloPDF(venta: VentaResponse): Promise<void> {
    try {
      this.loadingImpresion = true;
      this.toastService.info('🔄 Preparando', 'Generando comprobante PDF...', { duration: 3000 });

      // Asegurar que existe el comprobante
      const comprobanteId = await this.asegurarComprobantePOS(venta);
      
      await this.descargarSoloPDF(comprobanteId);
      
      this.toastService.success('📄 Éxito', 'Comprobante descargado exitosamente', { duration: 4000 });
    } catch (error: any) {
      console.error('Error al descargar PDF:', error);
      this.toastService.error('❌ Error', 'No se pudo descargar el comprobante');
    } finally {
      this.loadingImpresion = false;
    }
  }

     /**
       * Asegura que existe un comprobante para la venta
       */
      private async asegurarComprobantePOS(venta: VentaResponse): Promise<number> {
        return new Promise((resolve, reject) => {
          // Primero intentar obtener el comprobante existente
          this.comprobantesService.obtenerComprobantePorVenta(venta.id).subscribe({
            next: (comprobante) => {
              resolve(comprobante.id);
            },
            error: (error) => {
              // Si es 404, significa que no existe el comprobante
              if (error.status === 404) {
                this.toastService.info('📝 Generando', 'Creando comprobante faltante...', { duration: 2000 });
                
                // Generar el comprobante
                this.generarComprobanteCompletoPOS(venta).then(nuevoComprobante => {
                  resolve(nuevoComprobante.id);
                }).catch(reject);
              } else {
                // Si es otro error, re-lanzarlo
                reject(error);
              }
            }
          });
        });
      }
    
private async generarComprobanteCompletoPOS(venta: VentaResponse): Promise<any> {
    return new Promise((resolve, reject) => {
      // Determinar tipo de comprobante basado en documento del cliente
      const tipoComprobante = venta.cliente?.documento && venta.cliente.documento.length === 11 
        ? 'FACTURA' 
        : 'BOLETA';

      const comprobanteData = {
        ventaId: venta.id,
        tipoDocumento: tipoComprobante as 'FACTURA' | 'BOLETA',
        serie: tipoComprobante === 'FACTURA' ? 'F001' : 'B001',
        observaciones: `Comprobante generado automáticamente para venta ${venta.numeroVenta}`
      };

      this.comprobantesService.generarComprobante(comprobanteData).subscribe({
        next: resolve,
        error: reject
      });
    });
  }


    /**
     * Solo imprime ticket sin PDF (directamente desde venta, sin comprobante)
     */
    private async imprimirSoloTicket(venta: VentaResponse): Promise<void> {
      console.log('───────────────────────────────────────────────────────────');
      console.log('🎫 [INICIO] imprimirSoloTicket()');
      console.log('📦 Venta ID recibido:', venta.id);
      console.log('🔍 Venta completa:', venta);
      console.log('🔍 comprobantesService disponible:', !!this.comprobantesService);
      
      return new Promise((resolve, reject) => {
        console.log('➡️ Llamando a comprobantesService.imprimirTicketDesdeVenta()...');
        console.log('🔗 URL del endpoint:', `/api/comprobantes/venta/${venta.id}/imprimir-ticket`);
        
        this.comprobantesService.imprimirTicketDesdeVenta(venta.id).subscribe({
          next: (resultado) => {
            console.log('✅ Respuesta recibida del backend:', resultado);
            console.log('🔍 resultado.success:', resultado.success);
            console.log('📝 resultado.message:', resultado.message);
            
            if (resultado.success) {
              console.log('🎉 ¡Ticket impreso exitosamente!');
              console.log('───────────────────────────────────────────────────────────');
              resolve();
            } else {
              console.error('❌ Backend reportó error:', resultado.message);
              console.log('───────────────────────────────────────────────────────────');
              reject(new Error(resultado.message || 'Error al imprimir ticket'));
            }
          },
          error: (error) => {
            console.error('❌ ERROR en la petición HTTP:', error);
            console.error('📊 Error completo:', {
              status: error.status,
              statusText: error.statusText,
              message: error.message,
              error: error.error
            });
            console.log('───────────────────────────────────────────────────────────');
            reject(error);
          }
        });
      });
    }
  
    /**
     * Solo descarga PDF
     */
    private async descargarSoloPDF(comprobanteId: number): Promise<void> {
      return new Promise((resolve, reject) => {
        this.comprobantesService.descargarPDF(comprobanteId).subscribe({
          next: () => resolve(),
          error: reject
        });
      });
    }

// Función para enviar por email
enviarComprobantePorEmail(venta: VentaResponse): void {
  const email = (venta.cliente as { email?: string }).email || 'cliente@ejemplo.com';
  this.mostrarInfo('Enviando', `Enviando comprobante a ${email}...`);
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
  this.menuAcciones.nativeElement.toggle(event);
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



copiarDocumento(): void {
  if (this.clienteSeleccionado) {
    const documento = this.clienteSeleccionado.dni || this.clienteSeleccionado.ruc || '';
    if (documento) {
      navigator.clipboard.writeText(documento).then(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Copiado',
          detail: 'Documento copiado al portapapeles'
        });
      });
    }
  }
}

// Función para obtener el total de items en el carrito
getTotalItems(): number {
  return this.carrito.reduce((total, item) => total + item.cantidad, 0);
}

// Función para obtener el total del carrito
getTotalCarrito(): number {
  return this.carrito.reduce((total, item) => total + item.subtotal, 0);
}

// Función para incrementar cantidad
incrementarCantidad(): void {
  if (this.cantidadInput < 999) {
    this.cantidadInput++;
  }
}

// Función para decrementar cantidad
decrementarCantidad(): void {
  if (this.cantidadInput > 1) {
    this.cantidadInput--;
  }
}

// Función para aplicar descuentos preestablecidos
aplicarDescuentoPreset(porcentaje: number): void {
  this.porcentajeDescuento = porcentaje;
  this.calcularDescuento();
}




// Función para manejar teclas de acceso rápido
handleKeyboardEvent(event: KeyboardEvent) {
  // F8 para activar scanner
  if (event.key === 'F8') {
    event.preventDefault();
    this.activarScanner();
  }
  
  // F9 para procesar pago
  if (event.key === 'F9') {
    event.preventDefault();
    if (this.canProcessPayment()) {
      this.iniciarPago();
    }
  }
  
  // Escape para cerrar scanner
  if (event.key === 'Escape' && this.scannerActive) {
    this.cerrarScanner();
  }
  
  // Enter en el input de código
  if (event.key === 'Enter' && event.target === document.getElementById('codigoInput')) {
    this.buscarProductoPorCodigo();
  }
}

getStockSeverity(stock: number): "success" | "info" | "warning" | "danger" {
  if (stock === 0) return 'danger';
  if (stock <= 5) return 'warning';
  if (stock <= 10) return 'info';
  return 'success';
}
 
    // NUEVAS PROPIEDADES AGREGADAS
  showClientModal = false;

openClientModal(): void {
    this.showClientModal = true;
  }

  confirmarCliente(): void {
    if (this.clienteSeleccionado) {
      this.showClientModal = false;
      // Aquí puedes agregar lógica adicional si es necesario
      this.messageService?.add({
        severity: 'success',
        summary: 'Cliente Confirmado',
        detail: `Cliente ${this.clienteSeleccionado.nombres} seleccionado correctamente`
      });
    }
  }

   private setupKeyboardShortcuts() {
    // Escuchar eventos de teclado globalmente
    document.addEventListener('keydown', (event) => this.handleGlobalKeyboard(event));
  }

  @HostListener('keydown', ['$event'])
  handleGlobalKeyboard(event: KeyboardEvent) {
    // No interceptar si hay un input/textarea/select activo
    const activeElement = document.activeElement;
    const isInputActive = activeElement?.tagName === 'INPUT' || 
                          activeElement?.tagName === 'TEXTAREA' || 
                          activeElement?.tagName === 'SELECT';
    
    // Excepciones: algunos shortcuts siempre funcionan
    const alwaysActive = ['F1', 'F8', 'F12', 'Escape'];
    
    if (isInputActive && !alwaysActive.includes(event.key)) {
      return; // Permitir tipeo normal en inputs
    }

    // Manejar shortcuts
    switch(event.key) {
      case 'F1': 
        event.preventDefault();
        this.showKeyboardHelp = true;
        this.playBeep(800, 100);
        break;
        
      case 'F2':
        event.preventDefault();
        this.focusProductSearch();
        this.playBeep(600, 100);
        break;
        
      case 'F3':
        event.preventDefault();
        this.openClientModal();
        this.playBeep(700, 100);
        break;
        
      case 'F4':
        event.preventDefault();
        this.toggleDiscountQuick();
        this.playBeep(900, 100);
        break;
        
      case 'F8':
        event.preventDefault();
        this.activarScanner();
        this.playBeep(1000, 150);
        break;
        
      case 'F9':
        event.preventDefault();
        this.openCashDrawer();
        this.playBeep(500, 200);
        break;
        
      case 'F12':
        if (this.canProcessPayment()) {
          event.preventDefault();
          this.iniciarPago();
          this.playSuccessSound();
        } else {
          this.playErrorSound();
        }
        break;
        
      case 'Escape':
        event.preventDefault();
        this.handleEscape();
        this.playBeep(400, 100);
        break;
        
      // Pagos rápidos con Ctrl
      case '1':
        if (event.ctrlKey && this.canProcessPayment()) {
          event.preventDefault();
          this.pagoRapido('EFECTIVO');
          this.playSuccessSound();
        }
        break;
        
      case '2':
        if (event.ctrlKey && this.canProcessPayment()) {
          event.preventDefault();
          this.pagoRapido('TARJETA_DEBITO');
          this.playSuccessSound();
        }
        break;
        
      case '3':
        if (event.ctrlKey && this.canProcessPayment()) {
          event.preventDefault();
          this.pagoRapido('YAPE');
          this.playSuccessSound();
        }
        break;

      // Shortcuts adicionales
      case 'Delete':
        if (event.ctrlKey) {
          event.preventDefault();
          this.limpiarCarrito();
          this.playBeep(600, 200);
        }
        break;
        
      case '+':
        if (event.ctrlKey) {
          event.preventDefault();
          this.increaseCantidadInput();
        }
        break;
        
      case '-':
        if (event.ctrlKey) {
          event.preventDefault();
          this.decreaseCantidadInput();
        }
        break;
    }
  }

  // NUEVOS MÉTODOS que necesitas agregar
  
  focusProductSearch() {
    const searchInput = document.querySelector('input[placeholder*="código"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }

  toggleDiscountQuick() {
    this.aplicarDescuento = !this.aplicarDescuento;
    this.toggleDescuento();
    
    if (this.aplicarDescuento) {
      // Auto-focus en el input de descuento si se puede
      setTimeout(() => {
        const discountInput = document.querySelector('input[type="number"][placeholder="%"]') as HTMLInputElement;
        discountInput?.focus();
      }, 100);
    }
  }

  openCashDrawer() {
    // Simular apertura de cajón
    console.log('Abriendo cajón de dinero...');
    // Aquí integrarías con hardware real
  }

  handleEscape() {
    // Cerrar modales/acciones en orden de prioridad
    if (this.showKeyboardHelp) {
      this.showKeyboardHelp = false;
    } else if (this.scannerActive) {
      this.cerrarScanner();
    } else if (this.showClientModal) {
      this.showClientModal = false;
    } else if (this.aplicarDescuento) {
      this.aplicarDescuento = false;
      this.toggleDescuento();
    }
  }

  increaseCantidadInput() {
    this.cantidadInput = Math.min(this.cantidadInput + 1, 999);
  }

  decreaseCantidadInput() {
    this.cantidadInput = Math.max(this.cantidadInput - 1, 1);
  }

  // Audio básico (simplificado por ahora)
  playBeep(frequency = 800, duration = 100) {
    try {
      const audioContext = new (window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'square';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch {
      console.log('Audio no disponible');
    }
  }

  playSuccessSound() {
    this.playBeep(1000, 100);
    setTimeout(() => this.playBeep(1200, 100), 120);
  }

  playErrorSound() {
    this.playBeep(300, 200);
  }

  getImageUrl(producto: Producto): string {
      if (this.previewImageUrl) {
        return this.previewImageUrl;
      }
      
      if (producto?.imagen) {
        if (producto.imagen.startsWith('http')) {
          return producto.imagen;
        }
        return `${environment.apiUrl}api/files/uploads/${producto.imagen}`;
      }
      
      return 'assets/images/placeholder-product.jpg';
  }

  previewImageUrl: string | null = null;


getMetodoPagoStyle(
  metodo: 'EFECTIVO' | 'TARJETA_CREDITO' | 'TARJETA_DEBITO' | 'TRANSFERENCIA' | 'YAPE' | 'PLIN' | string
): string {
  const styles: Record<'EFECTIVO' | 'TARJETA_CREDITO' | 'TARJETA_DEBITO' | 'TRANSFERENCIA' | 'YAPE' | 'PLIN', string> = {
    'EFECTIVO': 'w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center',
    'TARJETA_CREDITO': 'w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center',
    'TARJETA_DEBITO': 'w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center',
    'TRANSFERENCIA': 'w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center',
    'YAPE': 'w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center',
    'PLIN': 'w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center'
  };
  return styles[metodo as keyof typeof styles] || 'w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center';
}

getMetodoLabel(metodo: string): string {
  const labels = {
    'EFECTIVO': 'Efectivo',
    'TARJETA_CREDITO': 'Tarjeta Crédito',
    'TARJETA_DEBITO': 'Tarjeta Débito', 
    'TRANSFERENCIA': 'Transferencia',
    'YAPE': 'Yape',
    'PLIN': 'Plin'
  };
  return metodo in labels ? labels[metodo as keyof typeof labels] : metodo;
}

filtrarClientesPorTipo(tipo: string): void {
  switch(tipo) {
    case 'frecuentes':
      this.clientesFiltrados = this.clientes.filter(c => (c.compras || 0) >= 5);
      break;
    case 'nuevos':
      this.clientesFiltrados = this.clientes.filter(c => (c.compras || 0) <= 2);
      break;
    case 'vip':
      this.clientesFiltrados = this.clientes.filter(c => (c.totalCompras || 0) >= 1000);
      break;
    default:
      this.clientesFiltrados = [...this.clientes];
  }
}

verHistorialCliente(): void {
  // Implementar lógica para ver historial
  console.log('Ver historial de:', this.clienteSeleccionado);
}

getClienteEstado(cliente: Cliente): string {
  if ((cliente.totalCompras || 0) >= 1000) return 'vip';
  if ((cliente.compras || 0) >= 5) return 'frecuente';
  return 'activo';
}


getPromedioCompras(cliente: Cliente): number {
  if (!cliente || !cliente.compras || cliente.compras === 0) {
    return 0;
  }
  
  return (cliente.totalCompras || 0) / cliente.compras;
}

cerrarDialogoPago(): void {
  this.procesandoPago = false;
  this.pagoDialog = false;
  this.resetearEstadoPago();
}

// ✅ MÉTODO CUANDO SE OCULTA EL DIÁLOGO  
onPagoDialogHide(): void {
  this.procesandoPago = false;
  this.resetearEstadoPago();
}

resetearEstadoPago(): void {
  console.log('🔄 Reseteando estado de pago...');
  
  // Resetear variables de pago
  this.montoPagado = 0;
  this.vuelto = 0;
  this.procesandoPago = false;
  
  // Resetear datos del pago actual
  this.pagoActual = {
    ventaId: 0,
    usuarioId: 1,
    metodoPago: 'EFECTIVO',
    monto: 0,
    nombreTarjeta: '',
    ultimos4Digitos: '',
    numeroReferencia: '',
    observaciones: ''
  };
  
  console.log('✅ Estado de pago reseteado');
}

    // Mostrar panel de bienvenida
  mostrarPanelBienvenida(): void {
    setTimeout(() => {
      this.mostrarPanelAtajos = true;
      
      // Auto-hide después de 10 segundos
      this.panelAtajosTimeout = setTimeout(() => {
        this.cerrarPanelAtajos();
      }, 10000);
    }, 1500);
  }

   // Toggle del panel
  togglePanelAtajos(): void {
    this.mostrarPanelAtajos = !this.mostrarPanelAtajos;
    
    if (this.mostrarPanelAtajos) {
      // Limpiar timeout si está abierto
      if (this.panelAtajosTimeout) {
        clearTimeout(this.panelAtajosTimeout);
      }
      
      // Auto-hide después de 15 segundos
      this.panelAtajosTimeout = setTimeout(() => {
        this.cerrarPanelAtajos();
      }, 15000);
    }
  }

    // Cerrar panel
  cerrarPanelAtajos(): void {
    this.mostrarPanelAtajos = false;
    
    if (this.panelAtajosTimeout) {
      clearTimeout(this.panelAtajosTimeout);
      this.panelAtajosTimeout = undefined; // Cambiar null por undefined
    }
  }

    // Variables del header empresarial (agregar estas)
  ventasHoy = 2450.00;
  transaccionesHoy = 23;
  horaInicioTurno = '08:30';
  numeroVentaActual = 1001;
  
  // Métodos del header (agregar estos)
  getNumeroVenta(): string {
    return `POS-${this.numeroVentaActual.toString().padStart(6, '0')}`;
  }
  
  getCurrentDateTime(): string {
    const now = new Date();
    return now.toLocaleTimeString('es-PE', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  }
    
  abrirReportes(): void {
    console.log('📊 Abriendo reportes...');
    alert('Módulo de Reportes - Próximamente'); 
  }
  
  abrirConfiguracion(): void {
    console.log('⚙️ Abriendo configuración...');
    alert('Configuración del Sistema - Próximamente');
  }
  
  cerrarSesion(): void {
    this.confirmationService.confirm({
      message: '¿Está seguro de cerrar la sesión? Se cerrará automáticamente la caja si está abierta.',
      header: 'Confirmar Cierre de Sesión',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, cerrar sesión',
      rejectLabel: 'Cancelar',
      accept: () => {
        console.log('👋 Cerrando sesión...');
        
        // Limpiar estado de caja antes de cerrar sesión
        if (this.cajaAbierta) {
          this.limpiarEstadoCaja();
          console.log('� Caja cerrada automáticamente al cerrar sesión');
        }
        
        this.messageService.add({
          severity: 'info',
          summary: 'Cerrando Sesión',
          detail: 'Hasta pronto...',
          life: 2000
        });
        
        // Aquí implementarías el logout real
        // Por ejemplo: this.authService.logoutAndRedirect();
        setTimeout(() => {
          // Redirigir al login u otra página
          // this.router.navigate(['/login']);
          alert('Sesión cerrada - Redirigiendo al login...');
        }, 2000);
      }
    });
  }

  inicializarMetricas(): void {
    this.metricas = [
      // 💰 VENTAS DEL DÍA
      {
        id: 'ventas-dia',
        titulo: 'Ventas del Día',
        valor: 2450.00,
        icono: 'pi-dollar',
        color: 'success',
        categoria: 'ventas',
        tendencia: {
          porcentaje: 12.5,
          direccion: 'up',
          periodo: 'vs ayer',
          periodoAnterior: 2178.00
        },
        objetivo: {
          valor: 3000.00,
          progreso: 81.7,
          fechaLimite: new Date()
        },
        miniGrafico: {
          data: [1800, 2100, 1950, 2450, 2200, 2450],
          labels: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Hoy'],
          type: 'line'
        },
        desglose: [
          { label: 'Efectivo', valor: 1225.00, color: '#22c55e', porcentaje: 50 },
          { label: 'Tarjetas', valor: 857.50, color: '#3b82f6', porcentaje: 35 },
          { label: 'Digital', valor: 367.50, color: '#8b5cf6', porcentaje: 15 }
        ],
        accionPrincipal: {
          label: 'Ver Detalle',
          icono: 'pi-chart-line',
          callback: () => this.verDetalleVentas()
        },
        ultimaActualizacion: new Date()
      },
      
      // 🛒 TRANSACCIONES
      {
        id: 'transacciones',
        titulo: 'Transacciones',
        valor: 23,
        icono: 'pi-shopping-cart',
        color: 'info',
        categoria: 'operaciones',
        tendencia: {
          porcentaje: 8.3,
          direccion: 'up',
          periodo: 'vs ayer',
          periodoAnterior: 21
        },
        objetivo: {
          valor: 30,
          progreso: 76.7
        },
        miniGrafico: {
          data: [18, 25, 19, 23, 21, 23],
          labels: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Hoy'],
          type: 'bar'
        },
        metricas: [
          { label: 'Promedio/día', valor: '28 trans', icono: 'pi-chart-bar' },
          { label: 'Pico hora', valor: '14:00', icono: 'pi-clock' },
          { label: 'Última venta', valor: '17:45', icono: 'pi-calendar' }
        ],
        ultimaActualizacion: new Date()
      },
      
      // 💳 TICKET PROMEDIO
      {
        id: 'ticket-promedio',
        titulo: 'Ticket Promedio',
        valor: 106.52,
        icono: 'pi-chart-line',
        color: 'secondary',
        categoria: 'financiero',
        tendencia: {
          porcentaje: 5.7,
          direccion: 'up',
          periodo: 'vs ayer',
          periodoAnterior: 100.78
        },
        objetivo: {
          valor: 120.00,
          progreso: 88.8
        },
        miniGrafico: {
          data: [98, 102, 95, 106, 104, 107],
          labels: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Hoy'],
          type: 'area'
        },
        accionPrincipal: {
          label: 'Estrategias',
          icono: 'pi-lightbulb',
          callback: () => this.verEstrategiasTicket()
        },
        ultimaActualizacion: new Date()
      },
      
      // 📦 PRODUCTOS VENDIDOS
      {
        id: 'productos-vendidos',
        titulo: 'Productos Vendidos',
        valor: 147,
        icono: 'pi-box',
        color: 'warning',
        categoria: 'operaciones',
        tendencia: {
          porcentaje: 15.2,
          direccion: 'up',
          periodo: 'vs ayer',
          periodoAnterior: 128
        },
        alertaCritica: {
          activa: true,
          mensaje: '8 productos con stock crítico',
          nivel: 'media'
        },
        desglose: [
          { label: 'Ropa', valor: 89, color: '#3b82f6', porcentaje: 60.5 },
          { label: 'Calzado', valor: 35, color: '#10b981', porcentaje: 23.8 },
          { label: 'Accesorios', valor: 23, color: '#f59e0b', porcentaje: 15.7 }
        ],
        accionPrincipal: {
          label: 'Stock Crítico',
          icono: 'pi-exclamation-triangle',
          callback: () => this.verStockCritico()
        },
        ultimaActualizacion: new Date()
      }
    ];
  }
  
  // Métodos de acción
  verDetalleVentas(): void {
    console.log('📊 Abriendo detalle de ventas...');
    alert('Detalle de Ventas - Módulo en desarrollo');
  }
  
  verEstrategiasTicket(): void {
    console.log('💡 Abriendo estrategias para aumentar ticket promedio...');
    alert('Estrategias de Ticket Promedio:\n• Cross-selling\n• Up-selling\n• Promociones combo');
  }
  
  verStockCritico(): void {
    console.log('⚠️ Abriendo alertas de stock crítico...');
    alert('Stock Crítico:\n• Polo Blanco M (3 uds)\n• Jean Azul 32 (2 uds)\n• Camisa Negra L (1 ud)');
  }
  
  abrirDashboard(): void {
    this.showDashboard = true;
    this.actualizarTodasLasMetricas();
  }
  
  actualizarTodasLasMetricas(): void {
    this.metricas.forEach(metrica => {
      metrica.loading = true;
      metrica.ultimaActualizacion = new Date();
      
      // Simular actualización de datos
      setTimeout(() => {
        metrica.loading = false;
      }, 1000);
    });
  }
  
  private iniciarActualizacionAutomatica(): void {
    setInterval(() => {
      if (this.showDashboard) {
        this.actualizarTodasLasMetricas();
      }
    }, 30000); // 30 segundos
  }
  
  // Métodos auxiliares
  getIconoTendencia(tendencia: Tendencia): string {
    switch(tendencia.direccion) {
      case 'up': return 'pi-arrow-up';
      case 'down': return 'pi-arrow-down';
      case 'neutral': return 'pi-minus';
      default: return 'pi-minus';
    }
  }
  
  getColorTendencia(tendencia: Tendencia): string {
    switch(tendencia.direccion) {
      case 'up': return 'text-green-500';
      case 'down': return 'text-red-500';
      default: return 'text-gray-500';
    }
  }
  
  getColorMetrica(color: 'success' | 'info' | 'warning' | 'danger' | 'secondary'): string {
    const colores: Record<'success' | 'info' | 'warning' | 'danger' | 'secondary', string> = {
      'success': 'from-green-500 to-green-600',
      'info': 'from-blue-500 to-blue-600',
      'warning': 'from-orange-500 to-orange-600',
      'danger': 'from-red-500 to-red-600',
      'secondary': 'from-purple-500 to-purple-600'
    };
    return colores[color] || 'from-gray-500 to-gray-600';
  }

  // Métodos trackBy para optimización de rendimiento
  trackByProductoId(index: number, producto: { producto?: { id: number } }): number {
    return producto?.producto?.id || index;
  }

  trackByProductoPopularId(index: number, producto: Inventario): number {
    return producto?.producto?.id || index;
  }

  

  private sessionStartTime = new Date();
  
  // Usuario y sistema
  currentUser = 'Emerson147';

  
  // Métricas del día
  ingresosDia = 25679.50;
  clientesAtendidos = 89;
  productosVendidos = 342;
  
  

 
  private inicializarComponente() {
    console.log(`🚀 Header Premium iniciado por ${this.currentUser} - ${this.getCurrentDateTime()}`);
  }

  private configurarActualizacionesTiempoReal() {


    // Actualizar métricas cada 5 minutos
    interval(300000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.actualizarMetricas();
      });

    // Actualizar fecha/hora cada segundo
    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.changeDetectorRef.markForCheck();
      });
  }



  private actualizarMetricas() {
    // Simular incremento gradual de métricas durante el día
    this.ventasHoy += Math.floor(Math.random() * 3);
    this.ingresosDia += Math.random() * 500;
    this.clientesAtendidos += Math.floor(Math.random() * 2);
    this.productosVendidos += Math.floor(Math.random() * 5);
    this.changeDetectorRef.markForCheck();
  }

  // ✅ MÉTODOS DE INFORMACIÓN
  getUserInitials(): string {
    return this.currentUser.substring(0, 2).toUpperCase();
  }

 

  getSessionTime(): string {
    const now = new Date();
    const diff = now.getTime() - this.sessionStartTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  getLastBackup(): string {
    const lastBackup = new Date();
    lastBackup.setHours(2, 0, 0, 0); // Backup a las 2:00 AM
    return lastBackup.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // ==================== GESTIÓN DE CAJA ====================
  inicializarEstadoCaja() {
    // Verificar si hay un estado de caja guardado en localStorage
    const cajaGuardada = localStorage.getItem('cajaAbierta');
    const sesionCaja = localStorage.getItem('sesionCaja');
    
    if (cajaGuardada && sesionCaja) {
      try {
        this.cajaAbierta = JSON.parse(cajaGuardada);
        const datosSesion = JSON.parse(sesionCaja);
        
        if (this.cajaAbierta) {
          // Verificar si la sesión es del mismo día
          const fechaApertura = new Date(datosSesion.fechaApertura);
          const hoy = new Date();
          
          const esMismoDia = fechaApertura.toDateString() === hoy.toDateString();
          
          if (esMismoDia) {
            console.log('💰 Restaurando estado de caja abierta');
            console.log('📅 Fecha de apertura:', fechaApertura.toLocaleString());
            console.log('👤 Usuario:', datosSesion.usuario);
            
            this.messageService.add({
              severity: 'info',
              summary: 'Sesión de Caja Restaurada',
              detail: `Caja abierta desde ${fechaApertura.toLocaleTimeString()}`,
              life: 4000
            });
          } else {
            // Si es de otro día, limpiar y pedir nueva apertura
            console.log('⚠️ Sesión de caja expirada (día diferente)');
            this.limpiarEstadoCaja();
            this.cajaAbierta = false;
          }
        }
      } catch (error) {
        console.error('❌ Error al restaurar estado de caja:', error);
        this.limpiarEstadoCaja();
        this.cajaAbierta = false;
      }
    }
  }

  private guardarEstadoCaja() {
    localStorage.setItem('cajaAbierta', JSON.stringify(this.cajaAbierta));
  }

  private guardarSesionCaja(usuario: string = 'Usuario Actual', fondoInicial: number = 1000) {
    const sesionCaja = {
      fechaApertura: new Date().toISOString(),
      usuario: usuario,
      fondoInicial: fondoInicial,
      estado: 'ABIERTA'
    };
    
    localStorage.setItem('sesionCaja', JSON.stringify(sesionCaja));
    console.log('💾 Sesión de caja guardada:', sesionCaja);
  }

  private limpiarEstadoCaja() {
    localStorage.removeItem('cajaAbierta');
    localStorage.removeItem('sesionCaja');
    console.log('🧹 Estado de caja limpiado');
  }



  cerrarCaja() {
    this.confirmationService.confirm({
      message: '¿Está seguro que desea cerrar la caja? Se volverá a la pantalla inicial y deberá abrirla nuevamente en la próxima sesión.',
      header: 'Confirmar Cierre de Caja',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, cerrar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.cajaAbierta = false;
        this.activeTabIndex = 0;
        this.limpiarEstadoCaja(); // ✅ Limpiar todo el estado de localStorage
        this.messageService.add({
          severity: 'info',
          summary: 'Caja Cerrada',
          detail: 'La caja registradora ha sido cerrada. Sesión finalizada.',
          life: 4000
        });
        console.log('💰 Cerrando caja registradora...');
        console.log('🧹 Sesión de caja limpiada del almacenamiento local');
        // Lógica adicional para cerrar caja (resumen del día, reportes, etc.)
      }
    });
  }

  // ==================== MÉTODOS DE ACCIONES RÁPIDAS ====================
  irAPOS() {
    this.activeTabIndex = 0; // Ir a la pestaña POS
    this.messageService.add({
      severity: 'info',
      summary: 'Navegación',
      detail: 'Redirigido al Punto de Venta',
      life: 2000
    });
  }

  verTotalesDelDia() {
    // Mostrar un dialog con los totales del día
    this.messageService.add({
      severity: 'info',
      summary: 'Totales del Día',
      detail: `Ventas: ${this.contarVentasDelDia()} | Total: S/ ${this.getTotalVentasDelDia().toFixed(2)}`,
      life: 5000
    });
    // También podríamos abrir un dialog con información detallada
  }

  imprimirReporteCaja() {
    console.log('🖨️ Imprimiendo reporte de caja...');
    this.messageService.add({
      severity: 'success',
      summary: 'Impresión',
      detail: 'Enviando reporte a la impresora...',
      life: 3000
    });
    // Aquí iría la lógica real de impresión
  }

  contarVentasDelDia(): number {
    // Contar ventas del día actual
    const hoy = new Date();
    return this.ventas.filter(venta => {
      const fechaVenta = new Date(venta.fechaCreacion);
      return fechaVenta.toDateString() === hoy.toDateString();
    }).length;
  }

  getTotalVentasDelDia(): number {
    // Calcular total de ventas del día actual
    const hoy = new Date();
    return this.ventas
      .filter(venta => {
        const fechaVenta = new Date(venta.fechaCreacion);
        return fechaVenta.toDateString() === hoy.toDateString();
      })
      .reduce((total, venta) => total + venta.total, 0);
  }

  getPromedioVenta(): number {
    const totalVentas = this.contarVentasDelDia();
    if (totalVentas === 0) return 0;
    return this.getTotalVentasDelDia() / totalVentas;
  }

  // Variable para proteger contra múltiples clics
  private nuevaVentaParentEnProceso = false;

  nuevaVentaRapida(): void {
    // 🔒 PROTECCIÓN CONTRA MÚLTIPLES CLICS EN COMPONENTE PADRE
    if (this.nuevaVentaParentEnProceso) {
      console.log('⚠️ [PARENT] Nueva venta padre ya en proceso, ignorando clic adicional');
      return;
    }
    
    this.nuevaVentaParentEnProceso = true;
    console.log('🛒 [PARENT] Iniciando nueva venta rápida...');
    
    try {
      // Cerrar el diálogo de comprobante
      this.comprobanteDialog = false;
      this.ventaParaComprobante = null;
      
      // Limpiar formulario en el componente padre
      this.limpiarFormularioVenta();
      
      // Cambiar a la pestaña POS
      this.activeTabIndex = 0; 
      this.pasoActual = 0;
      
      // Notificar al usuario
      this.messageService.add({
        severity: 'success',
        summary: '✅ Nueva Venta',
        detail: 'POS limpio y listo para una nueva venta',
        life: 2000
      });
      
      // Delegar al componente POS después de un breve delay
      setTimeout(() => {
        if (this.posComponent) {
          console.log('🔄 [PARENT] Delegando limpieza al componente POS...');
          this.posComponent.nuevaVentaRapida();
        } else {
          // Fallback si no hay referencia al POS
          const codigoInput = document.querySelector('input[placeholder*="código"]') as HTMLInputElement;
          if (codigoInput) {
            codigoInput.focus();
          }
        }
      }, 150);
      
      console.log('✅ [PARENT] Nueva venta iniciada correctamente');
      
    } catch (error) {
      console.error('❌ [PARENT] Error al iniciar nueva venta:', error);
      this.messageService.add({
        severity: 'error',
        summary: '❌ Error',
        detail: 'Hubo un problema al iniciar la nueva venta',
        life: 3000
      });
    } finally {
      // 🔓 LIBERAR EL LOCK DESPUÉS DE UN TIEMPO
      setTimeout(() => {
        this.nuevaVentaParentEnProceso = false;
        console.log('🔓 [PARENT] Nueva venta lista para siguiente ejecución');
      }, 1000);
    }
  }

  abrirCaja(): void {
    if (this.cajaAbierta) {
      this.mostrarAdvertencia('Caja ya abierta', 'La caja registradora ya está abierta');
      return;
    }

    this.confirmationService.confirm({
      message: '¿Está seguro que desea abrir la caja registradora?',
      header: 'Confirmar Apertura de Caja',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, abrir',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.abrirCajaRegistradora();
      }
    });
  }

  verReportes() {
    console.log('📊 Abriendo reportes...');
    this.activeTabIndex = 2; // Navegar a la pestaña de reportes
    this.loadingReportes = true;
    this.cargarEstadisticas();
    this.messageService.add({
      severity: 'info',
      summary: 'Reportes',
      detail: 'Cargando reportes de ventas...',
      life: 2000
    });
  }

  configuracion() {
    console.log('⚙️ Abriendo configuración...');
    this.activeTabIndex = 3; // Navegar a la pestaña de configuración
    this.cargarConfiguraciones();
    this.messageService.add({
      severity: 'info',
      summary: 'Configuración',
      detail: 'Abriendo panel de configuración...',
      life: 2000
    });
  }

  private cargarConfiguraciones(): void {
    // Cargar configuraciones guardadas en localStorage
    const configGuardada = localStorage.getItem('configuracion_ventas');
    if (configGuardada) {
      try {
        this.configuracion = JSON.parse(configGuardada);
      } catch (error) {
        console.error('Error al cargar configuración:', error);
      }
    }
  }

  private mostrarAdvertencia(titulo: string, mensaje: string): void {
    this.messageService.add({
      severity: 'warn',
      summary: titulo,
      detail: mensaje,
      life: 4000
    });
  }

  // Métodos auxiliares para acciones rápidas
  private abrirCajaRegistradora(): void {
    console.log('💰 Abriendo caja registradora...');
    this.cajaAbierta = true;
    this.guardarEstadoCaja(); // ✅ Guardar estado en localStorage
    this.guardarSesionCaja(); // ✅ Guardar datos completos de la sesión
    this.registrarAperturaCaja();
    this.messageService.add({
      severity: 'success',
      summary: 'Caja Abierta',
      detail: 'Caja registradora abierta exitosamente. La sesión se mantendrá activa.',
      life: 4000
    });
  }

  private registrarAperturaCaja(): void {
    const aperturaCaja = {
      fecha: new Date().toISOString(),
      usuario: 'Usuario Actual', // TODO: Obtener usuario real
      fondoInicial: 1000, // Valor fijo en lugar de variable no utilizada
      estado: 'ABIERTA'
    };
    localStorage.setItem('caja_apertura', JSON.stringify(aperturaCaja));
  }

  private obtenerTopProductos(): any[] {
    return [
      { nombre: 'Zapatilla Nike Air Max', ventas: 45 },
      { nombre: 'Zapato Formal Oxford', ventas: 32 },
      { nombre: 'Sandalias Casual', ventas: 28 }
    ];
  }

  private obtenerVentasPorHora(): any[] {
    return [
      { hora: '09:00', ventas: 12 },
      { hora: '10:00', ventas: 18 },
      { hora: '11:00', ventas: 25 },
      { hora: '12:00', ventas: 30 }
    ];
  }

 /**
   * Maneja el evento de dismissal de toasts
   */
  onToastDismissed(toastId: string): void {
    this.toastService.dismiss(toastId);
    this.cdr.markForCheck();
  }


  // === FUNCIONES TRACKBY PARA OPTIMIZACIÓN ===
  
  trackByMetodoPago: TrackByFunction<any> = (index: number, metodo: any) => {
    return metodo.value || index;
  }

  trackByCarrito: TrackByFunction<any> = (index: number, item: any) => {
    return item.id || index;
  }

  trackByVenta: TrackByFunction<VentaResponse> = (index: number, venta: VentaResponse) => {
    return venta.id || index;
  }

  trackByProducto: TrackByFunction<Producto> = (index: number, producto: Producto) => {
    return producto.id || index;
  }

  trackByCliente: TrackByFunction<Cliente> = (index: number, cliente: Cliente) => {
    return cliente.id || index;
  }

}
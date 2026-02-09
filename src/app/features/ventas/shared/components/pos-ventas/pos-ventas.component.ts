import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, inject, Output, EventEmitter, TrackByFunction } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { VentaRequest, VentaResponse } from '../../../../../core/models/venta.model';
import { PagoRequest, PagoResponse } from '../../../../../core/models/pago.model';
import { MetricaVenta } from '../metrics/metric-card.interface';

// Servicios modernos
import { ToastService } from '../../../../../shared/services/toast.service';
import { ToastNotificationComponent } from '../../../../../shared/components/toast-notification/toast-notification.component';

// Servicios de datos
import { InventarioService } from '../../../../../core/services/inventario.service';
import { ClienteService } from '../../../../../core/services/clientes.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { VentasService } from '../../../../../core/services/ventas.service';
import { EstadisticasVentasService } from '../../../../../core/services/estadisticas-ventas.service';
import { AnalyticsService } from '../../../../../core/services/analytics.service';
import { ComprobantesService } from '../../../../../core/services/comprobantes.service';
import { PagosService } from '../../../../../core/services/pagos.service';
import { Cliente } from '../../../../../core/models/cliente.model';
import { Producto } from '../../../../../core/models/product.model';
import { Inventario } from '../../../../../core/models/inventario.model';
import { ProductoService } from '../../../../../core/services/producto.service';
import { PermissionService, PermissionType } from '../../../../../core/services/permission.service';
import { CajaStateService } from '../../services/caja-state.service';
import { AperturaCajaDialogComponent } from '../apertura-caja-dialog/apertura-caja-dialog.component';
import { CierreCajaDialogComponent } from '../cierre-caja-dialog/cierre-caja-dialog.component';

// Interface extendido para POS que incluye propiedades adicionales
interface InventarioPOS extends Inventario {
  stock: number;
  precioUnitario: number;
  codigoCompleto: string;
  subtotal: number;
  displayLabel?: string;
}

// Interfaz para items del carrito (debe coincidir con el componente padre)
interface ItemCarrito {
  inventarioId: number;
  producto: Producto;
  color: { id: number; nombre: string; codigo: string };
  talla: { id: number; numero: string };
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  stock: number;
  codigoCompleto: string;
}

export interface Venta {
  id?: number;
  numeroVenta: string;
  tipoComprobante: string;
  serieComprobante: string;
  observaciones?: string;
  subtotal: number;
  total: number;
  descuento: number;
  metodoPago?: string;
  cliente?: Cliente;
  detalles: ItemCarrito[];
  fecha: Date;
  usuario: string;
}

interface OpcionSelect {
  label: string;
  value: string;
}

@Component({
  selector: 'app-pos-ventas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    AutoCompleteModule,
    DialogModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    CheckboxModule,
    ToastNotificationComponent
    ],
  providers: [MessageService, ConfirmationService, DialogService],
  templateUrl: './pos-ventas.component.html',
  // 🔧 TEMPORAL: Cambiar a Default para que los diálogos funcionen
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class PosVentasComponent implements OnInit, OnDestroy {

  // Inyección de servicios modernos
  public toastService = inject(ToastService);
  private confirmationService = inject(ConfirmationService);
  private authService = inject(AuthService);
  private pagosService = inject(PagosService);
  private productoService = inject(ProductoService);
  private permissionService = inject(PermissionService);
  private cajaStateService = inject(CajaStateService);
  private dialogService = inject(DialogService);
  
  // Referencias a diálogos dinámicos
  private aperturaCajaRef?: DynamicDialogRef;
  private cierreCajaRef?: DynamicDialogRef;
  
  // Output para comunicarse con el componente padre
  @Output() cerrarCajaEvent = new EventEmitter<void>();

  // Estado de caja
  cajaAbierta = this.cajaStateService.cajaAbierta;
  estadoCaja = this.cajaStateService.estadoCaja;

  private destroy$ = new Subject<void>();
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('codigoInput') codigoInput!: ElementRef<HTMLInputElement>;


  // ==================== DATOS PRINCIPALES ====================
  ventas: VentaResponse[] = [];
  ventasFiltradas: VentaResponse[] = [];
  clientes: Cliente[] = [];
  productos: Producto[] = [];
  inventarios: Inventario[] = [];
  
  // ==================== POS - NUEVA VENTA ====================
  nuevaVenta: VentaRequest = this.initNuevaVenta();
  clienteSeleccionado: Cliente | null = null;
  clientesFiltrados: Cliente[] = [];
  productosAutoComplete: Inventario[] = [];
  carrito: ItemCarrito[] = [];

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

  // Usuario y Sistema
  currentUser = 'Emerson147';
  ventasHoy = 125487;
  transaccionesHoy = 147;
  horaInicioTurno = '08:00';

  // Control de permisos
  permissionTypes = PermissionType;
  canCreate = false;
  canEdit = false;
  canDelete = false;
  canViewReports = false;
  isDarkMode = false;
  currentTime = new Date();
  clientesRecientes: Cliente[] = [];

  // Estados de loading
  processingPayment = false;
  searchingProducts = false;
  addingToCart = false;
  loadingClient = false;
  connectingScanner = false;
  savingData = false;
  loadingImpresion = false;
  progressPercentage = 0;
  loadingMessage = '';
  loading = false;


  totalVenta = 0;
  subtotalVenta = 0;
  descuentoVenta = 0;
  igvVenta = 0; // IGV calculado (18%)
  operacionGravada = 0; // Base imponible sin IGV

  // Búsqueda y productos
  codigoBusqueda = '';
  cantidadInput = 1;
  productoBusqueda: InventarioPOS | null = null;
  productosPopulares: InventarioPOS[] = [];

  // Scanner
  scannerActive = false;
  stream: MediaStream | null = null;

  // Modal de carrito móvil
  showMobileCart = false;
  lastAddedProduct: Producto | null = null;
  procesandoVenta = false;

  showDashboard = false;

  // Descuentos y crédito
  aplicarDescuento = false;
  
  // Número de venta fijo (no cambiante)
  numeroVentaActual: string = '';
  porcentajeDescuento = 0;
  esVentaCredito = false;
  cuotasCredito = 1;

  // Modales
  showClientModal = false;
  mostrarCarritoExpandido = false;

  // Cliente modal
  clienteBusqueda: Cliente | null = null;

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
isMobile: any;
productosRecomendados: any;

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
  
  // Series de comprobantes
seriesComprobante: { label: string, value: string }[] = [
  { label: 'B001', value: 'B001' },
  { label: 'B002', value: 'B002' },
  { label: 'F001', value: 'F001' },
  { label: 'F002', value: 'F002' },
  { label: 'NV001', value: 'NV001' },
];

  opcionesCuotas = [
    { label: '2 cuotas', value: 2 },
    { label: '3 cuotas', value: 3 },
    { label: '4 cuotas', value: 4 },
    { label: '6 cuotas', value: 6 }
  ];


  private cdr = inject(ChangeDetectorRef);
  private messageService = inject(MessageService);
  private inventarioService = inject(InventarioService);
  private clienteService = inject(ClienteService);
  private ventasService = inject(VentasService);
  private comprobantesService = inject(ComprobantesService);
  private http = inject(HttpClient);

  // ========================================
  // PROPIEDADES PARA PANEL DE PRUEBAS TICKETERA
  // ========================================
  
  // Control del panel de pruebas
  mostrarBotonPruebas = false; // 🔥 DESACTIVADO: Causaba conflicto con botón PROCESAR PAGO
  panelPruebasVisible = false;
  
  // Estado de la ticketera
  estadoConexion = {
    conectada: false,
    puerto: '',
    estado: 'Desconocido'
  };
  
  // Controles de verificación
  verificandoConexion = false;
  detectandoPuertos = false;


  // Control de estado de caja
  // ELIMINADO: cajaAbierta = false; (ahora se usa signal del servicio)
  
  // Configuración de puertos
  puertosDisponibles: string[] = [];
  puertoSeleccionado = '';
  
  // Log de pruebas
  logPruebas: Array<{
    timestamp: string;
    tipo: 'info' | 'success' | 'warning' | 'error';
    mensaje: string;
  }> = [];

  // ========================================
  // MÉTODOS DE NOTIFICACIONES MODERNAS
  // ========================================
  
  /**
   * 📋 GUÍA DE USO DEL SISTEMA DE TOAST
   * 
   * El sistema de toast ya está completamente configurado y listo para usar.
   * 
   * 🔧 CONFIGURACIÓN:
   * - ✅ ToastService inyectado: this.toastService
   * - ✅ Componente toast en template
   * - ✅ Método onToastDismissed implementado
   * 
   * 🚀 EJEMPLOS DE USO:
   * 
   * // Toast básicos
   * this.toastService.success('Título', 'Mensaje');
   * this.toastService.error('Error', 'Descripción del error');
   * this.toastService.warning('Advertencia', 'Mensaje de advertencia');
   * this.toastService.info('Información', 'Mensaje informativo');
   * 
   * // Toast con opciones personalizadas
   * this.toastService.success('Título', 'Mensaje', {
   *   duration: 5000,           // Duración en ms
   *   icon: 'pi pi-check',      // Icono personalizado
   *   persistent: true,         // No se auto-cierra
   *   actions: [{               // Botones de acción
   *     label: 'Acción',
   *     action: () => { ... },
   *     primary: true
   *   }]
   * });
   * 
   * 🎯 MÉTODOS ESPECÍFICOS DEL POS:
   * - notificarProductoAgregado()
   * - notificarErrorStock()
   * - notificarClienteSeleccionado()
   * - notificarVentaCompletada()
   * - notificarErrorPago()
   */

  /**
   * Maneja el evento de dismissal de toasts
   */
  onToastDismissed(toastId: string): void {
    this.toastService.dismiss(toastId);
    this.cdr.markForCheck();
  }

  // ========================================
  // MÉTODO PÚBLICO PARA RECIBIR VENTA COMPLETADA DESDE EL PADRE
  // ========================================
  
  /**
   * Método público que el componente padre llama cuando se completa una venta
   * para abrir el diálogo de comprobante en el POS
   */
  public mostrarComprobanteVentaCompletada(venta: VentaResponse): void {
    // Asignar la venta al diálogo de comprobante
    this.ventaParaComprobante = venta;
    
    // Abrir el diálogo de comprobante
    this.comprobanteDialog = true;
    
    // Limpiar el carrito y resetear el formulario
    this.limpiarFormularioVenta();
    
    // Actualizar inventarios después de la venta
    this.actualizarInventariosDespuesDeVenta();
    
    // Forzar detección de cambios
    this.cdr.markForCheck();
  }

  /**
   * Muestra notificación cuando se agrega un producto
   */
  private showProductAddedNotification(producto: Inventario, cantidad: number): void {
    this.toastService.productAdded(producto.producto?.nombre || 'Producto', cantidad);
  }

  /**
   * Muestra notificación de error de stock
   */
  private showStockError(producto: Inventario): void {
    this.toastService.stockError(producto.producto?.nombre || 'Producto', producto.cantidad);
  }

  /**
   * Muestra notificación de venta completada
   */
  private showSaleCompletedNotification(total: string, receiptNumber: string): void {
    this.toastService.saleCompleted(total, receiptNumber);
  }

  // ========================================
  // MÉTODOS DE EJEMPLO PARA USAR TOAST
  // ========================================

  /**
   * Ejemplos de cómo usar el ToastService
   */
  mostrarToastEjemplos(): void {
    // Toast de éxito
    this.toastService.success(
      '✅ Operación Exitosa', 
      'El producto se agregó correctamente al carrito'
    );

    // Toast de error
    this.toastService.error(
      '❌ Error de Conexión', 
      'No se pudo conectar con el servidor'
    );

    // Toast de advertencia
    this.toastService.warning(
      '⚠️ Stock Bajo', 
      'Quedan menos de 5 unidades disponibles'
    );

    // Toast informativo
    this.toastService.info(
      'ℹ️ Información', 
      'Nuevo cliente seleccionado correctamente'
    );

    // Toast con acciones personalizadas
    this.toastService.success(
      '🛒 Producto Agregado',
      'iPhone 15 Pro agregado al carrito',
      {
        duration: 5000,
        actions: [
          {
            label: 'Ver Carrito',
            action: () => {
              console.log('Navegando al carrito...');
              // Aquí puedes agregar lógica para ir al carrito
            },
            primary: true
          },
          {
            label: 'Deshacer',
            action: () => {
              console.log('Deshaciendo acción...');
              // Aquí puedes agregar lógica para deshacer
            }
          }
        ]
      }
    );
  }

  // ========================================
  // MÉTODOS DE ACTUALIZACIÓN DE DATOS
  // ========================================

  /**
   * Refresca todos los datos del componente
   */
  refrescarDatos(): void {
    console.log('🔄 Refrescando datos del POS...');
    
    this.toastService.info(
      '🔄 Actualizando Inventarios',
      'Obteniendo datos más recientes del servidor...',
      { duration: 2000 }
    );

    // Marcar que es un refresh manual
    window.location.hash = 'refresh';

    // 🔄 FORZAR ACTUALIZACIÓN INMEDIATA (ignorar throttling para refrescos manuales)
    this.ultimaActualizacion = 0; // Reset del throttling
    this.actualizacionEnProgreso = false; // Reset del flag de progreso
    
    this.forzarActualizacionInventario();
    
    // Actualización forzada de cantidades
    if (this.productosAutoComplete.length > 0) {
      setTimeout(() => {
        this.actualizarCantidadesEnTiempoReal();
      }, 500);
    }
    
    // Confirmación de actualización después de 3 segundos
    setTimeout(() => {
      this.toastService.success(
        '✅ Inventario Actualizado',
        'Los datos han sido sincronizados correctamente',
        { duration: 2000 }
      );
    }, 3000);
    
    // Limpiar el flag de refresh después de un tiempo
    setTimeout(() => {
      if (window.location.hash.includes('refresh')) {
        window.location.hash = '';
      }
    }, 3000);
    
    console.log('✅ Solicitud de refresco enviada');
  }

  /**
   * Método para limpiar caché de búsqueda
   */
  limpiarCacheBusqueda(): void {
    this.productosAutoComplete = [];
    this.productoBusqueda = null;
    this.cdr.markForCheck();
  }

  /**
   * Fuerza la actualización del inventario limpiando cache y recargando datos
   */
  private forzarActualizacionInventario(): void {
    // Limpiar cache del servicio de inventario
    this.inventarioService['clearInventariosCache']();
    
    // Limpiar cache local
    this.limpiarCacheBusqueda();
    
    // Recargar productos populares para tener datos frescos
    this.cargarProductosPopulares();
  }

  // 🔄 VARIABLES PARA CONTROL DE RENDIMIENTO Y ACTUALIZACIONES EN TIEMPO REAL
  private ultimaActualizacion = 0;
  private actualizacionEnProgreso = false;
  private readonly INTERVALO_MINIMO_ACTUALIZACION = 5000; // 5 segundos entre actualizaciones
  public ultimaActualizacionInventario = new Date(); // Para mostrar al usuario
  
  // 🔒 VARIABLES PARA CONTROL DE MÚLTIPLES CLICS
  private nuevaVentaEnProceso = false;

  /**
   * Actualiza las cantidades de productos en el autoComplete con datos frescos
   * Incluye optimizaciones de rendimiento para evitar actualizaciones excesivas
   */
  private actualizarCantidadesEnTiempoReal(query?: string): void {
    const ahora = Date.now();
    
    // 🚀 OPTIMIZACIÓN: Evitar actualizaciones muy frecuentes
    if (ahora - this.ultimaActualizacion < this.INTERVALO_MINIMO_ACTUALIZACION) {
      console.log('⏳ Actualizacion omitida - muy frecuente');
      return;
    }
    
    // 🚀 OPTIMIZACIÓN: Evitar actualizaciones paralelas
    if (this.actualizacionEnProgreso) {
      console.log('⏳ Actualizacion omitida - ya en progreso');
      return;
    }
    
    if (this.productosAutoComplete.length === 0) return;
    
    // Obtener IDs de productos actualmente mostrados
    const inventarioIds = this.productosAutoComplete.map(p => p.id).filter((id): id is number => typeof id === 'number' && id > 0);
    
    if (inventarioIds.length === 0) return;
    
    this.actualizacionEnProgreso = true;
    this.ultimaActualizacion = ahora;
    
    // Hacer una búsqueda fresca sin cache
    const filtros = query ? { producto: query } : { soloAgotados: false };
    
    this.inventarioService.obtenerInventarios(0, 30, 'producto.nombre', 'asc', filtros).subscribe({
      next: (response) => {
        // Actualizar cantidades de productos existentes en la lista
        this.productosAutoComplete = this.productosAutoComplete.map(producto => {
          const inventarioActualizado = response.contenido.find(inv => inv.id === producto.id);
          if (inventarioActualizado) {
            return {
              ...producto,
              cantidad: inventarioActualizado.cantidad,
              stock: inventarioActualizado.cantidad,
              estado: inventarioActualizado.estado
            };
          }
          return producto;
        }).filter(p => p.cantidad > 0); // Filtrar productos sin stock
        
        this.actualizacionEnProgreso = false;
        this.ultimaActualizacionInventario = new Date(); // Actualizar timestamp
        this.cdr.markForCheck();
        console.log('🔄 Cantidades actualizadas en tiempo real');
      },
      error: (error) => {
        console.error('Error al actualizar cantidades:', error);
        this.actualizacionEnProgreso = false;
      }
    });
  }

  /**
   * Carga productos recientes para el autocompletado cuando no hay query
   */
  private cargarProductosRecientes(): void {
    this.inventarioService.obtenerInventarios(0, 10, 'id', 'desc', {
      soloStockCritico: false,
      soloAgotados: false
    }).subscribe({
      next: (response) => {
        this.productosAutoComplete = response.contenido
          .filter(inv => inv.cantidad > 0)
          .map(inv => {
            // Extraer precio usando método centralizado
            const precioFinal = this.extraerPrecioInventario(inv);
            
            const item: InventarioPOS = {
              id: inv.id || 0,
              serie: inv.serie || '',
              producto: inv.producto,
              color: inv.color,
              talla: inv.talla,
              almacen: inv.almacen,
              cantidad: inv.cantidad,
              estado: inv.estado,
              fechaCreacion: inv.fechaCreacion,
              fechaActualizacion: inv.fechaActualizacion,
              codigoCompleto: `${inv.producto?.codigo || ''}-${inv.color?.nombre?.substring(0, 2).toUpperCase() || 'SC'}-${inv.talla?.numero || ''}`,
              stock: inv.cantidad,
              precioUnitario: precioFinal,
              subtotal: 0,
              displayLabel: `${inv.producto?.codigo || ''} - ${inv.producto?.nombre || ''} (${inv.color?.nombre || ''}, ${inv.talla?.numero || ''})`
            };
            
            return item;
          });
        
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('❌ Error al cargar productos recientes:', error);
        // En caso de error, usar productos populares como fallback
        this.productosAutoComplete = this.productosPopulares.map(p => ({
          ...p,
          displayLabel: `${p.producto?.codigo || ''} - ${p.producto?.nombre || ''} (${p.color?.nombre || ''}, ${p.talla?.numero || ''})`
        }));
        this.cdr.markForCheck();
      }
    });
  }

  // ========================================
  // MÉTODOS DE PRECIOS Y VALIDACIÓN
  // ========================================

  /**
   * Extrae el precio de un inventario con múltiples fallbacks
   */
  private extraerPrecioInventario(inventario: any): number {
    const precio = inventario.producto?.precioVenta || 
                  inventario.producto?.precio || 
                  inventario.precioUnitario ||
                  inventario.precio ||
                  0;
    
    const precioFinal = Number(precio);
    
    return precioFinal;
  }

  /**
   * Valida que todos los items del carrito tengan precios válidos
   */
  private validarPreciosCarrito(): boolean {
    const itemsSinPrecio = this.carrito.filter(item => !item.precioUnitario || item.precioUnitario <= 0);
    
    if (itemsSinPrecio.length > 0) {
      console.error('❌ Items sin precio válido:', itemsSinPrecio);
      
      this.toastService.error(
        '❌ Error de Precios',
        `${itemsSinPrecio.length} productos en el carrito no tienen precio asignado. No se puede procesar la venta.`,
        { 
          persistent: true,
          actions: [
            {
              label: 'Ver Detalles',
              action: () => {

              }
            }
          ]
        }
      );
      
      return false;
    }
    
    return true;
  }

  // ========================================
  // MÉTODOS ESPECÍFICOS PARA EL POS
  // ========================================

  /**
   * Toast cuando se agrega un producto al carrito
   */
  notificarProductoAgregado(nombreProducto: string, cantidad: number): void {
    this.toastService.success(
      '🛒 Producto Agregado',
      `${cantidad}x ${nombreProducto} agregado al carrito`,
      {
        duration: 3000,
        icon: 'pi pi-shopping-cart'
      }
    );
  }

  /**
   * Toast para errores de stock
   */
  notificarErrorStock(nombreProducto: string, stockDisponible: number): void {
    this.toastService.error(
      '⚠️ Stock Insuficiente',
      `Solo quedan ${stockDisponible} unidades de ${nombreProducto}`,
      {
        duration: 5000,
        icon: 'pi pi-exclamation-triangle'
      }
    );
  }

  /**
   * Toast para cliente seleccionado
   */
  notificarClienteSeleccionado(nombreCliente: string): void {
    this.toastService.info(
      '👤 Cliente Seleccionado',
      `Venta para: ${nombreCliente}`,
      {
        duration: 3000,
        icon: 'pi pi-user'
      }
    );
  }

  /**
   * Toast para venta completada
   */
  notificarVentaCompletada(numeroVenta: string, total: number): void {
    this.toastService.success(
      '💰 Venta Completada',
      `Venta #${numeroVenta} - Total: ${this.formatearMoneda(total)}`,
      {
        duration: 5000,
        icon: 'pi pi-check-circle',
        actions: [
          {
            label: 'Imprimir',
            action: () => {
              console.log('Imprimiendo comprobante...');
              // Lógica para imprimir
            },
            primary: true
          },
          {
            label: 'Nueva Venta',
            action: () => {
              this.limpiarCarrito();
              console.log('Iniciando nueva venta...');
            }
          }
        ]
      }
    );
  }

  /**
   * Toast para errores de pago
   */
  notificarErrorPago(mensaje: string): void {
    this.toastService.error(
      '💳 Error en el Pago',
      mensaje,
      {
        persistent: true,
        icon: 'pi pi-credit-card',
        actions: [
          {
            label: 'Reintentar',
            action: () => {
              console.log('Reintentando pago...');
              // Lógica para reintentar
            },
            primary: true
          }
        ]
      }
    );
  }

  

  ngOnInit() {
    this.loadPermissions();
    this.inicializarEstadoCaja();
    this.generarNumeroVenta();
    this.inicializarComponente();
    
    // ✅ CARGA DIFERIDA ESCALONADA para no congelar el navegador
    setTimeout(() => this.cargarClientes(), 100);
    setTimeout(() => this.cargarProductos(), 300);
    setTimeout(() => this.cargarInventarios(), 500);
    setTimeout(() => this.cargarVentas(), 700);
    setTimeout(() => this.cargarProductosPopulares(), 900);
    setTimeout(() => this.cargarClientesRecientes(), 1100);
  }

    // ==================== INICIALIZACIÓN ====================
  
  private loadPermissions(): void {
    this.canCreate = this.permissionService.canCreate('ventas');
    this.canEdit = this.permissionService.canEdit('ventas');
    this.canDelete = this.permissionService.canDelete('ventas');
    this.canViewReports = this.permissionService.canView('reportes');
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
  
  

  /**
   * Inicializar actualización automática del inventario
   */
  private inicializarActualizacionInventario(): void {
    // 🔄 ACTUALIZACIÓN AUTOMÁTICA INTELIGENTE
    // Actualización periódica cada 60 segundos para mantener datos frescos
    interval(60000) // 1 minuto
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Solo actualizar si hay productos en la lista de búsqueda Y no hay actualización en progreso
        if (this.productosAutoComplete.length > 0 && !this.actualizacionEnProgreso) {
          console.log('🔄 Actualización periódica del inventario...');
          this.actualizarCantidadesEnTiempoReal();
        }
      });

    // 🔄 ACTUALIZACIÓN MÁS FRECUENTE DURANTE ACTIVIDAD INTENSA
    // Actualizar cada 20 segundos si hay carrito activo (pero respetando el throttling)
    interval(20000) // 20 segundos
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.carrito.length > 0 && 
            this.productosAutoComplete.length > 0 && 
            !this.actualizacionEnProgreso) {
          console.log('🔄 Actualización durante actividad...');
          this.actualizarCantidadesEnTiempoReal();
        }
      });
      
    console.log('✅ Sistema de actualización automática de inventario iniciado con optimizaciones');
  }


  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    // Cerrar diálogos dinámicos si están abiertos
    if (this.aperturaCajaRef) {
      this.aperturaCajaRef.close();
    }
    if (this.cierreCajaRef) {
      this.cierreCajaRef.close();
    }
  }

  // ==================== GESTIÓN DE CAJA ====================

  /**
   * Abre el diálogo de apertura de caja
   */
  abrirDialogoAperturaCaja(): void {
    this.aperturaCajaRef = this.dialogService.open(AperturaCajaDialogComponent, {
      header: 'Apertura de Caja',
      width: '550px',
      modal: true,
      draggable: false,
      closeOnEscape: false,
      closable: false,
      data: {
        // Aquí se pueden pasar datos iniciales si es necesario
      }
    });

    this.aperturaCajaRef.onClose.subscribe((result) => {
      if (result) {
        // Obtener usuario actual desde localStorage
        const userStr = localStorage.getItem('user');
        const usuario = userStr ? JSON.parse(userStr).username : 'Sistema';
        
        // Abrir caja en el servicio
        this.cajaStateService.abrirCaja(result, usuario);
        
        // Notificar al usuario
        this.toastService.success(
          '✅ Caja Abierta',
          `Caja abierta en ${result.tienda.nombre} - Turno ${result.turno}`,
          {
            duration: 5000,
            icon: 'pi pi-lock-open'
          }
        );

        // Forzar detección de cambios
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Abre el diálogo de cierre de caja
   */
  abrirDialogoCierreCaja(): void {
    const estadoActual = this.cajaStateService.obtenerEstadoActual();

    this.cierreCajaRef = this.dialogService.open(CierreCajaDialogComponent, {
      header: 'Cierre de Caja',
      width: '600px',
      modal: true,
      draggable: false,
      data: {
        estadoCaja: estadoActual
      }
    });

    this.cierreCajaRef.onClose.subscribe((result) => {
      if (result) {
        // Cerrar caja en el servicio
        this.cajaStateService.cerrarCaja(result);
        
        // Determinar el tipo de mensaje según la diferencia
        const diferencia = Math.abs(result.diferencia);
        let mensaje = `Cierre exitoso`;
        let icon = 'pi pi-lock';
        
        if (result.diferencia === 0) {
          mensaje += ' - Cuadre perfecto 🎯';
          this.toastService.success('✅ Cierre de Caja', mensaje, { duration: 5000, icon });
        } else if (diferencia <= 10) {
          mensaje += ` - Diferencia: S/ ${result.diferencia.toFixed(2)}`;
          this.toastService.warning('⚠️ Cierre de Caja', mensaje, { duration: 5000, icon });
        } else {
          mensaje += ` - Diferencia significativa: S/ ${result.diferencia.toFixed(2)}`;
          this.toastService.error('❌ Cierre de Caja', mensaje, { duration: 7000, icon });
        }

        // Emitir evento al padre si existe
        this.cerrarCajaEvent.emit();

        // Forzar detección de cambios
        this.cdr.markForCheck();
      }
    });
  }

  // ==== UTILIDADES ====

getCurrentDate(): string {
  return new Date().toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

getCurrentHour(): string {
  return new Date().toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

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

// Función para imprimir comprobante directamente en ticketera
imprimirComprobante(venta: VentaResponse): void {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🖨️ [INICIO] imprimirComprobante() - Impresión directa en ticketera');
  console.log('📦 Datos de venta recibidos:', venta);
  
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
  
  console.log('➡️ Imprimiendo en ticketera...');
  
  // Imprimir directamente en la ticketera
  this.imprimirSoloTicket(venta);
  
  console.log('✅ Solicitud de impresión enviada');
  console.log('═══════════════════════════════════════════════════════════');
}

/**
 * Muestra opciones de impresión al usuario
 */
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

testImpresion(): void {
  console.log('🔥🔥🔥 TEST IMPRESION LLAMADO 🔥🔥🔥');
  console.log('ventaParaComprobante:', this.ventaParaComprobante);
  alert('¡Botón funciona! ventaParaComprobante: ' + (this.ventaParaComprobante ? 'EXISTE' : 'NULL'));
}

/**
 * Imprime en ticketera usando formato específico
 */
private async imprimirEnTicketera(venta: VentaResponse): Promise<void> {
  try {
    console.log('🎫 Preparando impresión en ticketera...');
    
    this.toastService.info('⏳ Preparando', 'Generando ticket para impresión...', { duration: 2000 });

    // Opción 1: Usar servicio backend para impresión directa
    await this.enviarATicketeraViaBackend(venta);
    
    // Opción 2: Generar HTML y usar window.print() (fallback)
    // this.generarTicketHTML(venta);
    
  } catch (error) {
    console.error('❌ Error imprimiendo en ticketera:', error);
    this.toastService.error('❌ Error de Impresión', 'No se pudo imprimir en ticketera');
    
    // Fallback a impresión normal
    this.imprimirEnImpresoraNormal(venta);
  }
}

/**
 * Envía la venta al backend para impresión directa en ticketera
 */
private async enviarATicketeraViaBackend(venta: VentaResponse): Promise<void> {
  try {
    // Primero verificar conexión con ticketera
    console.log('📡 Verificando conexión con ticketera XPrinter XP-V320M...');
    
    this.comprobantesService.verificarConexionTicketera().subscribe({
      next: (conexion) => {
        if (conexion.success && conexion.conectada) {
          console.log('✅ Ticketera conectada, procediendo con impresión');          
          this.continuarConImpresion(venta);
        } else {
          console.warn('⚠️ Ticketera no conectada:', conexion.message);
          this.toastService.warning(
            '⚠️ Ticketera Desconectada',
            'No se pudo conectar con la ticketera. Verificando...',
            { duration: 3000 }
          );
          
          // Intentar de todas formas (quizás la verificación falló pero la impresora funciona)
          this.continuarConImpresion(venta);
        }
      },
      error: (error) => {
        console.warn('⚠️ Error verificando conexión, intentando impresión:', error);
        // Continuar con la impresión aunque la verificación falle
        this.continuarConImpresion(venta);
      }
    });
  } catch (error) {
    console.error('❌ Error en envío a ticketera via backend:', error);
    throw error;
  }
}

/**
 * Continúa con el proceso de impresión después de verificar conexión
 */
private continuarConImpresion(venta: VentaResponse): void {
  // Obtener o generar el comprobante
  this.comprobantesService.obtenerComprobantePorVenta(venta.id).subscribe({
    next: (comprobante) => {
      console.log('✅ Comprobante encontrado, enviando a ticketera:', comprobante.id);
      this.enviarComprobanteATicketera(comprobante.id);
    },
    error: (error) => {
      if (error.status === 404) {
        console.log('🔄 Comprobante no existe, generando para ticketera...');
        this.generarYEnviarATicketera(venta);
      } else {
        console.error('❌ Error obteniendo comprobante:', error);
        this.toastService.error('❌ Error', 'No se pudo obtener el comprobante para impresión');
      }
    }
  });
}

/**
 * Genera comprobante y lo envía a ticketera
 */
private generarYEnviarATicketera(venta: VentaResponse): void {
  const comprobanteRequest = {
    ventaId: venta.id,
    tipoDocumento: 'TICKET' as const, // Para ticketera usar tipo TICKET
    serie: 'T001', // Serie específica para tickets
    observaciones: `Ticket generado para impresión en ticketera`
  };

  this.comprobantesService.generarComprobante(comprobanteRequest).subscribe({
    next: (comprobante) => {
      console.log('✅ Comprobante tipo TICKET generado:', comprobante.id);
      this.enviarComprobanteATicketera(comprobante.id);
    },
    error: (error) => {
      console.error('❌ Error generando comprobante para ticketera:', error);
      this.toastService.error('❌ Error', 'No se pudo generar el ticket');
    }
  });
}

/**
 * Envía comprobante específico a la ticketera
 */
private enviarComprobanteATicketera(comprobanteId: number): void {
  this.toastService.info('🎫 Enviando', 'Enviando ticket a XPrinter XP-V320M...', { duration: 2000 });
  
  this.comprobantesService.imprimirEnTicketera(comprobanteId).subscribe({
    next: (response) => {
      console.log('✅ Respuesta de ticketera:', response);
      
      if (response.success) {
        this.toastService.success(
          '✅ Impreso en Ticketera',
          response.message || 'El ticket se ha enviado correctamente a la XPrinter XP-V320M',
          { duration: 4000 }
        );
        
        // Opcional: ofrecer cortar papel
        this.ofrecerCortarPapel();
        
      } else {
        console.warn('⚠️ Impresión falló según backend:', response.message);
        this.toastService.error(
          '❌ Error de Impresión',
          response.message || 'No se pudo imprimir en la ticketera',
          { duration: 4000 }
        );
        
        // Fallback: mostrar vista previa
        this.mostrarVistaPreviaComoFallback(comprobanteId);
      }
    },
    error: (error) => {
      console.error('❌ Error enviando a ticketera:', error);
      
      let mensaje = 'No se pudo enviar a la ticketera';
      if (error.message?.includes('conectar')) {
        mensaje = 'Verifique que la XPrinter XP-V320M esté conectada y encendida';
      }
      
      this.toastService.error('❌ Error de Conexión', mensaje, { duration: 5000 });
      
      // Fallback: mostrar vista previa
      this.mostrarVistaPreviaComoFallback(comprobanteId);
    }
  });
}

/**
 * Ofrece al usuario cortar el papel después de imprimir
 */
private ofrecerCortarPapel(): void {
  setTimeout(() => {
    this.confirmationService.confirm({
      header: '✂️ Cortar Papel',
      message: '¿Desea cortar el papel de la ticketera?',
      icon: 'pi pi-question-circle',
      acceptLabel: 'Sí, Cortar',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-success p-button-sm',
      rejectButtonStyleClass: 'p-button-secondary p-button-sm',
      accept: () => {
        this.cortarPapelTicketera();
      }
    });
  }, 1000);
}

/**
 * Corta el papel de la ticketera
 */
private cortarPapelTicketera(): void {
  this.comprobantesService.cortarPapel().subscribe({
    next: (response) => {
      if (response.success) {
        this.toastService.success('✂️ Papel Cortado', response.message, { duration: 2000 });
      } else {
        this.toastService.warning('⚠️ Aviso', response.message, { duration: 3000 });
      }
    },
    error: (error) => {
      console.error('❌ Error cortando papel:', error);
      this.toastService.error('❌ Error', 'No se pudo cortar el papel', { duration: 3000 });
    }
  });
}

/**
 * Muestra vista previa como fallback cuando falla la impresión
 */
private mostrarVistaPreviaComoFallback(comprobanteId: number): void {
  console.log('🔄 Mostrando vista previa como fallback...');
  
  this.comprobantesService.obtenerVistaPreviaTicket(comprobanteId).subscribe({
    next: (response) => {
      if (response.success) {
        this.mostrarDialogoVistaPrevia(response.contenido);
      } else {
        // Último fallback: generar HTML básico
        this.generarTicketHTML(comprobanteId);
      }
    },
    error: (error) => {
      console.error('❌ Error obteniendo vista previa:', error);
      // Último fallback: generar HTML básico
      this.generarTicketHTML(comprobanteId);
    }
  });
}

/**
 * Muestra diálogo con vista previa del ticket
 */
private mostrarDialogoVistaPrevia(contenido: string): void {
  // Crear un diálogo simple con el contenido del ticket
  this.confirmationService.confirm({
    header: '👁️ Vista Previa del Ticket',
    message: `<pre style="font-family: monospace; font-size: 12px; text-align: left;">${contenido}</pre>`,
    icon: 'pi pi-eye',
    acceptLabel: 'Cerrar',
    rejectLabel: 'Intentar Imprimir',
    acceptButtonStyleClass: 'p-button-secondary p-button-sm',
    rejectButtonStyleClass: 'p-button-primary p-button-sm',
    reject: () => {
      // Mostrar opciones de configuración
      this.mostrarOpcionesConfiguracion();
    }
  });
}

/**
 * Imprime usando impresora normal (PDF)
 */
private imprimirEnImpresoraNormal(venta: VentaResponse): void {
  console.log('🖨️ Imprimiendo en impresora normal...');
  
  this.toastService.info('⏳ Preparando', 'Generando PDF para impresión...', { duration: 2000 });
  
  // Usar la función de descarga PDF pero abrir para imprimir
  this.comprobantesService.obtenerComprobantePorVenta(venta.id).subscribe({
    next: (comprobante) => {
      this.comprobantesService.descargarPDF(comprobante.id).subscribe({
        next: (blob) => {
          this.abrirPDFParaImprimir(blob, `comprobante-${venta.numeroVenta}.pdf`);
        },
        error: (error) => {
          console.error('❌ Error descargando PDF para imprimir:', error);
          this.toastService.error('❌ Error', 'No se pudo preparar el PDF para impresión');
        }
      });
    },
    error: (error) => {
      if (error.status === 404) {
        console.log('🔄 Generando comprobante para impresión normal...');
        this.generarYAbrirParaImprimir(venta);
      } else {
        this.toastService.error('❌ Error', 'No se pudo obtener el comprobante');
      }
    }
  });
}

/**
 * Genera comprobante y lo abre para imprimir
 */
private generarYAbrirParaImprimir(venta: VentaResponse): void {
  const comprobanteRequest = {
    ventaId: venta.id,
    tipoDocumento: 'BOLETA' as const,
    serie: 'B001',
    observaciones: `Comprobante generado para impresión`
  };

  this.comprobantesService.generarComprobante(comprobanteRequest).subscribe({
    next: (comprobante) => {
      this.comprobantesService.descargarPDF(comprobante.id).subscribe({
        next: (blob) => {
          this.abrirPDFParaImprimir(blob, `comprobante-${venta.numeroVenta}.pdf`);
        }
      });
    }
  });
}

/**
 * Abre PDF en nueva ventana para imprimir
 */
private abrirPDFParaImprimir(blob: Blob, nombreArchivo: string): void {
  try {
    const url = window.URL.createObjectURL(blob);
    const ventana = window.open(url, '_blank');
    
    if (ventana) {
      ventana.onload = () => {
        setTimeout(() => {
          ventana.print();
        }, 500);
      };
      
      this.toastService.success(
        '✅ Listo para Imprimir',
        'Se ha abierto el comprobante en una nueva ventana',
        { duration: 3000 }
      );
    } else {
      // Fallback: descargar archivo
      this.comprobantesService.descargarArchivo(blob, nombreArchivo);
      this.toastService.info('📁 Descargado', 'Archivo descargado para imprimir manualmente');
    }
    
    // Limpiar URL después de un tiempo
    setTimeout(() => window.URL.revokeObjectURL(url), 5000);
    
  } catch (error) {
    console.error('❌ Error abriendo PDF:', error);
    this.toastService.error('❌ Error', 'No se pudo abrir el PDF para imprimir');
  }
}

/**
 * Genera HTML de ticket para impresión web (fallback)
 */
private generarTicketHTML(comprobanteId: number): void {
  // Implementar generación de HTML específico para tickets
  console.log('🎫 Generando HTML de ticket para impresión web como fallback');
  
  // TODO: Implementar plantilla HTML para tickets
  this.toastService.info('🔄 Alternativa', 'Preparando ticket en formato web...');
}

// Función para enviar por email
enviarComprobantePorEmail(venta: VentaResponse): void {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📧 [INICIO] enviarComprobantePorEmail() llamado');
  console.log('📦 Venta recibida:', venta);
  
  if (!venta?.id) {
    console.error('❌ ERROR: venta sin ID');
    this.toastService.error('❌ Error', 'No se puede enviar: Venta inválida');
    return;
  }
  
  const email = (venta.cliente as { email?: string }).email || 'cliente@ejemplo.com';
  console.log('📧 Email destino:', email);
  console.log('⚠️ NOTA: Funcionalidad de envío por email pendiente de implementación');
  
  this.toastService.info('📧 Enviar Email', `Enviando comprobante a ${email}...`);
  console.log('═══════════════════════════════════════════════════════════');
  
  // TODO: Implementar envío real por email
  // this.comprobantesService.enviarPorEmail(venta.id, email).subscribe(...)
}



  // 🚀 MÉTODOS DE TRACKING PARA OPTIMIZACIÓN
  trackByProductoId(index: number, producto: Inventario): number {
    return producto?.id || index;
  }

  trackByProductoPopularId(index: number, producto: Inventario): number {
    return producto?.id || index;
  }

  trackByInventarioId(index: number, item: Inventario): number {
    return item?.id || index;
  }

  trackByItemCarritoId(index: number, item: ItemCarrito): number {
    return item?.inventarioId || index;
  }


  // ✅ INICIALIZACIÓN
  private inicializarComponente() {
    // Limpiar cachés al inicializar para obtener datos frescos
    this.limpiarCacheBusqueda();
    
    // Cargar datos iniciales
    this.cargarClientesRecientes();
    this.calcularTotales();
    
    
    console.log(`🚀 POS iniciado por ${this.currentUser} - ${this.getCurrentDateTime()}`);
  }


  private configurarShortcuts() {
    document.addEventListener('keydown', (event) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case 'F3':
          event.preventDefault();
          this.openClientModal();
          break;
        case 'F8':
          event.preventDefault();
          this.activarScanner();
          break;
        case 'F12':
          event.preventDefault();
          if (this.canProcessPayment()) {
            this.iniciarPago();
          }
          break;
        case 'Escape':
          event.preventDefault();
          this.cerrarModales();
          break;
      }

      if (event.ctrlKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            this.pagoRapido('EFECTIVO');
            break;
          case '2':
            event.preventDefault();
            this.pagoRapido('TARJETA_DEBITO');
            break;
          case '3':
            event.preventDefault();
            this.pagoRapido('YAPE');
            break;
          case 'Delete':
            event.preventDefault();
            this.limpiarCarrito();
            break;
        }
      }
    });
  }

   // Métodos de acción
   verDetalleVentas(): void {
    console.log('📊 Abriendo detalle de ventas...');
    alert('Detalle de Ventas - Módulo en desarrollo');
  }

  verStockCritico(): void {
    console.log('⚠️ Abriendo alertas de stock crítico...');
    alert('Stock Crítico:\n• Polo Blanco M (3 uds)\n• Jean Azul 32 (2 uds)\n• Camisa Negra L (1 ud)');
  }

  exportarRapido(): void {
    this.exportarReporte('excel');
  }

  exportarReporte(tipo: string): void {
    // TODO: Implementar exportación de reportes
    this.mostrarInfo('Exportando', `Generando reporte de ${tipo}...`);
  }



  // ✅ MÉTODOS DE BÚSQUEDA Y PRODUCTOS
  buscarProductoPorCodigo() {
    if (!this.codigoBusqueda.trim()) return;

    this.searchingProducts = true;
    this.loadingMessage = 'Buscando producto...';
    this.cdr.markForCheck();

    // Buscar producto usando el servicio real
    this.inventarioService.obtenerInventarios(0, 10, 'id', 'asc', {
      producto: this.codigoBusqueda.trim()
    }).subscribe({
      next: (response) => {
        const productoEncontrado = response.contenido.find(inv => 
          inv.producto?.codigo?.toLowerCase() === this.codigoBusqueda.trim().toLowerCase() ||
          inv.serie?.toLowerCase() === this.codigoBusqueda.trim().toLowerCase()
        );
        
        if (productoEncontrado && productoEncontrado.cantidad > 0) {
          // Transformar el producto al formato esperado
          const precioUnitario = Number(productoEncontrado.producto?.precioVenta) || 0;
          const inventarioTransformado: InventarioPOS = {
            id: productoEncontrado.id || 0,
            serie: productoEncontrado.serie || '',
            producto: productoEncontrado.producto,
            color: productoEncontrado.color,
            talla: productoEncontrado.talla,
            almacen: productoEncontrado.almacen,
            cantidad: productoEncontrado.cantidad,
            estado: productoEncontrado.estado,
            fechaCreacion: productoEncontrado.fechaCreacion,
            fechaActualizacion: productoEncontrado.fechaActualizacion,
            codigoCompleto: `${productoEncontrado.producto?.codigo || ''}-${productoEncontrado.color?.nombre?.substring(0, 2).toUpperCase() || 'SC'}-${productoEncontrado.talla?.numero || ''}`,
            stock: productoEncontrado.cantidad,
            precioUnitario: precioUnitario,
            subtotal: 0
          };

          this.agregarAlCarrito(inventarioTransformado, this.cantidadInput);
          this.codigoBusqueda = '';
          this.cantidadInput = 1;
          this.messageService.add({
            severity: 'success',
            summary: 'Producto Agregado',
            detail: `${inventarioTransformado.producto?.nombre || 'Producto'} agregado al carrito`
          });
        } else {
          this.messageService.add({
            severity: 'warn',
            summary: 'Producto No Encontrado',
            detail: `No se encontró producto con código: ${this.codigoBusqueda} o sin stock disponible`
          });
        }

        this.searchingProducts = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error al buscar producto por código:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error de Búsqueda',
          detail: 'Error al buscar el producto. Verifique la conexión.'
        });
        this.searchingProducts = false;
        this.cdr.markForCheck();
      }
    });
  }

  buscarProductosAutoComplete(event: { query: string }) {
    const query = event.query;
    
    if (!query || query.length < 1) {
      // Si no hay query, obtener productos recientes del servidor con datos frescos
      this.cargarProductosRecientes();
      return;
    }

    this.searchingProducts = true;
    this.loadingMessage = 'Buscando productos...';
    this.cdr.markForCheck();

    // 🔄 FORZAR DATOS FRESCOS: Limpiar cache antes de buscar para obtener cantidades actualizadas
    this.inventarioService['clearInventariosCache']();

    // Buscar usando el servicio real de inventario con parámetros optimizados
    this.inventarioService.obtenerInventarios(0, 30, 'producto.nombre', 'asc', {
      producto: query,
      soloStockCritico: false,
      soloAgotados: false  // Solo productos con stock disponible
    }).subscribe({
      next: (response) => {
        if (!response.contenido || response.contenido.length === 0) {
          this.productosAutoComplete = [];
          this.searchingProducts = false;
          this.cdr.markForCheck();
          return;
        }
        
        // Transformar los datos del inventario al formato esperado por el componente
        this.productosAutoComplete = response.contenido
          .filter(inv => inv.cantidad > 0) // Solo productos con stock
          .map(inv => {
            // Extraer precio usando método centralizado
            const precioFinal = this.extraerPrecioInventario(inv);
            
            const item: InventarioPOS = {
              id: inv.id || 0,
              serie: inv.serie || '',
              producto: inv.producto ? {
                id: inv.producto.id || 0,
                codigo: inv.producto.codigo || '',
                nombre: inv.producto.nombre || '',
                descripcion: inv.producto.descripcion || '',
                imagen: inv.producto.imagen || '',
                marca: inv.producto.marca || '',
                modelo: inv.producto.modelo || '',
                precioCompra: inv.producto.precioCompra || 0,
                precioVenta: inv.producto.precioVenta || precioFinal
              } : null,
              color: inv.color,
              talla: inv.talla,
              almacen: inv.almacen,
              cantidad: inv.cantidad,
              estado: inv.estado,
              fechaCreacion: inv.fechaCreacion,
              fechaActualizacion: inv.fechaActualizacion,
              codigoCompleto: `${inv.producto?.codigo || ''}-${inv.color?.nombre?.substring(0, 2).toUpperCase() || 'SC'}-${inv.talla?.numero || ''}`,
              stock: inv.cantidad,
              precioUnitario: precioFinal,
              subtotal: 0,
              displayLabel: `${inv.producto?.codigo || ''} - ${inv.producto?.nombre || ''} (${inv.color?.nombre || ''}, ${inv.talla?.numero || ''})`
            };
            
            return item;
          });
        
        this.searchingProducts = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error al buscar productos:', error);
        this.productosAutoComplete = [];
        this.searchingProducts = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error de Búsqueda',
          detail: 'No se pudieron cargar los productos. Verifique la conexión.'
        });
        this.cdr.markForCheck();
      }
    });
  }

  seleccionarProductoAutoComplete(event: { value: InventarioPOS }) {
    if (event && event.value) {
      this.agregarAlCarrito(event.value, 1);
      this.productoBusqueda = null;
    }
  }

  seleccionarProductoPopular(producto: InventarioPOS) {
    this.agregarAlCarrito(producto, 1);
  }

  // ✅ GESTIÓN DEL CARRITO
  agregarAlCarrito(inventario: InventarioPOS, cantidad: number) {
    // 🔍 Debug: Verificar precio del inventario antes de agregar
    
    this.addingToCart = true;
    this.loadingMessage = 'Agregando al carrito...';
    this.cdr.markForCheck();

    setTimeout(() => {
      const existeEnCarrito = this.carrito.find(item => item.inventarioId === inventario.id);

      if (existeEnCarrito) {
        const nuevaCantidad = existeEnCarrito.cantidad + cantidad;
        if (nuevaCantidad <= inventario.stock) {
          existeEnCarrito.cantidad = nuevaCantidad;
          existeEnCarrito.subtotal = existeEnCarrito.cantidad * existeEnCarrito.precioUnitario;
          
          // 🎉 Notificación moderna de producto actualizado
          this.toastService.success(
            '🔄 Cantidad Actualizada',
            `${inventario.producto?.nombre || 'Producto'} ahora tiene ${nuevaCantidad} unidades`,
            { duration: 2500, icon: 'pi pi-refresh' }
          );
        } else {
          // 🚫 Notificación moderna de stock insuficiente
          this.showStockError(inventario);
        }
      } else {
        if (cantidad <= inventario.stock) {
          // Validar y corregir precio si es necesario
          let precioUnitario = inventario.precioUnitario || inventario.producto?.precioVenta || inventario.producto?.precioCompra || 0;
          
          // Si el precio sigue siendo 0, intentar obtenerlo directamente
          if (precioUnitario === 0 && inventario.producto?.id) {
            const precioDirecto = this.obtenerPrecioProducto(inventario.producto.id);
            
            if (precioDirecto > 0 && inventario.producto) {
              // Actualizar el precio y continuar con la adición
              inventario.producto.precioVenta = precioDirecto;
              inventario.precioUnitario = precioDirecto;
              precioUnitario = precioDirecto;
            } else {
              // Si aún no se puede obtener el precio, mostrar error
              console.error('❌ NO SE PUDO OBTENER PRECIO DIRECTAMENTE');
              this.toastService.error(
                '❌ Error de Precio',
                `El producto ${inventario.producto?.nombre || 'desconocido'} no tiene precio asignado en el sistema.`,
                { 
                  duration: 6000,
                  persistent: true,
                  actions: [
                    {
                      label: 'Ver Detalles',
                      action: () => {

                      }
                    }
                  ]
                }
              );
              
              this.addingToCart = false;
              this.cdr.markForCheck();
              return;
            }
          }
          
          const nuevoItem: ItemCarrito = {
            inventarioId: inventario.id || 0,
            producto: inventario.producto || {
              id: 0,
              nombre: 'Producto desconocido',
              descripcion: '',
              marca: '',
              modelo: '',
              precioCompra: 0,
              precioVenta: precioUnitario
            },
            color: {
              id: inventario.color?.id || 0,
              nombre: inventario.color?.nombre || 'Sin color',
              codigo: inventario.color?.nombre?.substring(0, 2).toUpperCase() || 'SC'
            },
            talla: {
              id: inventario.talla?.id || 0,
              numero: inventario.talla?.numero || 'Sin talla'
            },
            cantidad: cantidad,
            precioUnitario: precioUnitario,
            subtotal: cantidad * precioUnitario,
            stock: inventario.stock,
            codigoCompleto: inventario.codigoCompleto
          };
          this.carrito.push(nuevoItem);
          
          // 🛒 Notificación moderna de producto agregado
          this.showProductAddedNotification(inventario, cantidad);
          
          // 🔄 ACTUALIZACIÓN EN TIEMPO REAL: Actualizar inventario después de agregar al carrito
          this.forzarActualizacionInventario();
          
          // También actualizar las cantidades en la lista actual de autoComplete
          setTimeout(() => {
            this.actualizarCantidadesEnTiempoReal();
          }, 100);
        } else {
          this.showStockError(inventario);
        }
      }

      this.calcularTotales();
      this.addingToCart = false;
      this.cdr.markForCheck();
    }, 500);
  }

  actualizarCantidadItem(item: ItemCarrito, nuevaCantidad: number) {
    if (nuevaCantidad >= 1 && nuevaCantidad <= item.stock) {
      item.cantidad = nuevaCantidad;
      item.subtotal = item.cantidad * item.precioUnitario;
      this.calcularTotales();
      
      // 🔄 ACTUALIZACIÓN EN TIEMPO REAL: Actualizar cantidades en búsqueda
      setTimeout(() => {
        this.actualizarCantidadesEnTiempoReal();
      }, 100);
      
      this.cdr.markForCheck();
    }
  }

  eliminarItemCarrito(item: ItemCarrito) {
    const index = this.carrito.indexOf(item);
    if (index > -1) {
      this.carrito.splice(index, 1);
      this.calcularTotales();
      this.messageService.add({
        severity: 'info',
        summary: 'Producto Eliminado',
        detail: `${item.producto.nombre} eliminado del carrito`
      });
      
      // 🔄 ACTUALIZACIÓN EN TIEMPO REAL: Actualizar cantidades después de eliminar
      setTimeout(() => {
        this.actualizarCantidadesEnTiempoReal();
      }, 100);
      
      this.cdr.markForCheck();
    }
  }

  limpiarCarrito() {
    const cantidadItems = this.carrito.length;
    this.carrito = [];
    this.calcularTotales();
    
    // Generar nuevo número de venta para la siguiente transacción
    this.generarNumeroVenta();
    
    // 🗑️ Notificación moderna de carrito limpio
    this.toastService.info(
      '🗑️ Carrito Limpio',
      `${cantidadItems} productos eliminados del carrito`,
      { 
        duration: 3000,
        icon: 'pi pi-trash',
        actions: [
          {
            label: 'Deshacer',
            action: () => {
              // Podrías implementar lógica para deshacer si guardas el estado previo
              this.toastService.warning('⚠️ Función no disponible', 'No se puede deshacer esta acción');
            }
          }
        ]
      }
    );
    
    this.cdr.markForCheck();
  }

  // ✅ CÁLCULOS
  calcularTotales() {
    // Suma de todos los productos (precio con IGV incluido)
    const totalConIGV = this.carrito.reduce((sum, item) => sum + item.subtotal, 0);
    
    // Aplicar descuento al total
    this.descuentoVenta = this.aplicarDescuento ? (totalConIGV * this.porcentajeDescuento / 100) : 0;
    const totalConDescuento = totalConIGV - this.descuentoVenta;
    
    // Cálculo del IGV (18%)
    // El total ya incluye IGV, entonces dividimos entre 1.18 para obtener la base imponible
    this.operacionGravada = totalConDescuento / 1.18;
    this.igvVenta = totalConDescuento - this.operacionGravada;
    
    // Totales finales
    this.subtotalVenta = this.operacionGravada; // Base imponible (sin IGV)
    this.totalVenta = totalConDescuento; // Total con IGV incluido
  }

  toggleDescuento() {
    if (!this.aplicarDescuento) {
      this.porcentajeDescuento = 0;
    }
    this.calcularDescuento();
  }

  calcularDescuento() {
    this.calcularTotales();
    this.cdr.markForCheck();
  }

  // ✅ GESTIÓN DE CLIENTES
  openClientModal() {
    this.showClientModal = true;
    this.cargarClientesFiltrados();
    this.cdr.markForCheck();
  }

  buscarClientes(event: { query: string }) {
    const query = event.query;
    
    if (!query || query.length < 1) {
      // Si no hay query, cargar clientes activos
      this.loadingClient = true;
      this.loadingMessage = 'Cargando clientes...';
      this.cdr.markForCheck();

      this.clienteService.listarActivos().subscribe({
        next: (clientes) => {
          this.clientesFiltrados = clientes;
          this.loadingClient = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error al cargar clientes:', error);
          this.clientesFiltrados = [];
          this.loadingClient = false;
          this.cdr.markForCheck();
        }
      });
      return;
    }

    this.loadingClient = true;
    this.loadingMessage = 'Buscando clientes...';
    this.cdr.markForCheck();

    // Buscar clientes usando el servicio real
    this.clienteService.buscar(query).subscribe({
      next: (clientes) => {
        this.clientesFiltrados = clientes;
        this.loadingClient = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error al buscar clientes:', error);
        this.clientesFiltrados = [];
        this.loadingClient = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error de Búsqueda',
          detail: 'No se pudieron cargar los clientes. Verifique la conexión.'
        });
        this.cdr.markForCheck();
      }
    });
  }

  onClienteSelect(event: { value: Cliente }) {
    if (event && event.value) {
      this.seleccionarCliente(event.value);
    }
  }

  seleccionarCliente(cliente: Cliente) {
  this.clienteSeleccionado = cliente;
  
  if (cliente?.id) {
    this.nuevaVenta.clienteId = cliente.id;
    
    // Notificación de cliente seleccionado
    this.notificarClienteSeleccionado(`${cliente.nombres} ${cliente.apellidos}`);
  } else {
    console.warn('Cliente sin ID válido:', cliente);
    
    // Notificación de error
    this.toastService.warning(
      'Cliente sin ID',
      'El cliente seleccionado no tiene un ID válido',
      { duration: 4000 }
    );
  }
  
  this.cdr.markForCheck();
}

  confirmarCliente() {
    if (this.clienteSeleccionado) {
      this.showClientModal = false;
      this.messageService.add({
        severity: 'success',
        summary: 'Cliente Seleccionado',
        detail: `${this.clienteSeleccionado.nombres} ${this.clienteSeleccionado.apellidos}`
      });
      this.cdr.markForCheck();
    }
  }

  limpiarClienteSeleccionado() {
    this.clienteSeleccionado = null;
    this.cdr.markForCheck();
  }

  // ✅ MÉTODOS DE CLIENTE MODAL
  filtrarClientesPorTipo(tipo: string) {
    // Implementar filtros por tipo de cliente
    console.log('Filtrar por tipo:', tipo);
  }

  nuevoCliente() {
    // Implementar creación de nuevo cliente
    console.log('Crear nuevo cliente');
  }

  editarCliente() {
    // Implementar edición de cliente
    console.log('Editar cliente');
  }

  // ✅ ESCÁNER
  activarScanner() {
    this.connectingScanner = true;
    this.loadingMessage = 'Conectando cámara...';
    this.cdr.markForCheck();

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        this.stream = stream;
        this.scannerActive = true;
        this.connectingScanner = false;
        this.cdr.markForCheck();

        setTimeout(() => {
          if (this.videoElement) {
            this.videoElement.nativeElement.srcObject = stream;
            this.videoElement.nativeElement.play();
          }
        }, 100);
      })
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .catch(error => {
        this.connectingScanner = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error de Cámara',
          detail: 'No se pudo acceder a la cámara'
        });
        this.cdr.markForCheck();
      });
  }

  cerrarScanner() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.scannerActive = false;
    this.cdr.markForCheck();
  }

  // ✅ PAGOS
  canProcessPayment(): boolean {
    const validaciones = {
      tieneCliente: this.clienteSeleccionado !== null,
      tieneProductos: this.carrito.length > 0,
      tieneTotal: this.totalVenta > 0,
      tieneComprobante: !!this.nuevaVenta.tipoComprobante,
      tieneSerie: !!this.nuevaVenta.serieComprobante
    };
    
    const puedeProceser = validaciones.tieneCliente && 
          validaciones.tieneProductos && 
          validaciones.tieneTotal &&
          validaciones.tieneComprobante &&
          validaciones.tieneSerie;
  
    
    return puedeProceser;
  }

  iniciarPago(): void {
    // ✅ Validación 1: Cliente
    if (!this.clienteSeleccionado) {
      console.error('❌ [INICIO PAGO] No hay cliente seleccionado');
      this.mostrarError('Cliente requerido', 'Debe seleccionar un cliente');
      return;
    }
    
    // ✅ Validación 2: Carrito
    if (this.carrito.length === 0) {
      console.error('❌ [INICIO PAGO] Carrito vacío');
      this.mostrarError('Carrito vacío', 'Debe agregar productos antes de procesar el pago');
      return;
    }
    
    // ✅ Validación 3: Tipo de comprobante
    if (!this.nuevaVenta.tipoComprobante) {
      console.error('❌ [INICIO PAGO] No hay tipo de comprobante');
      this.mostrarError('Comprobante requerido', 'Debe seleccionar un tipo de comprobante');
      return;
    }
    
    // ✅ Validación 4: Serie de comprobante
    if (!this.nuevaVenta.serieComprobante) {
      console.error('❌ [INICIO PAGO] No hay serie de comprobante');
      this.mostrarError('Serie requerida', 'Debe seleccionar una serie de comprobante');
      return;
    }
    
    // ✅ Inicializar estado de pago
    this.pagoActual = this.initPago();
    this.pagoActual.monto = this.totalVenta;
    this.montoPagado = this.totalVenta;
    this.calcularVuelto();
    
    // 🔥 Abrir el diálogo directamente
    this.pagoDialog = true;
  }

   // Método para manejar el evento de procesar pago desde el componente POS
  onProcesarPagoDesdePOS(datosPago: {
    carrito: any[];
    cliente: any;
    totalVenta: number;
    subtotalVenta: number;
    igvVenta: number;
    descuentoVenta: number;
  }): void {
    console.log('💳 Recibiendo datos de pago desde POS:', datosPago);
    
    // Actualizar los datos del componente padre con los datos del POS
    this.carrito = datosPago.carrito;
    this.clienteSeleccionado = datosPago.cliente;
    this.totalVenta = datosPago.totalVenta;
    this.subtotalVenta = datosPago.subtotalVenta;
    this.descuentoVenta = datosPago.descuentoVenta;
    
    // Inicializar el pago
    this.pagoActual = this.initPago();
    this.pagoActual.monto = this.totalVenta;
    this.montoPagado = this.totalVenta;
    this.calcularVuelto();
    
    // Abrir el diálogo de pago
    this.pagoDialog = true;
    
    console.log('✅ Diálogo de pago abierto desde POS');
  }


  pagoRapido(metodoPago: string): void {
    console.log(`🚀 [PAGO RÁPIDO] Método: ${metodoPago}`);
    
    // ✅ Validaciones básicas
    if (!this.canProcessPayment()) {
      console.error('❌ No se puede procesar el pago');
      return;
    }
    
    // ✅ Llamar a iniciarPago() primero
    this.iniciarPago();
    
    // ✅ Pre-seleccionar el método de pago después de abrir
    setTimeout(() => {
      this.seleccionarMetodoPago(metodoPago);
      console.log(`✅ [PAGO RÁPIDO] Método preseleccionado: ${metodoPago}`);
    }, 300);
  }

  // Nuevo método para inicializar datos del pago
  private inicializarDatosPago(metodoPago: string = 'EFECTIVO'): void {
    console.log('🔧 Inicializando datos del pago...');
    
    // Resetear y configurar datos del pago
    this.pagoActual = {
      ventaId: 0, // Se asignará después de registrar la venta
      usuarioId: 1, // TODO: obtener del AuthService
      metodoPago: metodoPago,
      monto: this.totalVenta,
      nombreTarjeta: '',
      ultimos4Digitos: '',
      numeroReferencia: '',
      observaciones: ''
    };

    // Configurar montos
    if (metodoPago === 'EFECTIVO') {
      // Para efectivo, redondear a múltiplos de 10
      this.montoPagado = Math.ceil(this.totalVenta / 10) * 10;
    } else {
      // Para otros métodos, el monto exacto
      this.montoPagado = this.totalVenta;
    }
    
    this.calcularVuelto();
    
    // Asegurar que el pago no esté en proceso
    this.procesandoPago = false;
    
    console.log('✅ Datos del pago inicializados:', {
      usuarioId: this.pagoActual.usuarioId,
      metodoPago: this.pagoActual.metodoPago,
      monto: this.pagoActual.monto,
      montoPagado: this.montoPagado,
      vuelto: this.vuelto
    });
  }

  private simularProcesamientoPago(metodo?: string) {
    const pasos = [
      'Validando productos...',
      'Calculando totales...',
      'Procesando pago...',
      'Generando comprobante...',
      'Actualizando inventario...',
      'Enviando a SUNAT...',
      'Finalizando venta...'
    ];

    let pasoActual = 0;
    const interval = setInterval(() => {
      this.progressPercentage += Math.random() * 15 + 10;
      
      if (pasoActual < pasos.length) {
        this.loadingMessage = pasos[pasoActual];
        pasoActual++;
      }

      this.cdr.markForCheck();

      if (this.progressPercentage >= 100) {
        this.progressPercentage = 100;
        clearInterval(interval);

        setTimeout(() => {
          this.finalizarVenta(metodo);
        }, 1000);
      }
    }, 400);
  }

  private finalizarVenta(metodo?: string) {
    this.procesandoPago = true;
    this.progressPercentage = 50;
    this.loadingMessage = '💾 Guardando venta...';

    // Preparar el request de venta para el backend
    const ventaRequest: VentaRequest = {
      clienteId: this.clienteSeleccionado?.id || 0,
      usuarioId: 1, // TODO: obtener del AuthService
      tipoComprobante: this.nuevaVenta.tipoComprobante,
      serieComprobante: this.nuevaVenta.serieComprobante,
      observaciones: this.nuevaVenta.observaciones,
      detalles: this.carrito.map(item => ({
        inventarioId: item.inventarioId,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        subtotal: item.subtotal
      }))
    };

    // Guardar datos actuales para uso posterior
    const carritoActual = [...this.carrito];
    const totalActual = this.totalVenta;
    const subtotalActual = this.subtotalVenta;
    const descuentoActual = this.descuentoVenta;
    const tipoAnterior = this.nuevaVenta.tipoComprobante;
    const serieAnterior = this.nuevaVenta.serieComprobante;

    // Guardar la venta en el backend
    this.ventasService.registrarVenta(ventaRequest).subscribe({
      next: (ventaGuardada: VentaResponse) => {
        console.log('✅ Venta guardada exitosamente:', ventaGuardada);
        
        this.progressPercentage = 100;
        this.procesandoPago = false;

        // ✨ ASIGNAR LA VENTA AL DIÁLOGO DE COMPROBANTE
        this.ventaParaComprobante = ventaGuardada;
        
        // 🎉 ABRIR EL DIÁLOGO DE COMPROBANTE
        this.comprobanteDialog = true;

        // Limpiar el carrito
        this.carrito = [];
        this.clienteSeleccionado = null;
        this.aplicarDescuento = false;
        this.porcentajeDescuento = 0;
        
        // Generar nuevo número de venta para la siguiente transacción
        this.generarNumeroVenta();
        
        // Mantener el tipo de comprobante seleccionado para la próxima venta
        this.nuevaVenta = {
          clienteId: 0,
          usuarioId: 1,
          tipoComprobante: tipoAnterior || 'BOLETA',
          serieComprobante: serieAnterior || 'B001',
          observaciones: '',
          detalles: []
        };
        
        this.calcularTotales();

        this.toastService.success(
          '✅ Venta Completada',
          `Venta #${ventaGuardada.id} procesada exitosamente`,
          { duration: 5000 }
        );

        // Actualizar inventarios después de completar la venta
        this.actualizarInventariosDespuesDeVenta();
        
        this.cdr.markForCheck();
      },
      error: (error: any) => {
        console.error('❌ Error guardando venta:', error);
        this.procesandoPago = false;
        this.progressPercentage = 0;
        
        this.toastService.error(
          '❌ Error',
          'No se pudo guardar la venta. Por favor intente nuevamente.',
          { duration: 5000 }
        );

        // Restaurar el carrito en caso de error
        this.carrito = carritoActual;
        this.totalVenta = totalActual;
        this.subtotalVenta = subtotalActual;
        this.descuentoVenta = descuentoActual;
        
        this.cdr.markForCheck();
      }
    });
  }
  
  /**
   * Actualiza los inventarios después de completar una venta
   */
  private actualizarInventariosDespuesDeVenta(): void {
    // 🔄 ACTUALIZACIÓN COMPLETA DEL INVENTARIO POST-VENTA
    this.forzarActualizacionInventario();
    
    // Notificar al usuario sobre la actualización
    this.toastService.info(
      '🔄 Actualizando Stock',
      'Sincronizando cantidades después de la venta...',
      { duration: 2000 }
    );
    
    // 📊 ACTUALIZACIÓN ESCALONADA PARA MEJOR SINCRONIZACIÓN
    // Actualización inmediata
    setTimeout(() => {
      this.actualizarCantidadesEnTiempoReal();
    }, 500);
    
    // Actualización de refuerzo después de 2 segundos
    setTimeout(() => {
      this.actualizarCantidadesEnTiempoReal();
      this.toastService.success(
        '✅ Stock Actualizado',
        'Las cantidades han sido sincronizadas correctamente',
        { duration: 1500 }
      );
    }, 2000);
    
    // Actualización final después de 5 segundos para asegurar consistencia
    setTimeout(() => {
      this.forzarActualizacionInventario();
    }, 5000);
  }

  onComprobanteChange() {
    // Actualizar series según el tipo de comprobante
    switch (this.nuevaVenta.tipoComprobante) {
      case 'FACTURA':
        this.nuevaVenta.serieComprobante = 'F001';
        break;
      case 'BOLETA':
        this.nuevaVenta.serieComprobante = 'B001';
        break;
      case 'NOTA_VENTA':
        this.nuevaVenta.serieComprobante = 'N001';
        break;
      case 'TICKET':
        this.nuevaVenta.serieComprobante = 'T001';
        break;
      default:
        this.nuevaVenta.serieComprobante = '';
    }
    this.cdr.markForCheck();
  }

  // ✅ MÉTODOS AUXILIARES
   formatearMoneda(monto: string | number): string {
  const valor = typeof monto === 'string' ? parseFloat(monto) : monto;
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN'
  }).format(valor);
}

  /**
   * Genera un nuevo número de venta (se ejecuta solo una vez)
   */
  private generarNumeroVenta(): void {
    const fecha = new Date();
    const año = fecha.getFullYear().toString().slice(-2);
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const dia = fecha.getDate().toString().padStart(2, '0');
    const numero = Math.floor(Math.random() * 9999) + 1;
    this.numeroVentaActual = `${año}${mes}${dia}-${numero.toString().padStart(4, '0')}`;
  }

  /**
   * Retorna el número de venta actual (ya generado)
   */
  getNumeroVenta(): string {
    return this.numeroVentaActual || 'Cargando...';
  }

  getCurrentDateTime(): string {
    return new Date().toLocaleString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  getCurrentTime(): string {
    return new Date().toLocaleString('es-PE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getImageUrl(imagen?: string): string {
    return imagen || '/assets/images/product-placeholder.jpg';
  }

  getStockClass(cantidad: number): string {
    if (cantidad <= 5) return 'text-red-600 font-bold';
    if (cantidad <= 10) return 'text-yellow-600 font-medium';
    return 'text-green-600 font-medium';
  }



  cerrarModales() {
    this.showClientModal = false;
    this.cerrarScanner();
    this.cdr.markForCheck();
  }

  abrirReportes() {
    console.log('Abrir reportes');
  }

  abrirConfiguracion() {
    console.log('Abrir configuración');
  }

  // ==================== ACCESO RÁPIDO TICKETERA ====================

  /**
   * Acceso rápido para configurar ticketera
   */
  configurarTicketeraRapido(): void {
    console.log('🎫 Configuración rápida de ticketera');
    this.mostrarOpcionesConfiguracion();
  }

  /**
   * Acceso rápido para ticket de prueba
   */
  ticketPruebaRapido(): void {
    console.log('🧪 Ticket de prueba rápido');
    this.imprimirTicketPrueba();
  }

  /**
   * Acceso rápido para abrir cajón
   */
  abrirCajonRapido(): void {
    console.log('💰 Apertura rápida de cajón');
    this.abrirCajonDinero();
  }

  /**
   * Acceso rápido para verificar ticketera
   */
  verificarTicketeraRapido(): void {
    console.log('📡 Verificación rápida de ticketera');
    this.verificarConexionTicketera();
  }

  cerrarSesion() {
    // Emitimos el evento al componente padre para que maneje el cierre de caja
    this.cerrarCajaEvent.emit();
  }


  private calcularPorcentajeCambio(valorActual: number, valorAnterior: number): number {
    if (valorAnterior === 0) return valorActual > 0 ? 100 : 0;
    return Math.abs(((valorActual - valorAnterior) / valorAnterior) * 100);
  }

  // MÉTODOS DE CARGA DE DATOS
  private cargarProductosPopulares() {
    // Cargar productos reales del inventario con stock disponible
    this.inventarioService.obtenerInventarios(0, 20, 'cantidad', 'desc', {
      soloStockCritico: false,
      soloAgotados: false
    }).subscribe({
      next: (response) => {
        // Transformar los datos del inventario al formato esperado
        this.productosPopulares = response.contenido
          .filter(inv => inv.cantidad > 0) // Solo productos con stock
          .map(inv => {
            // Extraer precio usando método centralizado
            const precioFinal = this.extraerPrecioInventario(inv);
            
            const item: InventarioPOS = {
              id: inv.id || 0,
              serie: inv.serie || '',
              producto: inv.producto,
              color: inv.color,
              talla: inv.talla,
              almacen: inv.almacen,
              cantidad: inv.cantidad,
              estado: inv.estado,
              fechaCreacion: inv.fechaCreacion,
              fechaActualizacion: inv.fechaActualizacion,
              codigoCompleto: `${inv.producto?.codigo || ''}-${inv.color?.nombre?.substring(0, 2).toUpperCase() || 'SC'}-${inv.talla?.numero || ''}`,
              stock: inv.cantidad,
              precioUnitario: precioFinal,
              subtotal: 0
            };
            
            return item;
          })
          .slice(0, 15); // Limitar a 15 productos populares
        
        // Notificación de éxito solo al refrescar manualmente
        if (window.location.hash.includes('refresh')) {
          this.toastService.success(
            '✅ Inventarios Actualizados',
            `${this.productosPopulares.length} productos disponibles`,
            { duration: 3000 }
          );
        }
        
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('❌ Error al cargar productos populares:', error);
        this.toastService.error(
          '❌ Error de Carga',
          'No se pudieron cargar los productos populares. Usando datos de respaldo.',
          { duration: 5000 }
        );
        // En caso de error, usar datos mock como fallback
        // this.cargarProductosPopularesFallback();
      }
    });
  }

  // private cargarProductosPopularesFallback() {
  //   // Datos de fallback en caso de error con el servicio
  //   this.productosPopulares = [
  //     {
  //       id: 1,
  //       producto: {
  //         id: 1,
  //         codigo: 'ZAP-NIK-U5V',
  //         nombre: 'Zapatos Vestir',
  //         descripcion: 'Zapatos de vestir elegantes',
  //         imagen: '',
  //         precioVenta: 89.90
  //       },
  //       color: { id: 1, nombre: 'Verde', codigo: 'VE' },
  //       talla: { id: 1, numero: '36' },
  //       serie: 'ZAP-NIK-U5V-VE-36',
  //       cantidad: 50,
  //       codigoCompleto: 'ZAP-NIK-U5V-VE-36',
  //       stock: 50,
  //       precioUnitario: 89.90,
  //       subtotal: 0
  //     },
  //     {
  //       id: 2,
  //       producto: {
  //         id: 2,
  //         codigo: 'BOT-CON-GR6',
  //         nombre: 'Botas de Vestir',
  //         descripcion: 'Botas de vestir para ocasiones especiales',
  //         imagen: '',
  //         precio: 125.50
  //       },
  //       color: { id: 2, nombre: 'Rosa', codigo: 'RO' },
  //       talla: { id: 2, numero: '3XL' },
  //       serie: 'BOT-CON-GR6-RO-3XL',
  //       cantidad: 11,
  //       codigoCompleto: 'BOT-CON-GR6-RO-3XL',
  //       stock: 11,
  //       precioUnitario: 125.50,
  //       subtotal: 0
  //     },
  //     {
  //       id: 3,
  //       producto: {
  //         id: 3,
  //         codigo: 'BOT-CON-GR6',
  //         nombre: 'Botas de Vestir',
  //         descripcion: 'Botas de vestir para ocasiones especiales',
  //         imagen: '',
  //         precio: 125.50
  //       },
  //       color: { id: 3, nombre: 'Negro', codigo: 'NE' },
  //       talla: { id: 3, numero: '40' },
  //       serie: 'BOT-CON-GR6-NE-40',
  //       cantidad: 5,
  //       codigoCompleto: 'BOT-CON-GR6-NE-40',
  //       stock: 5,
  //       precioUnitario: 125.50,
  //       subtotal: 0
  //     },
  //     {
  //       id: 4,
  //       producto: {
  //         id: 4,
  //         codigo: 'ZAP-NIK-U5V',
  //         nombre: 'Zapatos Vestir',
  //         descripcion: 'Zapatos de vestir elegantes',
  //         imagen: '',
  //         precio: 89.90
  //       },
  //       color: { id: 4, nombre: 'Rojo', codigo: 'RO' },
  //       talla: { id: 4, numero: '32' },
  //       serie: 'ZAP-NIK-U5V-RO-32',
  //       cantidad: 3,
  //       codigoCompleto: 'ZAP-NIK-U5V-RO-32',
  //       stock: 3,
  //       precioUnitario: 89.90,
  //       subtotal: 0
  //     }
  //   ];
  //   this.cdr.markForCheck();
  // }

  cerrarComprobante(): void {
    this.comprobanteDialog = false;
    this.ventaParaComprobante = null;
    
    // 🔄 Preparar para siguiente venta automáticamente
    setTimeout(() => {
      this.limpiarFormularioVenta();
      this.cdr.markForCheck();
    }, 300);
  }
  
  
  descargarComprobantePDF(venta: VentaResponse): void {
    if (!venta?.id) {
      this.toastService.error('❌ Error', 'No se puede descargar el comprobante: Venta inválida');
      return;
    }

    const nombreArchivo = `comprobante-${venta.numeroVenta}.pdf`;
    console.log('🔽 Iniciando descarga PDF para venta:', venta.id, 'Archivo:', nombreArchivo);
    
    // Mostrar notificación de inicio
    this.toastService.info('⏳ Descargando', `Generando archivo PDF: ${nombreArchivo}`, { duration: 2000 });

    // Primero obtener el comprobante asociado a la venta
    this.comprobantesService.obtenerComprobantePorVenta(venta.id).subscribe({
      next: (comprobante) => {
        console.log('✅ Comprobante encontrado:', comprobante);
        
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
              
              console.log('✅ PDF descargado exitosamente:', nombreArchivo);
              
            } catch (error) {
              console.error('❌ Error procesando descarga:', error);
              this.toastService.error(
                '❌ Error de Descarga',
                'Hubo un problema al procesar el archivo descargado',
                { duration: 4000 }
              );
            }
          },
          error: (error) => {
            console.error('❌ Error descargando PDF:', error);
            this.toastService.error(
              '❌ Error de Descarga',
              `No se pudo descargar el PDF: ${error.message || 'Error desconocido'}`,
              { duration: 4000 }
            );
          }
        });
      },
      error: (error) => {
        console.error('❌ Error obteniendo comprobante:', error);
        console.log('🔍 Status del error:', error.status);
        console.log('🔍 Mensaje del error:', error.message);
        
        // Si no existe el comprobante (404), intentar generarlo automáticamente
        const esComprobanteFaltante = error.status === 404 || 
                                     error.message?.toLowerCase().includes('no encontrado') || 
                                     error.message?.toLowerCase().includes('not found') ||
                                     error.message?.includes('404');
        
        if (esComprobanteFaltante) {
          console.log('🔄 Comprobante no existe (404), intentando generar automáticamente...');
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
    console.log('🔄 Generando comprobante automático para venta:', venta.id);
    
    const comprobanteRequest = {
      ventaId: venta.id,
      tipoDocumento: 'BOLETA' as const, // Por defecto BOLETA, puedes ajustar según tu lógica
      serie: 'B001', // Serie por defecto, ajustar según tu configuración
      observaciones: `Comprobante generado automáticamente para descarga PDF`
    };

    this.comprobantesService.generarComprobante(comprobanteRequest).subscribe({
      next: (comprobante) => {
        console.log('✅ Comprobante generado automáticamente:', comprobante);
        
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
              console.error('❌ Error procesando descarga:', error);
              this.toastService.error('❌ Error de Descarga', 'Error al procesar el archivo');
            }
          },
          error: (error) => {
            console.error('❌ Error descargando PDF generado:', error);
            this.toastService.error('❌ Error de Descarga', 'No se pudo descargar el PDF generado');
          }
        });
      },
      error: (error) => {
        console.error('❌ Error generando comprobante automático:', error);
        this.toastService.error(
          '❌ Error de Generación',
          `No se pudo generar el comprobante: ${error.message || 'Error desconocido'}`,
          { duration: 4000 }
        );
      }
    });
  }
  
// Funciones de acciones rápidas
nuevaVentaRapida(): void {
  // 🔒 PROTECCIÓN CONTRA MÚLTIPLES CLICS
  if (this.nuevaVentaEnProceso) {
    console.log('⚠️ Nueva venta ya en proceso, ignorando clic adicional');
    return;
  }
  
  this.nuevaVentaEnProceso = true;
  console.log('🛒 Iniciando nueva venta (única ejecución)...');
  
  try {
    // 🧹 LIMPIAR COMPLETAMENTE EL POS PARA NUEVA VENTA
    
    // Cerrar el diálogo de comprobante si está abierto
    this.comprobanteDialog = false;
    this.ventaParaComprobante = null;
    
    // Resetear todos los estados del POS
    this.activeTabIndex = 1;
    this.procesandoPago = false;
    this.procesandoVenta = false;
    this.progressPercentage = 0;
    this.loadingMessage = '';
    
    // Limpiar formulario y datos de venta
    this.limpiarFormularioVenta();
    
    // Limpiar datos de descuento
    this.aplicarDescuento = false;
    this.porcentajeDescuento = 0;
    this.esVentaCredito = false;
    this.cuotasCredito = 1;
    
    // Limpiar búsquedas y productos
    this.productoBusqueda = null;
    this.productosAutoComplete = [];
    this.limpiarCacheBusqueda();
    
    // 🔄 Forzar actualización del inventario para empezar fresco
    this.forzarActualizacionInventario();
    
    // Notificación de éxito
    this.toastService.success(
      '✅ Nueva Venta Iniciada',
      'POS limpio y listo para procesar una nueva venta',
      { 
        duration: 2000,
        icon: 'pi pi-plus-circle'
      }
    );
    
    // Enfocar en el campo de búsqueda de productos
    setTimeout(() => {
      this.codigoInput?.nativeElement?.focus();
    }, 200);
    
    // Actualizar la interfaz
    this.cdr.markForCheck();
    
    console.log('✅ Nueva venta iniciada correctamente');
    
  } catch (error) {
    console.error('❌ Error al iniciar nueva venta:', error);
    this.toastService.error(
      '❌ Error',
      'Hubo un problema al iniciar la nueva venta',
      { duration: 3000 }
    );
  } finally {
    // 🔓 LIBERAR EL LOCK DESPUÉS DE UN TIEMPO
    setTimeout(() => {
      this.nuevaVentaEnProceso = false;
      console.log('🔓 Nueva venta lista para siguiente ejecución');
    }, 1000);
  }
}
  // Vista activa
  activeTabIndex = 0;  

  private limpiarFormularioVenta(): void {
    // 🧹 LIMPIEZA COMPLETA DEL FORMULARIO DE VENTA
    
    // Resetear venta principal
    this.nuevaVenta = this.initNuevaVenta();
    this.clienteSeleccionado = null;
    this.carrito = [];
    
    // Recalcular totales
    this.calcularTotales();
    
    // Resetear estados de interfaz
    this.codigoBusqueda = '';
    this.cantidadInput = 1;
    
    // Limpiar datos de cliente
    this.loadingClient = false;
    
    // Resetear productos de búsqueda
    this.productoBusqueda = null;
    
    // Limpiar estados de loading
    this.searchingProducts = false;
    this.addingToCart = false;
    this.savingData = false;
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

  private cargarClientesRecientes() {
    // Cargar los 2 clientes más recientes desde el backend
    this.clienteService.listarActivos().subscribe({
      next: (clientes) => {
        // Ordenar por fecha de creación y tomar los 2 más recientes
        this.clientesRecientes = clientes
          .sort((a: any, b: any) => {
            const fechaA = new Date(a.fechaCreacion || a.createdAt || 0).getTime();
            const fechaB = new Date(b.fechaCreacion || b.createdAt || 0).getTime();
            return fechaB - fechaA; // Más reciente primero
          })
          .slice(0, 2); // Solo los 2 primeros
        
        console.log('✅ Clientes recientes cargados:', this.clientesRecientes.length);
      },
      error: (error) => {
        console.error('❌ Error al cargar clientes recientes:', error);
        this.toastService.error('Error', 'No se pudieron cargar los clientes recientes');
        this.clientesRecientes = []; // Array vacío en caso de error
      }
    });
  }

  private cargarClientesFiltrados() {
    this.clientesFiltrados = [
      ...this.clientesRecientes,
      {
        id: 3,
        nombres: 'Carlos Alberto',
        apellidos: 'Mendoza Torres',
        ruc: '20123456789',
        email: 'carlos.mendoza@empresa.com',
        telefono: '987789123',
        compras: 8,
        totalCompras: 2100.00,
        ultimaCompra: '2025-07-09'
      }
    ];
  }

  private mostrarInfo(summary: string, detail: string): void {
    this.messageService.add({ 
      severity: 'info', 
      summary, 
      detail,
      life: 4000
    });
  }

  private mostrarExito(summary: string, detail: string): void {
    this.messageService.add({ 
      severity: 'success', 
      summary, 
      detail,
      life: 3000
    });
  }
  
  
  private simularBusquedaPorCodigo(codigo: string): InventarioPOS | null {
    // Simular búsqueda en base de datos
    const producto = this.productosPopulares.find(p => 
      p.producto?.codigo === codigo || p.codigoCompleto === codigo
    );
    return producto || null;
  }

  private simularBusquedaAvanzada(query: string): InventarioPOS[] {
    if (!query || query.length < 2) return [];
    
    return this.productosPopulares.map(p => ({
      ...p,
      displayLabel: `${p.producto?.codigo || ''} - ${p.producto?.nombre || ''} (${p.color?.nombre || ''}, ${p.talla?.numero || ''})`
    })).filter(p => 
      p.displayLabel.toLowerCase().includes(query.toLowerCase())
    );
  }

  private simularBusquedaClientes(query: string): Cliente[] {
    if (!query || query.length < 2) return this.clientesFiltrados;
    
    return this.clientesFiltrados.filter(c => 
      c.nombres.toLowerCase().includes(query.toLowerCase()) ||
      c.apellidos.toLowerCase().includes(query.toLowerCase()) ||
      (c.dni && c.dni.includes(query)) ||
      (c.ruc && c.ruc.includes(query)) ||
      (c.email && c.email.toLowerCase().includes(query.toLowerCase()))
    );
  }

  productoPreview: any = null;

  // Métodos para manejar el preview
  mostrarPreview(producto: any) {
    this.productoPreview = producto;
  }

  cerrarPreview() {
    this.productoPreview = null;
  }

  agregarProductoAlCarrito(producto: any) {
    // Tu lógica existente para agregar al carrito
    this.cerrarPreview(); // Cerrar preview después de agregar
  }

  // === MÉTODOS PARA CARRITO MÓVIL ===
  
  /**
   * Abre el modal del carrito en dispositivos móviles
   */
  toggleMobileCart(): void {
    this.showMobileCart = !this.showMobileCart;
  }

  /**
   * Cierra el modal del carrito móvil
   */
  closeMobileCart(): void {
    this.showMobileCart = false;
  }

  /**
   * Calcula el total del carrito
   */
  calcularTotalCarrito(): number {
    return this.carrito.reduce((total, item) => {
      return total + (item.precioUnitario * item.cantidad);
    }, 0);
  }

  /**
   * Incrementa la cantidad de un item en el carrito
   */
  incrementarCantidadItem(item: ItemCarrito): void {
    if (!item.cantidad) {
      item.cantidad = 1;
    }
    
    if (item.cantidad < item.cantidad) {
      item.cantidad++;
      item.subtotal = item.cantidad * item.precioUnitario;
      this.calcularSubtotal();
    }
  }

  /**
   * Decrementa la cantidad de un item en el carrito
   */
  decrementarCantidadItem(item: ItemCarrito): void {
    if (!item.cantidad) {
      item.cantidad = 1;
    }
    
    if (item.cantidad > 1) {
      item.cantidad--;
      item.subtotal = item.cantidad * item.precioUnitario;
      this.calcularSubtotal();
    }
  }

  /**
   * Muestra una notificación toast cuando se agrega un producto
   */
  showProductAddedToast(producto: Producto): void {
    this.lastAddedProduct = producto;
    
    // Auto-ocultar después de 3 segundos
    setTimeout(() => {
      this.lastAddedProduct = null;
    }, 3000);
  }

  /**
   * Calcula el subtotal de la venta
   */
  calcularSubtotal(): number {
    this.subtotalVenta = this.carrito.reduce((sum, item) => {
      const cantidad = item.cantidad;
      return sum + (item.precioUnitario * cantidad);
    }, 0);
    return this.subtotalVenta;
  }

  /**
   * Calcula el total de la venta incluyendo descuentos
   */
  calcularTotal(): number {
    const subtotal = this.calcularSubtotal();
    return subtotal - this.descuentoVenta;
  }

  /**
   * Abre el modal para aplicar descuentos
   */
  abrirModalDescuento(): void {
    // Implementar lógica del modal de descuento
    // Por ahora, alternar el estado del descuento
    this.aplicarDescuento = !this.aplicarDescuento;
    if (this.aplicarDescuento && this.porcentajeDescuento === 0) {
      this.porcentajeDescuento = 5; // Descuento por defecto del 5%
    }
    this.calcularDescuento();
  }

  /**
   * Procesa la venta desde el carrito móvil
   */
  procesarVentaDesdeCarrito(): void {
    if (this.carrito.length === 0) return;
    
    this.procesandoVenta = true;
    
    // Simular procesamiento de venta
    setTimeout(() => {
      // Aquí iría la lógica real de procesamiento
      console.log('Procesando venta...', this.carrito);
      
      // Simular éxito y limpiar carrito
      this.carrito = [];
      this.procesandoVenta = false;
      this.calcularSubtotal();
      
      // Mostrar mensaje de éxito
      this.toastService.success(
        '✅ Venta Completada',
        'La venta se procesó exitosamente',
        { duration: 3000, icon: 'pi pi-check-circle' }
      );
    }, 2000);
  }

  // ==================== CONFIGURACIÓN TICKETERA ====================

  /**
   * Muestra opciones de configuración de ticketera
   */
  private mostrarOpcionesConfiguracion(): void {
    this.confirmationService.confirm({
      header: '⚙️ Configuración Ticketera',
      message: '¿Qué desea hacer?',
      icon: 'pi pi-cog',
      acceptLabel: '🧪 Ticket Prueba',
      rejectLabel: '🔧 Configurar Puerto',
      acceptButtonStyleClass: 'p-button-info p-button-sm',
      rejectButtonStyleClass: 'p-button-warning p-button-sm',
      accept: () => {
        this.imprimirTicketPrueba();
      },
      reject: () => {
        this.mostrarConfiguracionPuerto();
      }
    });
  }



  /**
   * Ofrece abrir el cajón de dinero
   */
  private ofrecerAbrirCajon(): void {
    setTimeout(() => {
      this.confirmationService.confirm({
        header: '💰 Cajón de Dinero',
        message: '¿Desea abrir el cajón de dinero?',
        icon: 'pi pi-dollar',
        acceptLabel: 'Sí, Abrir',
        rejectLabel: 'No',
        acceptButtonStyleClass: 'p-button-success p-button-sm',
        rejectButtonStyleClass: 'p-button-secondary p-button-sm',
        accept: () => {
          this.abrirCajonDinero();
        }
      });
    }, 1000);
  }

  /**
   * Abre el cajón de dinero
   */
  private abrirCajonDinero(): void {
    this.comprobantesService.abrirCajon().subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('💰 Cajón Abierto', response.message, { duration: 2000 });
        } else {
          this.toastService.warning('⚠️ Aviso', response.message, { duration: 3000 });
        }
      },
      error: (error) => {
        console.error('❌ Error abriendo cajón:', error);
        this.toastService.error('❌ Error', 'No se pudo abrir el cajón', { duration: 3000 });
      }
    });
  }

  /**
   * Muestra configuración de puerto
   */
  private mostrarConfiguracionPuerto(): void {
    // Primero obtener puertos disponibles
    this.comprobantesService.obtenerPuertosDisponibles().subscribe({
      next: (response) => {
        if (response.success && response.puertos?.length > 0) {
          this.mostrarSeleccionPuerto(response.puertos);
        } else {
          this.toastService.warning('⚠️ Sin Puertos', 'No se encontraron puertos disponibles', { duration: 3000 });
        }
      },
      error: (error) => {
        console.error('❌ Error obteniendo puertos:', error);
        this.toastService.error('❌ Error', 'No se pudieron obtener los puertos disponibles', { duration: 4000 });
      }
    });
  }

  /**
   * Muestra selección de puerto disponible
   */
  private mostrarSeleccionPuerto(puertos: string[]): void {
    // Por simplicidad, usar el primer puerto disponible
    // En un entorno real, podrías mostrar un diálogo para seleccionar
    const puertoSeleccionado = puertos[0];
    
    this.confirmationService.confirm({
      header: '🔌 Configurar Puerto',
      message: `¿Configurar ticketera en puerto ${puertoSeleccionado}?<br><br>Puertos disponibles: ${puertos.join(', ')}`,
      icon: 'pi pi-cog',
      acceptLabel: 'Configurar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-primary p-button-sm',
      rejectButtonStyleClass: 'p-button-secondary p-button-sm',
      accept: () => {
        this.configurarPuerto(puertoSeleccionado);
      }
    });
  }

  /**
   * Configura el puerto de la ticketera
   */
  private configurarPuerto(puerto: string): void {
    this.toastService.info('🔧 Configurando', `Configurando ticketera en puerto ${puerto}...`, { duration: 2000 });
    
    this.comprobantesService.configurarPuertoTicketera(puerto).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('✅ Puerto Configurado', response.message, { duration: 3000 });
          
          // Verificar conexión después de configurar
          setTimeout(() => {
            this.verificarConexionTicketera();
          }, 1000);
        } else {
          this.toastService.error('❌ Error Configuración', response.message, { duration: 4000 });
        }
      },
      error: (error) => {
        console.error('❌ Error configurando puerto:', error);
        this.toastService.error('❌ Error', 'No se pudo configurar el puerto', { duration: 4000 });
      }
    });
  }



  // ========================================
  // MÉTODOS PARA PANEL DE PRUEBAS TICKETERA
  // ========================================

  /**
   * Muestra el panel de pruebas de ticketera
   */
  mostrarPanelPruebas(): void {
    this.panelPruebasVisible = true;
    this.agregarLogPrueba('info', 'Panel de pruebas abierto');
    
    // Verificar conexión automáticamente al abrir
    setTimeout(() => {
      this.verificarConexionTicketera();
    }, 500);
  }

  /**
   * Cierra el panel de pruebas
   */
  cerrarPanelPruebas(): void {
    this.panelPruebasVisible = false;
    this.agregarLogPrueba('info', 'Panel de pruebas cerrado');
  }

  /**
   * Verifica la conexión con la ticketera (para el panel de pruebas)
   */
  verificarConexionTicketera(): void {
    if (this.verificandoConexion) return;
    
    this.verificandoConexion = true;
    this.agregarLogPrueba('info', 'Verificando conexión con ticketera...');
    
    this.comprobantesService.verificarConexionTicketera().subscribe({
      next: (response) => {
        this.verificandoConexion = false;
        
        if (response.success) {
          this.estadoConexion = {
            conectada: true,
            puerto: response.data?.puerto || 'Detectado',
            estado: 'Conectada'
          };
          this.agregarLogPrueba('success', `✅ Ticketera conectada en puerto: ${this.estadoConexion.puerto}`);
        } else {
          this.estadoConexion = {
            conectada: false,
            puerto: '',
            estado: 'Desconectada'
          };
          this.agregarLogPrueba('warning', `⚠️ Ticketera desconectada: ${response.message}`);
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.verificandoConexion = false;
        this.estadoConexion = {
          conectada: false,
          puerto: '',
          estado: 'Error'
        };
        console.error('❌ Error verificando conexión:', error);
        this.agregarLogPrueba('error', `❌ Error verificando conexión: ${error.message || 'Error desconocido'}`);
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Imprime un ticket de prueba básico
   */
  imprimirTicketPrueba(): void {
    this.agregarLogPrueba('info', 'Enviando ticket de prueba...');
    
    this.comprobantesService.imprimirTicketPrueba().subscribe({
      next: (response) => {
        if (response.success) {
          this.agregarLogPrueba('success', '✅ Ticket de prueba enviado correctamente');
          this.toastService.success('🖨️ Ticket Enviado', 'Ticket de prueba impreso correctamente');
        } else {
          this.agregarLogPrueba('warning', `⚠️ Problema con ticket de prueba: ${response.message}`);
          this.toastService.warning('⚠️ Advertencia', response.message);
        }
      },
      error: (error) => {
        console.error('❌ Error imprimiendo ticket de prueba:', error);
        this.agregarLogPrueba('error', `❌ Error imprimiendo ticket: ${error.message || 'Error desconocido'}`);
        this.toastService.error('❌ Error', 'No se pudo imprimir el ticket de prueba');
      }
    });
  }

  /**
   * Prueba de texto simple
   */
  probarTextoSimple(): void {
    this.agregarLogPrueba('info', 'Enviando texto simple...');
    
    const textoSimple = {
      texto: "PRUEBA DE TEXTO SIMPLE\n\nEsta es una prueba básica\nde impresión de texto.\n\nFecha: " + new Date().toLocaleString() + "\n\n",
      alineacion: "centro"
    };

    // Por ahora usamos el ticket de prueba como alternativa
    this.comprobantesService.imprimirTicketPrueba().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.agregarLogPrueba('success', '✅ Texto simple enviado correctamente');
          this.toastService.success('📝 Texto Enviado', 'Texto simple impreso correctamente');
        } else {
          this.agregarLogPrueba('warning', `⚠️ Problema con texto simple: ${response.message}`);
          this.toastService.warning('⚠️ Advertencia', response.message);
        }
      },
      error: (error: any) => {
        console.error('❌ Error imprimiendo texto simple:', error);
        this.agregarLogPrueba('error', `❌ Error imprimiendo texto: ${error.message || 'Error desconocido'}`);
        this.toastService.error('❌ Error', 'No se pudo imprimir el texto simple');
      }
    });
  }

  /**
   * Prueba de diferentes formatos de texto
   */
  probarFormatos(): void {
    this.agregarLogPrueba('info', 'Enviando prueba de formatos...');
    
    const formatosTexto = {
      texto: "=== PRUEBA DE FORMATOS ===\n\nTexto Normal\n**Texto en Negrita**\n\nTexto Centrado\n\nTexto Grande\n\nTexto Subrayado\n\n" + "=".repeat(30) + "\n\n",
      incluirFormatos: true
    };

    // Por ahora usamos el ticket de prueba como alternativa
    this.comprobantesService.imprimirTicketPrueba().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.agregarLogPrueba('success', '✅ Formatos enviados correctamente');
          this.toastService.success('🎨 Formatos Enviados', 'Prueba de formatos impresa correctamente');
        } else {
          this.agregarLogPrueba('warning', `⚠️ Problema con formatos: ${response.message}`);
          this.toastService.warning('⚠️ Advertencia', response.message);
        }
      },
      error: (error: any) => {
        console.error('❌ Error imprimiendo formatos:', error);
        this.agregarLogPrueba('error', `❌ Error imprimiendo formatos: ${error.message || 'Error desconocido'}`);
        this.toastService.error('❌ Error', 'No se pudo imprimir los formatos');
      }
    });
  }

  /**
   * Prueba de corte de papel
   */
  cortarPapelPrueba(): void {
    this.agregarLogPrueba('info', 'Enviando comando de corte...');
    
    this.comprobantesService.cortarPapel().subscribe({
      next: (response) => {
        if (response.success) {
          this.agregarLogPrueba('success', '✅ Comando de corte enviado correctamente');
          this.toastService.success('✂️ Papel Cortado', 'Comando de corte ejecutado correctamente');
        } else {
          this.agregarLogPrueba('warning', `⚠️ Problema cortando papel: ${response.message}`);
          this.toastService.warning('⚠️ Advertencia', response.message);
        }
      },
      error: (error) => {
        console.error('❌ Error cortando papel:', error);
        this.agregarLogPrueba('error', `❌ Error cortando papel: ${error.message || 'Error desconocido'}`);
        this.toastService.error('❌ Error', 'No se pudo cortar el papel');
      }
    });
  }

  /**
   * Prueba de apertura de cajón
   */
  abrirCajonPrueba(): void {
    this.agregarLogPrueba('info', 'Enviando comando para abrir cajón...');
    
    this.comprobantesService.abrirCajon().subscribe({
      next: (response) => {
        if (response.success) {
          this.agregarLogPrueba('success', '✅ Comando de apertura enviado correctamente');
          this.toastService.success('📦 Cajón Abierto', 'Comando de apertura ejecutado correctamente');
        } else {
          this.agregarLogPrueba('warning', `⚠️ Problema abriendo cajón: ${response.message}`);
          this.toastService.warning('⚠️ Advertencia', response.message);
        }
      },
      error: (error) => {
        console.error('❌ Error abriendo cajón:', error);
        this.agregarLogPrueba('error', `❌ Error abriendo cajón: ${error.message || 'Error desconocido'}`);
        this.toastService.error('❌ Error', 'No se pudo abrir el cajón');
      }
    });
  }

  /**
   * Obtiene el estado detallado de la ticketera
   */
  obtenerEstadoTicketera(): void {
    this.agregarLogPrueba('info', 'Obteniendo estado detallado...');
    
    // Usar verificación de conexión como alternativa
    this.comprobantesService.verificarConexionTicketera().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          const estado = response.data;
          this.agregarLogPrueba('success', `✅ Estado obtenido: ${estado.estado || 'Conectada'}`);
          this.agregarLogPrueba('info', `Puerto: ${estado.puerto || 'Detectado automáticamente'}`);
          this.agregarLogPrueba('info', `Conexión: ${response.conectada ? 'Activa' : 'Inactiva'}`);
          
          this.toastService.info('📊 Estado Obtenido', 'Revisa el log para ver los detalles');
        } else {
          this.agregarLogPrueba('warning', `⚠️ No se pudo obtener estado: ${response.message}`);
          this.toastService.warning('⚠️ Advertencia', response.message || 'No se pudo obtener el estado');
        }
      },
      error: (error: any) => {
        console.error('❌ Error obteniendo estado:', error);
        this.agregarLogPrueba('error', `❌ Error obteniendo estado: ${error.message || 'Error desconocido'}`);
        this.toastService.error('❌ Error', 'No se pudo obtener el estado de la ticketera');
      }
    });
  }

  /**
   * Detecta puertos disponibles
   */
  detectarPuertos(): void {
    if (this.detectandoPuertos) return;
    
    this.detectandoPuertos = true;
    this.agregarLogPrueba('info', 'Detectando puertos disponibles...');
    
    this.comprobantesService.obtenerPuertosDisponibles().subscribe({
      next: (response) => {
        this.detectandoPuertos = false;
        
        if (response.success && response.data) {
          this.puertosDisponibles = response.data;
          this.agregarLogPrueba('success', `✅ ${this.puertosDisponibles.length} puertos detectados: ${this.puertosDisponibles.join(', ')}`);
          this.toastService.success('🔍 Puertos Detectados', `Se encontraron ${this.puertosDisponibles.length} puertos`);
        } else {
          this.puertosDisponibles = [];
          this.agregarLogPrueba('warning', '⚠️ No se encontraron puertos disponibles');
          this.toastService.warning('⚠️ Sin Puertos', 'No se encontraron puertos disponibles');
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.detectandoPuertos = false;
        console.error('❌ Error detectando puertos:', error);
        this.agregarLogPrueba('error', `❌ Error detectando puertos: ${error.message || 'Error desconocido'}`);
        this.toastService.error('❌ Error', 'No se pudieron detectar los puertos');
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Configura el puerto seleccionado
   */
  configurarPuertoSeleccionado(): void {
    if (!this.puertoSeleccionado) {
      this.toastService.warning('⚠️ Selecciona Puerto', 'Debes seleccionar un puerto primero');
      return;
    }

    this.agregarLogPrueba('info', `Configurando puerto: ${this.puertoSeleccionado}`);
    
    this.comprobantesService.configurarPuertoTicketera(this.puertoSeleccionado).subscribe({
      next: (response) => {
        if (response.success) {
          this.agregarLogPrueba('success', `✅ Puerto ${this.puertoSeleccionado} configurado correctamente`);
          this.toastService.success('🔧 Puerto Configurado', `Puerto ${this.puertoSeleccionado} configurado`);
          
          // Actualizar estado y verificar conexión
          this.estadoConexion.puerto = this.puertoSeleccionado;
          setTimeout(() => {
            this.verificarConexionTicketera();
          }, 1000);
        } else {
          this.agregarLogPrueba('warning', `⚠️ Error configurando puerto: ${response.message}`);
          this.toastService.warning('⚠️ Error Configuración', response.message);
        }
      },
      error: (error) => {
        console.error('❌ Error configurando puerto:', error);
        this.agregarLogPrueba('error', `❌ Error configurando puerto: ${error.message || 'Error desconocido'}`);
        this.toastService.error('❌ Error', 'No se pudo configurar el puerto');
      }
    });
  }

  /**
   * Imprime la venta actual (si hay carrito)
   */
  imprimirVentaActual(): void {
    if (this.carrito.length === 0) {
      this.toastService.warning('🛒 Carrito Vacío', 'Agrega productos al carrito primero');
      return;
    }

    this.agregarLogPrueba('info', `Imprimiendo venta actual con ${this.carrito.length} productos`);
    this.agregarLogPrueba('warning', '⚠️ Para pruebas reales, primero complete una venta');
    this.agregarLogPrueba('info', '💡 Use "Imprimir Última Venta" para probar con datos reales');
    
    // En lugar de crear datos ficticios, sugerirr usar datos reales
    this.toastService.info('ℹ️ Información', 'Para probar impresión, complete una venta primero y use "Última Venta"');
  }

  /**
   * Crea una venta de prueba con datos ficticios
   */
  crearVentaPrueba(): void {
    this.agregarLogPrueba('info', 'Creando venta de prueba...');
    
    // En lugar de crear ítems complejos, simplemente simular la acción
    this.agregarLogPrueba('success', '✅ Venta de prueba simulada');
    this.agregarLogPrueba('info', '📝 Productos ficticios:');
    this.agregarLogPrueba('info', '  - Producto Test 1: $15.50 x2 = $31.00');
    this.agregarLogPrueba('info', '  - Producto Test 2: $25.00 x1 = $25.00');
    this.agregarLogPrueba('info', '  - Producto Test 3: $8.75 x3 = $26.25');
    this.agregarLogPrueba('info', '💰 Total simulado: $82.25');
    
    this.toastService.success('🛒 Venta Simulada', 'Venta de prueba creada para testing');
    
    this.cdr.markForCheck();
  }

  /**
   * Imprime la última venta real de la base de datos
   */
  imprimirUltimaVenta(): void {
    this.agregarLogPrueba('info', 'Buscando última venta real...');
    
    // Usar el servicio de ventas para obtener la última venta
    this.ventasService.obtenerVentasRecientes(1).subscribe({
      next: (ventas: any[]) => {
        if (ventas && ventas.length > 0) {
          const ultimaVenta = ventas[0];
          this.agregarLogPrueba('success', `✅ Encontrada venta: ${ultimaVenta.numeroVenta}`);
          
          // Ahora intentar imprimirla usando el método estándar
          this.imprimirVentaReal(ultimaVenta);
        } else {
          this.agregarLogPrueba('warning', '⚠️ No se encontraron ventas en la base de datos');
          this.toastService.warning('⚠️ Sin Ventas', 'No hay ventas registradas para imprimir');
        }
      },
      error: (error: any) => {
        console.error('❌ Error obteniendo última venta:', error);
        this.agregarLogPrueba('error', `❌ Error buscando ventas: ${error.message || 'Error desconocido'}`);
        this.toastService.error('❌ Error', 'No se pudo obtener la última venta');
      }
    });
  }

  /**
   * Imprime una venta real usando el sistema estándar
   */
  private imprimirVentaReal(venta: any): void {
    this.agregarLogPrueba('info', `Imprimiendo venta ID: ${venta.id}`);
    
    // Usar el método estándar de impresión
    this.imprimirComprobante(venta);
    
    this.agregarLogPrueba('info', '📋 Usando el método estándar de impresión...');
  }

  /**
   * Agrega una entrada al log de pruebas
   */
  private agregarLogPrueba(tipo: 'info' | 'success' | 'warning' | 'error', mensaje: string): void {
    const timestamp = new Date().toLocaleTimeString();
    this.logPruebas.unshift({ timestamp, tipo, mensaje });
    
    // Mantener solo los últimos 50 logs
    if (this.logPruebas.length > 50) {
      this.logPruebas = this.logPruebas.slice(0, 50);
    }
    
    this.cdr.markForCheck();
  }

  /**
   * Obtiene la clase CSS para el tipo de log
   */
  getLogClass(tipo: 'info' | 'success' | 'warning' | 'error'): string {
    switch (tipo) {
      case 'success': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-blue-400';
    }
  }

  /**
   * Limpia todos los logs de prueba
   */
  limpiarLogs(): void {
    this.logPruebas = [];
    this.toastService.info('🗑️ Logs Limpiados', 'Se limpiaron todos los logs de prueba');
    this.cdr.markForCheck();
  }

  /**
   * Función de tracking para ngFor en los logs
   */
  trackByIndex(index: number, item: any): number {
    return index;
  }

  /**
   * Imprime tanto en ticketera como descarga PDF
   */
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

  /**
   * Genera un comprobante completo para la venta
   */
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

  // ===============================================================
  // MÉTODOS PARA EL DIÁLOGO DE PAGO
  // ===============================================================

  getTotalItems(): number {
    return this.carrito.reduce((total, item) => total + item.cantidad, 0);
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

  calcularVuelto(): void {
    this.vuelto = Math.max(0, this.montoPagado - this.totalVenta);
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

  onPagoDialogHide(): void {
    this.procesandoPago = false;
    this.resetearEstadoPago();
  }

  resetearEstadoPago(): void {
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
  }

  trackByMetodoPago: TrackByFunction<any> = (index: number, metodo: any) => {
    return metodo.value || index;
  }

    procesarVenta(): void {
    if (!this.validarVenta()) return;
    
    // Verificación adicional por si acaso
    if (this.clienteSeleccionado?.id && this.nuevaVenta.clienteId === 0) {
      this.nuevaVenta.clienteId = this.clienteSeleccionado.id;
    }

    this.procesandoPago = true;

    // Verificar stock en tiempo real antes de procesar
    this.verificarStockTiempoReal()
      .then((stockValido) => {
        if (!stockValido) {
          this.procesandoPago = false;
          return;
        }
        
        // Preparar detalles de la venta
        this.nuevaVenta.detalles = this.carrito.map((item) => {
          return {
            inventarioId: item.inventarioId,
            cantidad: item.cantidad
          };
        });

        // Proceder con el registro de la venta
        this.registrarVenta();
      })
      .catch((error) => {
        console.error('❌ Error al verificar stock:', error);
        this.mostrarError('Error de validación', 'No se pudo verificar el stock actual');
        this.procesandoPago = false;
      });
  }

  private registrarVenta(): void {

    this.ventasService.registrarVenta(this.nuevaVenta)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (venta) => {
          // Verificar si la venta realmente se creó
          if (venta.id && venta.numeroVenta) {
            // Procesar pago
            this.pagoActual.ventaId = venta.id;
            
            // Validar datos del pago antes de enviar
            if (!this.validarDatosPago()) {
              this.procesandoPago = false;
              return;
            }
            
            this.procesarPago(venta);
          } else {
            console.error('❌ Venta registrada pero sin datos válidos:', venta);
            this.mostrarError('Error inesperado', 'La venta no se completó correctamente');
            this.procesandoPago = false;
          }
        },
        error: (error) => {
          console.error('❌ Error al registrar venta:', error);
          console.error('❌ Status del error:', error.status);
          console.error('❌ Mensaje del error:', error.error?.message);
          console.error('❌ Error completo:', error);
          
          // Analizar el tipo de error específico
          let errorMessage = 'Error desconocido';
          let shouldReload = false;
          
          if (error.status === 400 && error.error?.message) {
            if (error.error.message.includes('Stock insuficiente')) {
              errorMessage = `⚠️ ${error.error.message}`;
              shouldReload = true; // Recargar para actualizar el stock
              console.warn('🔄 Se recargará el inventario debido a conflicto de stock');
            } else {
              errorMessage = error.error.message;
            }
          } else if (error.status === 409) {
            errorMessage = 'Conflicto de inventario. Verificando estado actual...';
            shouldReload = true;
          } else {
            errorMessage = error.message || 'Error al procesar la venta';
          }
          
          this.mostrarError('Error al procesar venta', errorMessage);
          this.procesandoPago = false;
          
          // Recargar datos si es necesario
          if (shouldReload) {
            setTimeout(() => {
              console.log('🔄 Recargando datos del inventario...');
              this.cargarProductos();
              this.cargarVentas();
            }, 2000);
          }
        }
      });
  }

  private cargarVentas(): void {
    this.loading = true;
    this.ventasService.obtenerTodasLasVentas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.ventas = data;
          // this.aplicarFiltrosVentas();
          this.loading = false;
        },
        error: (error) => {
          this.mostrarError('Error al cargar ventas', error.message);
          this.loading = false;
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


   private async verificarStockTiempoReal(): Promise<boolean> {
    try {
      const verificaciones = this.carrito.map(async (item) => {
        const inventario = await this.inventarioService.obtenerInventarioPorId(item.inventarioId).toPromise();
        
        if (!inventario) {
          console.error(`❌ Inventario no encontrado para ID: ${item.inventarioId}`);
          this.mostrarError('Producto no disponible', `El producto "${item.producto.nombre}" ya no está disponible`);
          return false;
        }
        
        if (inventario.cantidad < item.cantidad) {
          console.error(`❌ Stock insuficiente para ${item.producto.nombre}:`, {
            solicitado: item.cantidad,
            disponible: inventario.cantidad
          });
          this.mostrarError('Stock insuficiente', 
            `El producto "${item.producto.nombre}" solo tiene ${inventario.cantidad} unidades disponibles (solicitado: ${item.cantidad})`);
          
          // Actualizar el stock en el carrito con el valor actual
          item.stock = inventario.cantidad;
          this.cdr.detectChanges();
          
          return false;
        }
        
        // Actualizar stock en el carrito si cambió
        if (item.stock !== inventario.cantidad) {
          item.stock = inventario.cantidad;
          this.cdr.detectChanges();
        }
        
        return true;
      });
      
      const resultados = await Promise.all(verificaciones);
      const todoValido = resultados.every(resultado => resultado);
      
      return todoValido;
    } catch (error) {
      console.error('❌ Error durante verificación de stock:', error);
      return false;
    }
  }

  
  private procesarPago(venta: VentaResponse): void {
    // Verificar si hay discrepancia entre los montos
    if (Math.abs(this.pagoActual.monto - venta.total) > 0.01) {
      // Ajustar el monto del pago al total real de la venta
      this.pagoActual.monto = venta.total;
    }

    this.pagosService.registrarPago(this.pagoActual)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pago) => {
          this.mostrarExito('Venta procesada', `Venta ${venta.numeroVenta} creada exitosamente`);
          
          // Cerrar el diálogo de pago
          this.pagoDialog = false;
          this.procesandoPago = false;
          
          // 🎯 MOSTRAR COMPROBANTE DE LA VENTA COMPLETADA
          this.mostrarComprobanteVentaCompletada(venta);
          
          // Recargar datos
          this.cargarVentas();
        },
        error: (error) => {
          console.error('❌ Error al procesar pago:', error);
          console.error('❌ Status del error:', error.status);
          console.error('❌ Mensaje del error:', error.error?.message);
          console.error('❌ Error completo:', error);
          
          let errorMessage = 'Error desconocido al procesar pago';
          if (error.status === 400 && error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.error && typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          this.mostrarError('Error al procesar pago', errorMessage);
          this.procesandoPago = false;
          
          // Informar que la venta está creada pero el pago falló
          this.mostrarAdvertencia('Venta registrada', 
            `La venta ${venta.numeroVenta} se registró correctamente pero hubo un problema con el pago. Puede procesarlo manualmente.`);
        }
      });
  }

  private validarDatosPago(): boolean {
    if (!this.pagoActual.ventaId || this.pagoActual.ventaId <= 0) {
      this.mostrarError('Error de pago', 'ID de venta inválido');
      console.error('❌ ID de venta inválido:', this.pagoActual.ventaId);
      return false;
    }
    
    if (!this.pagoActual.usuarioId || this.pagoActual.usuarioId <= 0) {
      this.mostrarError('Error de pago', 'ID de usuario inválido');
      console.error('❌ ID de usuario inválido:', this.pagoActual.usuarioId);
      return false;
    }
    
    if (!this.pagoActual.monto || this.pagoActual.monto <= 0) {
      this.mostrarError('Error de pago', 'Monto inválido');
      console.error('❌ Monto inválido:', this.pagoActual.monto);
      return false;
    }
    
    if (!this.pagoActual.metodoPago || this.pagoActual.metodoPago.trim() === '') {
      this.mostrarError('Error de pago', 'Método de pago requerido');
      console.error('❌ Método de pago inválido:', this.pagoActual.metodoPago);
      return false;
    }
    
    // Limpiar campos opcionales que podrían causar problemas si están vacíos
    if (this.pagoActual.numeroReferencia === '') {
      this.pagoActual.numeroReferencia = undefined;
    }
    if (this.pagoActual.nombreTarjeta === '') {
      this.pagoActual.nombreTarjeta = undefined;
    }
    if (this.pagoActual.ultimos4Digitos === '') {
      this.pagoActual.ultimos4Digitos = undefined;
    }
    if (this.pagoActual.observaciones === '') {
      this.pagoActual.observaciones = undefined;
    }
    
    return true;
  }


  
  private mostrarError(titulo: string, mensaje: string): void {
    this.messageService.add({
      severity: 'error',
      summary: titulo,
      detail: mensaje,
      life: 5000
    });
  }

  private mostrarAdvertencia(titulo: string, mensaje: string): void {
    this.messageService.add({
      severity: 'warn',
      summary: titulo,
      detail: mensaje,
      life: 5000
    });
  }

   // ==================== GESTIÓN DE CAJA (ANTIGUA - CÓDIGO LEGACY) ====================
  // NOTA: Estos métodos están obsoletos. Ahora se usa CajaStateService con signals.
  // Se mantienen comentados por compatibilidad temporal.
  
  inicializarEstadoCaja() {
    // Ya no se usa - el estado se maneja en CajaStateService
    console.log('⚠️ inicializarEstadoCaja() obsoleto - usando CajaStateService');
  }

  private guardarEstadoCaja() {
    // Ya no se usa - el estado se guarda automáticamente en CajaStateService
    console.log('⚠️ guardarEstadoCaja() obsoleto - usando CajaStateService');
  }

  cerrarCaja() {
    // Método legacy - ahora se usa abrirDialogoCierreCaja()
    this.confirmationService.confirm({
      message: '¿Está seguro que desea cerrar la caja? Se volverá a la pantalla inicial.',
      header: 'Confirmar Cierre de Caja',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, cerrar',
      rejectLabel: 'Cancelar',
      accept: () => {
        // Usar el nuevo método de cierre de caja
        this.abrirDialogoCierreCaja();
        console.log('💰 Redirigiendo al cierre moderno de caja...');
        // Lógica adicional para cerrar caja (resumen del día, reportes, etc.)
      }
    });
  }

  // ==================== CARGA DE DATOS ====================
  
 private cargarDatosIniciales(): void {
  console.log('🚨 cargarDatosIniciales() ejecutándose...');
  // Método legacy - la carga ahora es diferida desde ngOnInit
  // No hacer nada aquí para evitar carga duplicada
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
  // ✅ Cargar solo 100 productos inicialmente para mejor rendimiento
  this.productoService.getProducts(0, 100)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response: { contenido?: Producto[], content?: Producto[], data?: Producto[] }) => {
        this.productos = response?.contenido || response?.content || response?.data || [];
        console.log('✅ Productos cargados:', this.productos.length);
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
    return producto?.precioVenta || 0;
  }

  private cargarInventarios(): void {
  // ✅ Cargar solo 200 inventarios inicialmente para mejor rendimiento
  this.inventarioService.obtenerInventarios(0, 200)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response: { contenido?: Inventario[], content?: Inventario[], data?: Inventario[] }) => {
        this.inventarios = response?.contenido || response?.content || response?.data || [];
        console.log('✅ Inventarios cargados:', this.inventarios.length);
      },
      error: (error: Error) => this.mostrarError('Error al cargar inventarios', error.message)
    });
}


}


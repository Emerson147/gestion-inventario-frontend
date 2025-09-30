import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef, inject, Output, EventEmitter } from '@angular/core';
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
import { MessageService, ConfirmationService } from 'primeng/api';
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
import { Cliente } from '../../../../../core/models/cliente.model';
import { Producto } from '../../../../../core/models/product.model';
import { Inventario } from '../../../../../core/models/inventario.model';

// Interface extendido para POS que incluye propiedades adicionales
interface InventarioPOS extends Inventario {
  stock: number;
  precioUnitario: number;
  codigoCompleto: string;
  subtotal: number;
  displayLabel?: string;
}

// Agregar interfaz Tendencia
interface Tendencia {
  direccion: 'up' | 'down' | 'neutral';
  porcentaje: number;
  periodo: string;
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
  igv: number;
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
    ToastNotificationComponent
    ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './pos-ventas.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PosVentasComponent implements OnInit, OnDestroy {

  // Inyección de servicios modernos
  public toastService = inject(ToastService);
  private confirmationService = inject(ConfirmationService);
  private authService = inject(AuthService);
  
  // Output para comunicarse con el componente padre
  @Output() procesarPago = new EventEmitter<{
    carrito: ItemCarrito[];
    cliente: Cliente | null;
    totalVenta: number;
    subtotalVenta: number;
    igvVenta: number;
    descuentoVenta: number;
  }>();
  
  @Output() cerrarCajaEvent = new EventEmitter<void>();

  private destroy$ = new Subject<void>();
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('codigoInput') codigoInput!: ElementRef<HTMLInputElement>;

  // Usuario y Sistema
  currentUser = 'Emerson147';
  ventasHoy = 125487;
  transaccionesHoy = 147;
  horaInicioTurno = '08:00';

  // Estados de loading
  procesandoPago = false;
  searchingProducts = false;
  addingToCart = false;
  loadingClient = false;
  connectingScanner = false;
  savingData = false;
  progressPercentage = 0;
  loadingMessage = '';

  // Variables principales
  carrito: ItemCarrito[] = [];
  clienteSeleccionado: Cliente | null = null;
  totalVenta = 0;
  subtotalVenta = 0;
  igvVenta = 0;
  descuentoVenta = 0;

  // Búsqueda y productos
  codigoBusqueda = '';
  cantidadInput = 1;
  productoBusqueda: InventarioPOS | null = null;
  productosAutoComplete: InventarioPOS[] = [];
  productosPopulares: InventarioPOS[] = [];

  // Scanner
  scannerActive = false;
  stream: MediaStream | null = null;

  // Modal de carrito móvil
  showMobileCart = false;
  lastAddedProduct: Producto | null = null;
  procesandoVenta = false;

  showDashboard = false;

  // Venta
  nuevaVenta: VentaRequest = {
    clienteId: 0,
    usuarioId: 1,
    tipoComprobante: 'BOLETA',
    serieComprobante: 'B001',
    observaciones: '',
    detalles: []
  };

  // Descuentos y crédito
  aplicarDescuento = false;
  porcentajeDescuento = 0;
  esVentaCredito = false;
  cuotasCredito = 1;

  metricas: MetricaVenta[] = [
    {
      id: 'ventas-dia',
      titulo: 'Ventas del Día',
      valor: 15420.50,
      categoria: 'ventas',
      color: 'success',
      icono: 'pi-dollar',
      tendencia: {
        direccion: 'up',
        porcentaje: 12.5,
        periodo: 'vs ayer'
      },
      objetivo: {
        valor: 18000,
        progreso: 85.7
      },
      ultimaActualizacion: new Date(),
      loading: false
    },
    {
      id: 'transacciones',
      titulo: 'Transacciones',
      valor: 147,
      categoria: 'operaciones',
      color: 'info',
      icono: 'pi-shopping-cart',
      tendencia: {
        direccion: 'up',
        porcentaje: 8.3,
        periodo: 'vs ayer'
      },
      ultimaActualizacion: new Date(),
      loading: false
    },
    {
      id: 'ticket-promedio',
      titulo: 'Ticket Promedio',
      valor: 104.90,
      categoria: 'ventas',
      color: 'warning',
      icono: 'pi-chart-line',
      tendencia: {
        direccion: 'up',
        porcentaje: 3.2,
        periodo: 'vs ayer'
      },
      ultimaActualizacion: new Date(),
      loading: false
    },
    {
      id: 'stock-critico',
      titulo: 'Stock Crítico',
      valor: 23,
      categoria: 'operaciones',
      color: 'danger',
      icono: 'pi-exclamation-triangle',
      tendencia: {
        direccion: 'up',
        porcentaje: 15.0,
        periodo: 'productos'
      },
      alertaCritica: {
        activa: true,
        mensaje: 'Requiere reposición urgente',
        nivel: 'alta'
      },
      ultimaActualizacion: new Date(),
      loading: false
    }
  ];

    // ==================== COMPROBANTES ====================
  comprobanteDialog = false;
  ventaParaComprobante: VentaResponse | null = null;

  // Modales
  showClientModal = false;
  showKeyboardHelp = false;

  // Cliente modal
  clienteBusqueda: Cliente | null = null;
  clientesFiltrados: Cliente[] = [];
  clientesRecientes: Cliente[] = [];

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

   // Métodos auxiliares
   getIconoTendencia(tendencia: Tendencia): string {
    switch(tendencia.direccion) {
      case 'up': return 'pi-arrow-up';
      case 'down': return 'pi-arrow-down';
      case 'neutral': return 'pi-minus';
      default: return 'pi-minus';
    }
  }
  
  // ==================== PAGO ====================

  pagoDialog = false;
  pagoActual: PagoRequest = this.initPago();
  montoPagado = 0;
  vuelto = 0;
  pagosPendientes: PagoResponse[] = [];

  seriesComprobante = [
    { label: 'B001', value: 'B001' },
    { label: 'F001', value: 'F001' },
    { label: 'N001', value: 'N001' }
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
  private estadisticasService = inject(EstadisticasVentasService);
  private analyticsService = inject(AnalyticsService);
  private http = inject(HttpClient);

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

    // Limpiar todos los cachés
    this.limpiarCacheBusqueda();
    
    // Recargar productos populares (esto también notificará el éxito)
    // this.cargarProductosPopulares();
    
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
    
    // Solo log de warning si no se encuentra precio
    if (precioFinal === 0) {
      console.warn(`⚠️ Precio no encontrado para producto: ${inventario.producto?.nombre || 'Desconocido'}`);
    }
    
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
  

  ngOnInit() {
    this.inicializarComponente();
    this.configurarShortcuts();
  }



  // 🚀 MÉTODO TEMPORAL PARA OBTENER PRECIOS DIRECTAMENTE
  private async obtenerPrecioProducto(productoId: number): Promise<number> {
    try {
      // Consultar directamente el endpoint de productos para obtener los precios
      const producto$ = this.http.get<any>(`http://localhost:8080/api/productos/${productoId}`);
      
      return new Promise((resolve) => {
        producto$.subscribe({
          next: (producto) => {
            const precio = producto.precioVenta || producto.precio_venta || 0;
            resolve(precio);
          },
          error: (error) => {
            console.error(`Error al obtener precio del producto ${productoId}:`, error);
            resolve(0);
          }
        });
      });
    } catch (error) {
      console.error(`Error en obtenerPrecioProducto:`, error);
      return 0;
    }
  }

  // 🔄 MÉTODO PARA ENRIQUECER PRODUCTOS CON PRECIOS
  private enriquecerProductoConPrecio(productoId: number, inventarioId: number): void {
    this.obtenerPrecioProducto(productoId).then(precio => {
      if (precio > 0) {

        
        // Actualizar en productosAutoComplete
        const itemAutoComplete = this.productosAutoComplete.find(p => p.id === inventarioId);
        if (itemAutoComplete && itemAutoComplete.producto) {
          itemAutoComplete.producto.precioVenta = precio;
          itemAutoComplete.precioUnitario = precio;
        }

        // Actualizar en productosPopulares
        const itemPopular = this.productosPopulares.find(p => p.id === inventarioId);
        if (itemPopular && itemPopular.producto) {
          itemPopular.producto.precioVenta = precio;
          itemPopular.precioUnitario = precio;
        }

        // Marcar para cambio de detección
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
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

// Función para imprimir comprobante
imprimirComprobante(venta: VentaResponse): void {
  const nombreArchivo = `comprobante-${venta.numeroVenta}.pdf`;
  this.mostrarInfo('Imprimiendo', `Enviando ${nombreArchivo} a la impresora...`);
}

// Función para enviar por email
enviarComprobantePorEmail(venta: VentaResponse): void {
  const email = (venta.cliente as { email?: string }).email || 'cliente@ejemplo.com';
  this.mostrarInfo('Enviando', `Enviando comprobante a ${email}...`);
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
    
    // Inicializar actualización periódica de métricas del dashboard
    this.inicializarActualizacionPeriodica();
    
    console.log(`🚀 POS iniciado por ${this.currentUser} - ${this.getCurrentDateTime()}`);
  }

  private inicializarActualizacionPeriodica(): void {
    // Actualizar métricas cada 5 minutos
    interval(5 * 60 * 1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.showDashboard) {
          console.log('🔄 Actualizando métricas del dashboard...');
          this.cargarDatosRealesdashboard();
        }
      });
  }

  private configurarShortcuts() {
    document.addEventListener('keydown', (event) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case 'F1':
          event.preventDefault();
          this.showKeyboardHelp = true;
          this.cdr.markForCheck();
          break;
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
      // Si no hay query, obtener productos recientes del servidor
      this.cargarProductosRecientes();
      return;
    }

    this.searchingProducts = true;
    this.loadingMessage = 'Buscando productos...';
    this.cdr.markForCheck();

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
            this.obtenerPrecioProducto(inventario.producto.id).then(precioDirecto => {
              if (precioDirecto > 0 && inventario.producto) {
                // Actualizar el precio y continuar con la adición
                inventario.producto.precioVenta = precioDirecto;
                inventario.precioUnitario = precioDirecto;
                
                // Llamar recursivamente con el precio actualizado
                this.agregarAlCarrito(inventario, cantidad);
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
              }
            });
            
            return; // Salir y esperar la respuesta asíncrona
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
          
          // Limpiar caché de búsqueda para reflejar cambios de stock
          this.limpiarCacheBusqueda();
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
      this.cdr.markForCheck();
    }
  }

  limpiarCarrito() {
    const cantidadItems = this.carrito.length;
    this.carrito = [];
    this.calcularTotales();
    
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
    this.subtotalVenta = this.carrito.reduce((sum, item) => sum + item.subtotal, 0);
    this.descuentoVenta = this.aplicarDescuento ? (this.subtotalVenta * this.porcentajeDescuento / 100) : 0;
    const subtotalConDescuento = this.subtotalVenta - this.descuentoVenta;
    this.igvVenta = subtotalConDescuento * 0.18;
    this.totalVenta = subtotalConDescuento + this.igvVenta;
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

  verHistorialCliente() {
    // Implementar historial de cliente
    console.log('Ver historial');
  }

  getPromedioCompras(cliente: Cliente): number {
    if (!cliente.compras || cliente.compras === 0) return 0;
    return (cliente.totalCompras || 0) / cliente.compras;
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
    // Validaciones básicas
    if (this.carrito.length === 0 || this.totalVenta <= 0) {
      return false;
    }
    
    // Validar precios del carrito
    return this.validarPreciosCarrito();
  }

  iniciarPago() {
    if (!this.canProcessPayment()) return;

    // Emitir evento al componente padre para que abra el diálogo de pago
    this.procesarPago.emit({
      carrito: this.carrito,
      cliente: this.clienteSeleccionado,
      totalVenta: this.totalVenta,
      subtotalVenta: this.subtotalVenta,
      igvVenta: this.igvVenta,
      descuentoVenta: this.descuentoVenta
    });
  }

  pagoRapido(metodo: string) {
    if (!this.canProcessPayment()) return;

    // Emitir evento al componente padre para que abra el diálogo de pago
    this.procesarPago.emit({
      carrito: this.carrito,
      cliente: this.clienteSeleccionado,
      totalVenta: this.totalVenta,
      subtotalVenta: this.subtotalVenta,
      igvVenta: this.igvVenta,
      descuentoVenta: this.descuentoVenta
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
    this.procesandoPago = false;
    this.progressPercentage = 0;

    // Crear la venta
    const venta: Venta = {
      numeroVenta: this.getNumeroVenta(),
      tipoComprobante: this.nuevaVenta.tipoComprobante || 'BOLETA',
      serieComprobante: this.nuevaVenta.serieComprobante || 'B001',
      observaciones: this.nuevaVenta.observaciones,
      subtotal: this.subtotalVenta,
      igv: this.igvVenta,
      total: this.totalVenta,
      descuento: this.descuentoVenta,
      metodoPago: metodo || 'EFECTIVO',
      cliente: this.clienteSeleccionado || undefined,
      detalles: [...this.carrito],
      fecha: new Date(),
      usuario: this.currentUser
    };

    // Limpiar el carrito
    this.carrito = [];
    this.clienteSeleccionado = null;
    this.aplicarDescuento = false;
    this.porcentajeDescuento = 0;
    this.nuevaVenta = {
      clienteId: 0,
      usuarioId: 1,
      tipoComprobante: 'BOLETA',
      serieComprobante: 'B001',
      observaciones: '',
      detalles: []
    };
    this.calcularTotales();

    this.messageService.add({
      severity: 'success',
      summary: 'Venta Completada',
      detail: `Venta ${venta.numeroVenta} procesada exitosamente`,
      life: 5000
    });

    // Actualizar inventarios después de completar la venta
    this.actualizarInventariosDespuesDeVenta();
    
    this.cdr.markForCheck();

  }
  
  /**
   * Actualiza los inventarios después de completar una venta
   */
  private actualizarInventariosDespuesDeVenta(): void {
    console.log('🔄 Actualizando inventarios después de la venta...');
    
    // Limpiar caché para forzar nueva búsqueda
    this.limpiarCacheBusqueda();
    
    // Recargar productos populares para reflejar nuevos stocks
    setTimeout(() => {
      this.cargarProductosPopulares();
    }, 1000); // Esperar un segundo para que el backend se actualice
  }

  onComprobanteChange() {
    // Actualizar series según el tipo de comprobante
    this.nuevaVenta.serieComprobante = '';
    this.cdr.markForCheck();
  }

  // ✅ MÉTODOS AUXILIARES
  formatearMoneda(valor: string | number): string {
    // Manejar valores undefined, null, NaN y strings vacíos
    if (valor === undefined || valor === null || valor === '' || isNaN(Number(valor))) {
      return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN',
        minimumFractionDigits: 2
      }).format(0);
    }
    
    const numero = typeof valor === 'string' ? parseFloat(valor) : Number(valor);
    
    // Verificar que el número sea válido después de la conversión
    if (isNaN(numero) || !isFinite(numero)) {
      return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN',
        minimumFractionDigits: 2
      }).format(0);
    }
    
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(numero);
  }

  getNumeroVenta(): string {
    const fecha = new Date();
    const año = fecha.getFullYear().toString().slice(-2);
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const dia = fecha.getDate().toString().padStart(2, '0');
    const numero = Math.floor(Math.random() * 9999) + 1;
    return `${año}${mes}${dia}-${numero.toString().padStart(4, '0')}`;
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
    this.showKeyboardHelp = false;
    this.cerrarScanner();
    this.cdr.markForCheck();
  }

  // ✅ MÉTODOS DE NAVEGACIÓN
  abrirDashboard() {
    this.showDashboard = true;
    console.log('📊 Abriendo Dashboard Gerencial...');
    
    // Cargar datos reales del dashboard
    this.cargarDatosRealesdashboard();
    
    this.cdr.markForCheck();
  }

  abrirReportes() {
    console.log('Abrir reportes');
  }

  abrirConfiguracion() {
    console.log('Abrir configuración');
  }

  cerrarSesion() {
    // Emitimos el evento al componente padre para que maneje el cierre de caja
    this.cerrarCajaEvent.emit();
  }

  // ✅ MÉTODOS DE DASHBOARD CON DATOS REALES
  private cargarDatosRealesdashboard(): void {
    console.log('📊 Cargando datos reales del dashboard...');
    
    // Marcar métricas como loading
    this.metricas.forEach(metrica => metrica.loading = true);
    this.cdr.markForCheck();

    // Cargar datos en paralelo
    Promise.all([
      this.cargarResumenVentasHoy(),
      this.cargarStockCritico(),
      this.cargarAnalytics()
    ]).then(() => {
      // Desmarcar loading cuando todo termine
      this.metricas.forEach(metrica => {
        metrica.loading = false;
        metrica.ultimaActualizacion = new Date();
      });
      this.cdr.markForCheck();
    }).catch(error => {
      console.error('❌ Error cargando datos del dashboard:', error);
      this.metricas.forEach(metrica => metrica.loading = false);
      this.cdr.markForCheck();
    });
  }

  private async cargarResumenVentasHoy(): Promise<void> {
    try {
      const fechaHoy = new Date().toISOString().split('T')[0];
      const resumen = await this.ventasService.obtenerResumenDiario(fechaHoy).toPromise();
      
      if (resumen) {
        // Actualizar métricas de ventas
        const metricaVentas = this.metricas.find(m => m.id === 'ventas-dia');
        if (metricaVentas) {
          metricaVentas.valor = resumen.totalIngresos || 0;
          metricaVentas.tendencia = {
            direccion: resumen.porcentajeCrecimiento >= 0 ? 'up' : 'down',
            porcentaje: Math.abs(resumen.porcentajeCrecimiento || 0),
            periodo: 'crecimiento'
          };
        }

        // Actualizar transacciones
        const metricaTransacciones = this.metricas.find(m => m.id === 'transacciones');
        if (metricaTransacciones) {
          metricaTransacciones.valor = resumen.cantidadVentas || 0;
          metricaTransacciones.tendencia = {
            direccion: resumen.porcentajeCrecimiento >= 0 ? 'up' : 'down',
            porcentaje: Math.abs(resumen.porcentajeCrecimiento || 0),
            periodo: 'crecimiento'
          };
        }

        // Actualizar ticket promedio
        const metricaTicket = this.metricas.find(m => m.id === 'ticket-promedio');
        if (metricaTicket) {
          metricaTicket.valor = resumen.promedioVenta || 0;
          metricaTicket.tendencia = {
            direccion: resumen.porcentajeCrecimiento >= 0 ? 'up' : 'down',
            porcentaje: Math.abs(resumen.porcentajeCrecimiento || 0),
            periodo: 'promedio'
          };
        }
      }
    } catch (error) {
      console.error('❌ Error cargando resumen de ventas:', error);
    }
  }

  private async cargarStockCritico(): Promise<void> {
    try {
      const response = await this.inventarioService.obtenerInventarios(0, 1000, 'cantidad', 'asc', {
        soloStockCritico: true
      }).toPromise();
      
      if (response) {
        const stockCritico = response.contenido.filter(inv => inv.cantidad <= 5);
        
        const metricaStock = this.metricas.find(m => m.id === 'stock-critico');
        if (metricaStock) {
          metricaStock.valor = stockCritico.length;
          metricaStock.alertaCritica = {
            activa: stockCritico.length > 0,
            mensaje: stockCritico.length > 0 ? `${stockCritico.length} productos requieren reposición` : 'Stock en niveles normales',
            nivel: stockCritico.length > 20 ? 'alta' : stockCritico.length > 10 ? 'media' : 'baja'
          };
        }
      }
    } catch (error) {
      console.error('❌ Error cargando stock crítico:', error);
    }
  }

  private async cargarAnalytics(): Promise<void> {
    try {
      const kpis = await this.analyticsService.getKPIMetrics().toPromise();
      
      if (kpis) {
        // Actualizar métricas con datos de analytics
        const metricaVentas = this.metricas.find(m => m.id === 'ventas-dia');
        if (metricaVentas && kpis.ventasHoy) {
          metricaVentas.valor = kpis.ventasHoy;
        }

        // Puedes agregar más actualizaciones según los datos disponibles en tu analytics service
      }
    } catch (error) {
      console.error('❌ Error cargando analytics:', error);
    }
  }

  private calcularPorcentajeCambio(valorActual: number, valorAnterior: number): number {
    if (valorAnterior === 0) return valorActual > 0 ? 100 : 0;
    return Math.abs(((valorActual - valorAnterior) / valorAnterior) * 100);
  }

  // ✅ MÉTODOS ADICIONALES PARA EL DASHBOARD
  actualizarDashboardManual(): void {
    console.log('🔄 Actualización manual del dashboard solicitada...');
    this.toastService.info(
      '🔄 Actualizando Dashboard',
      'Obteniendo los datos más recientes...',
      { duration: 2000 }
    );
    this.cargarDatosRealesdashboard();
  }

  cerrarDashboard(): void {
    this.showDashboard = false;
    this.cdr.markForCheck();
  }

  // Método para obtener datos históricos (si tu API lo soporta)
  private async cargarDatosHistoricos(): Promise<void> {
    try {
      const fechaInicio = new Date();
      fechaInicio.setDate(fechaInicio.getDate() - 7); // Últimos 7 días
      const fechaFin = new Date();

      const reporte = await this.ventasService.generarReporteVentas(
        fechaInicio.toISOString().split('T')[0],
        fechaFin.toISOString().split('T')[0]
      ).toPromise();

      if (reporte) {
        console.log('📊 Datos históricos cargados:', reporte);
        // Aquí puedes procesar los datos históricos si tu modelo lo incluye
      }
    } catch (error) {
      console.error('❌ Error cargando datos históricos:', error);
    }
  }

  // MÉTODOS DE CARGA DE DATOS
  private cargarProductosPopulares() {
    console.log('� Cargando productos populares desde el servidor...');
    
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
        
        
        console.log(`✅ Productos populares cargados: ${this.productosPopulares.length} productos`);
        
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
  }
  
  
  descargarComprobantePDF(venta: VentaResponse): void {
    // Usar el parámetro venta para generar el PDF
    const nombreArchivo = `comprobante-${venta.numeroVenta}.pdf`;
    this.mostrarInfo('Descargando', `Generando archivo PDF: ${nombreArchivo}`);
    
    // TODO: Implementar lógica real de descarga
    // this.ventasService.descargarComprobantePDF(venta.id);
  }
  
// Funciones de acciones rápidas
nuevaVentaRapida(): void {
  this.activeTabIndex = 1;
  this.pasoActual = 0;
  this.limpiarFormularioVenta();
  this.mostrarExito('Nueva Venta', 'Iniciando nueva venta...');
  setTimeout(() => {
    this.codigoInput?.nativeElement?.focus();
  }, 100);
}
  // Vista activa
  activeTabIndex = 0;  
  pasoActual = 0;

  private limpiarFormularioVenta(): void {
    this.nuevaVenta = this.initNuevaVenta();
    this.clienteSeleccionado = null;
    this.carrito = [];
    this.calcularTotales();
    this.pasoActual = 0;
    this.codigoBusqueda = '';
    this.cantidadInput = 1;
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
    this.clientesRecientes = [
      {
        id: 1,
        nombres: 'Juan Carlos',
        apellidos: 'García López',
        dni: '12345678',
        email: 'juan.garcia@email.com',
        telefono: '987654321',
        compras: 5,
        totalCompras: 850.50,
        ultimaCompra: '2025-07-10'
      },
      {
        id: 2,
        nombres: 'María Elena',
        apellidos: 'Rodríguez Silva',
        dni: '87654321',
        email: 'maria.rodriguez@email.com',
        telefono: '987123456',
        compras: 12,
        totalCompras: 1250.75,
        ultimaCompra: '2025-07-11'
      }
    ];
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
}
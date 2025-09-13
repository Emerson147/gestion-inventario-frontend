import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { VentaRequest, VentaResponse } from '../../../../../core/models/venta.model';
import { PagoRequest, PagoResponse } from '../../../../../core/models/pago.model';
import { MetricaVenta } from '../metrics/metric-card.interface';

// Interfaces
export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  imagen?: string;
  precio: number;
  categoria?: string;
}

export interface Inventario {
  id: number;
  producto: Producto;
  color: { id: number; nombre: string; codigo: string };
  talla: { id: number; numero: string };
  serie: string;
  cantidad: number;
  codigoCompleto: string;
  stock: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Cliente {
  id: number;
  nombres: string;
  apellidos: string;
  dni?: string;
  ruc?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  compras?: number;
  totalCompras?: number;
  ultimaCompra?: Date;
}

// Agregar interfaz Tendencia
interface Tendencia {
  direccion: 'up' | 'down' | 'neutral';
  porcentaje: number;
  periodo: string;
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
  detalles: Inventario[];
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
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './pos-ventas.component.html',
  styleUrls: ['./pos-ventas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PosVentasComponent implements OnInit, OnDestroy {
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
  carrito: Inventario[] = [];
  clienteSeleccionado: Cliente | null = null;
  totalVenta = 0;
  subtotalVenta = 0;
  igvVenta = 0;
  descuentoVenta = 0;

  // Búsqueda y productos
  codigoBusqueda = '';
  cantidadInput = 1;
  productoBusqueda: Inventario | null = null;
  productosAutoComplete: Inventario[] = [];
  productosPopulares: Inventario[] = [];

  // Scanner
  scannerActive = false;
  stream: MediaStream | null = null;

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

  metricas: MetricaVenta[] = [];

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

  // ✅ INICIALIZACIÓN
  private inicializarComponente() {
    this.cargarProductosPopulares();
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

    setTimeout(() => {
      // Simulación de búsqueda
      const productoEncontrado = this.simularBusquedaPorCodigo(this.codigoBusqueda);
      
      if (productoEncontrado) {
        this.agregarAlCarrito(productoEncontrado, this.cantidadInput);
        this.codigoBusqueda = '';
        this.cantidadInput = 1;
        this.messageService.add({
          severity: 'success',
          summary: 'Producto Agregado',
          detail: `${productoEncontrado.producto.nombre} agregado al carrito`
        });
      } else {
        this.messageService.add({
          severity: 'warn',
          summary: 'Producto No Encontrado',
          detail: `No se encontró producto con código: ${this.codigoBusqueda}`
        });
      }

      this.searchingProducts = false;
      this.cdr.markForCheck();
    }, 1000);
  }

  buscarProductosAutoComplete(event: { query: string }) {
    const query = event.query;
    this.searchingProducts = true;
    this.loadingMessage = 'Buscando productos...';
    this.cdr.markForCheck();

    setTimeout(() => {
      this.productosAutoComplete = this.simularBusquedaAvanzada(query);
      this.searchingProducts = false;
      this.cdr.markForCheck();
    }, 500);
  }

  seleccionarProductoAutoComplete(event: { value: Inventario }) {
    if (event && event.value) {
      this.agregarAlCarrito(event.value, 1);
      this.productoBusqueda = null;
    }
  }

  seleccionarProductoPopular(producto: Inventario) {
    this.agregarAlCarrito(producto, 1);
  }

  // ✅ GESTIÓN DEL CARRITO
  agregarAlCarrito(inventario: Inventario, cantidad: number) {
    this.addingToCart = true;
    this.loadingMessage = 'Agregando al carrito...';
    this.cdr.markForCheck();

    setTimeout(() => {
      const existeEnCarrito = this.carrito.find(item => item.id === inventario.id);

      if (existeEnCarrito) {
        const nuevaCantidad = existeEnCarrito.cantidad + cantidad;
        if (nuevaCantidad <= inventario.stock) {
          existeEnCarrito.cantidad = nuevaCantidad;
          existeEnCarrito.subtotal = existeEnCarrito.cantidad * existeEnCarrito.precioUnitario;
        } else {
          this.messageService.add({
            severity: 'warn',
            summary: 'Stock Insuficiente',
            detail: `Solo hay ${inventario.stock} unidades disponibles`
          });
        }
      } else {
        if (cantidad <= inventario.stock) {
          const nuevoItem: Inventario = {
            ...inventario,
            cantidad: cantidad,
            subtotal: cantidad * inventario.precioUnitario
          };
          this.carrito.push(nuevoItem);
        }
      }

      this.calcularTotales();
      this.addingToCart = false;
      this.cdr.markForCheck();
    }, 800);
  }

  actualizarCantidadItem(item: Inventario, nuevaCantidad: number) {
    if (nuevaCantidad >= 1 && nuevaCantidad <= item.stock) {
      item.cantidad = nuevaCantidad;
      item.subtotal = item.cantidad * item.precioUnitario;
      this.calcularTotales();
      this.cdr.markForCheck();
    }
  }

  eliminarItemCarrito(item: Inventario) {
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
    this.carrito = [];
    this.calcularTotales();
    this.messageService.add({
      severity: 'info',
      summary: 'Carrito Limpio',
      detail: 'Todos los productos han sido eliminados'
    });
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
    this.loadingClient = true;
    this.loadingMessage = 'Buscando clientes...';
    this.cdr.markForCheck();

    setTimeout(() => {
      this.clientesFiltrados = this.simularBusquedaClientes(query);
      this.loadingClient = false;
      this.cdr.markForCheck();
    }, 500);
  }

  onClienteSelect(event: { value: Cliente }) {
    if (event && event.value) {
      this.seleccionarCliente(event.value);
    }
  }

  seleccionarCliente(cliente: Cliente) {
    this.clienteSeleccionado = cliente;
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
    return this.carrito.length > 0 && this.totalVenta > 0;
  }

  iniciarPago() {
    if (!this.canProcessPayment()) return;

    this.procesandoPago = true;
    this.progressPercentage = 0;
    this.loadingMessage = 'Validando datos...';
    this.cdr.markForCheck();

    this.simularProcesamientoPago();
  }

  pagoRapido(metodo: string) {
    if (!this.canProcessPayment()) return;

    this.procesandoPago = true;
    this.progressPercentage = 0;
    this.loadingMessage = `Procesando pago ${metodo}...`;
    this.cdr.markForCheck();

    this.simularProcesamientoPago(metodo);
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

    this.cdr.markForCheck();
    console.log('Venta completada:', venta);
  }

  onComprobanteChange() {
    // Actualizar series según el tipo de comprobante
    this.nuevaVenta.serieComprobante = '';
    this.cdr.markForCheck();
  }

  // ✅ MÉTODOS AUXILIARES
  formatearMoneda(valor: string | number): string {
    const numero = typeof valor === 'string' ? parseFloat(valor) || 0 : valor;
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  obtenerPrecioProducto(productoId: number): number {
    // Simular obtención de precio
    return Math.floor(Math.random() * 200) + 20;
  }

  cerrarModales() {
    this.showClientModal = false;
    this.showKeyboardHelp = false;
    this.cerrarScanner();
    this.cdr.markForCheck();
  }

  // ✅ MÉTODOS DE NAVEGACIÓN
  abrirDashboard() {
    console.log('Abrir dashboard');
  }

  abrirReportes() {
    console.log('Abrir reportes');
  }

  abrirConfiguracion() {
    console.log('Abrir configuración');
  }

  cerrarSesion() {
    console.log('Cerrar sesión');
  }

  // ✅ MÉTODOS DE SIMULACIÓN (MOCK DATA)
  private cargarProductosPopulares() {
    this.productosPopulares = [
      {
        id: 1,
        producto: {
          id: 1,
          codigo: 'CAM001',
          nombre: 'Camisa Polo Clásica',
          precio: 89.90
        },
        color: { id: 1, nombre: 'Azul', codigo: 'AZ' },
        talla: { id: 1, numero: 'M' },
        serie: 'CAM001-AZ-M-001',
        cantidad: 15,
        codigoCompleto: 'CAM001-AZ-M',
        stock: 15,
        precioUnitario: 89.90,
        subtotal: 0
      },
      {
        id: 2,
        producto: {
          id: 2,
          codigo: 'PAN002',
          nombre: 'Pantalón Jean Clásico',
          precio: 129.90
        },
        color: { id: 2, nombre: 'Negro', codigo: 'NG' },
        talla: { id: 2, numero: '32' },
        serie: 'PAN002-NG-32-001',
        cantidad: 8,
        codigoCompleto: 'PAN002-NG-32',
        stock: 8,
        precioUnitario: 129.90,
        subtotal: 0
      },
      {
        id: 3,
        producto: {
          id: 3,
          codigo: 'ZAP003',
          nombre: 'Zapatos Deportivos',
          precio: 199.90
        },
        color: { id: 3, nombre: 'Blanco', codigo: 'BL' },
        talla: { id: 3, numero: '42' },
        serie: 'ZAP003-BL-42-001',
        cantidad: 12,
        codigoCompleto: 'ZAP003-BL-42',
        stock: 12,
        precioUnitario: 199.90,
        subtotal: 0
      }
    ];
  }

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
        ultimaCompra: new Date('2025-07-10')
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
        ultimaCompra: new Date('2025-07-11')
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
        ultimaCompra: new Date('2025-07-09')
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
  
  
  private simularBusquedaPorCodigo(codigo: string): Inventario | null {
    // Simular búsqueda en base de datos
    const producto = this.productosPopulares.find(p => 
      p.producto.codigo === codigo || p.codigoCompleto === codigo
    );
    return producto || null;
  }

  private simularBusquedaAvanzada(query: string): Inventario[] {
    if (!query || query.length < 2) return [];
    
    return this.productosPopulares.map(p => ({
      ...p,
      displayLabel: `${p.producto.codigo} - ${p.producto.nombre} (${p.color.nombre}, ${p.talla.numero})`
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
}
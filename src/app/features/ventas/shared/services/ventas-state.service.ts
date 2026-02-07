import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { VentaResponse } from '../../../../core/models/venta.model';

export interface FiltrosVentas {
  fechaInicio: Date | null;
  fechaFin: Date | null;
  cliente: string;
  estado: string;
  tipoComprobante: string;
  metodoPago: string;
}

export interface EstadisticasVentas {
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

@Injectable({
  providedIn: 'root'
})
export class VentasStateService {
  // Signals para estado reactivo
  private ventasSignal = signal<VentaResponse[]>([]);
  private filtrosSignal = signal<FiltrosVentas>({
    fechaInicio: null,
    fechaFin: null,
    cliente: '',
    estado: '',
    tipoComprobante: '',
    metodoPago: ''
  });
  private loadingSignal = signal<boolean>(false);
  private estadisticasSignal = signal<EstadisticasVentas>({
    totalVentasHoy: 0,
    montoVentasHoy: 0,
    ventasEsteMes: 0,
    montoEsteMes: 0,
    productoMasVendido: '',
    clienteFrecuente: '',
    ventasPendientes: 0,
    pagosContado: 0,
    pagosCredito: 0
  });

  // BehaviorSubjects para compatibilidad
  private ventasSubject = new BehaviorSubject<VentaResponse[]>([]);
  private needsRefreshSubject = new BehaviorSubject<boolean>(false);

  // Observables públicos
  public ventas$ = this.ventasSubject.asObservable();
  public needsRefresh$ = this.needsRefreshSubject.asObservable();

  // Signals públicos (readonly)
  public ventas = this.ventasSignal.asReadonly();
  public filtros = this.filtrosSignal.asReadonly();
  public loading = this.loadingSignal.asReadonly();
  public estadisticas = this.estadisticasSignal.asReadonly();

  // Computed signals
  public ventasFiltradas = computed(() => {
    const ventas = this.ventasSignal();
    const filtros = this.filtrosSignal();
    
    return ventas.filter(venta => {
      // Filtro por fecha inicio
      if (filtros.fechaInicio && new Date(venta.fechaCreacion) < filtros.fechaInicio) {
        return false;
      }
      
      // Filtro por fecha fin
      if (filtros.fechaFin && new Date(venta.fechaCreacion) > filtros.fechaFin) {
        return false;
      }
      
      // Filtro por cliente
      if (filtros.cliente && !venta.cliente.nombres.toLowerCase().includes(filtros.cliente.toLowerCase())) {
        return false;
      }
      
      // Filtro por estado
      if (filtros.estado && venta.estado !== filtros.estado) {
        return false;
      }
      
      // Filtro por tipo de comprobante
      if (filtros.tipoComprobante && venta.tipoComprobante !== filtros.tipoComprobante) {
        return false;
      }
      
      // Filtro por método de pago
      if (filtros.metodoPago) {
        // TODO: Verificar si VentaResponse tiene propiedad pagos
        // const tienePago = venta.pagos?.some(p => p.metodoPago === filtros.metodoPago);
        // if (!tienePago) return false;
      }
      
      return true;
    });
  });

  public ventasPendientes = computed(() => 
    this.ventasSignal().filter(v => v.estado === 'PENDIENTE')
  );

  public ventasDelDia = computed(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    return this.ventasSignal().filter(venta => {
      const fechaVenta = new Date(venta.fechaCreacion);
      fechaVenta.setHours(0, 0, 0, 0);
      return fechaVenta.getTime() === hoy.getTime();
    });
  });

  public totalVentasDelDia = computed(() => 
    this.ventasDelDia().reduce((sum, v) => sum + v.total, 0)
  );

  public cantidadVentasDelDia = computed(() => 
    this.ventasDelDia().length
  );

  constructor() {}

  /**
   * Actualiza el listado de ventas
   */
  setVentas(ventas: VentaResponse[]): void {
    this.ventasSignal.set(ventas);
    this.ventasSubject.next(ventas);
    this.actualizarEstadisticas(ventas);
  }

  /**
   * Agrega una nueva venta al estado
   */
  agregarVenta(venta: VentaResponse): void {
    const ventasActuales = this.ventasSignal();
    const nuevasVentas = [venta, ...ventasActuales];
    this.setVentas(nuevasVentas);
    this.notificarActualizacion();
  }

  /**
   * Actualiza una venta existente
   */
  actualizarVenta(venta: VentaResponse): void {
    const ventasActuales = this.ventasSignal();
    const ventasActualizadas = ventasActuales.map(v => 
      v.id === venta.id ? venta : v
    );
    this.setVentas(ventasActualizadas);
    this.notificarActualizacion();
  }

  /**
   * Elimina una venta del estado
   */
  eliminarVenta(ventaId: number): void {
    const ventasActuales = this.ventasSignal();
    const ventasFiltradas = ventasActuales.filter(v => v.id !== ventaId);
    this.setVentas(ventasFiltradas);
    this.notificarActualizacion();
  }

  /**
   * Actualiza los filtros
   */
  setFiltros(filtros: Partial<FiltrosVentas>): void {
    const filtrosActuales = this.filtrosSignal();
    this.filtrosSignal.set({ ...filtrosActuales, ...filtros });
  }

  /**
   * Limpia todos los filtros
   */
  limpiarFiltros(): void {
    this.filtrosSignal.set({
      fechaInicio: null,
      fechaFin: null,
      cliente: '',
      estado: '',
      tipoComprobante: '',
      metodoPago: ''
    });
  }

  /**
   * Actualiza el estado de carga
   */
  setLoading(loading: boolean): void {
    this.loadingSignal.set(loading);
  }

  /**
   * Actualiza las estadísticas basándose en las ventas
   */
  private actualizarEstadisticas(ventas: VentaResponse[]): void {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const ventasHoy = ventas.filter(v => {
      const fechaVenta = new Date(v.fechaCreacion);
      fechaVenta.setHours(0, 0, 0, 0);
      return fechaVenta.getTime() === hoy.getTime();
    });

    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ventasMes = ventas.filter(v => 
      new Date(v.fechaCreacion) >= primerDiaMes
    );

    const estadisticas: EstadisticasVentas = {
      totalVentasHoy: ventasHoy.length,
      montoVentasHoy: ventasHoy.reduce((sum, v) => sum + v.total, 0),
      ventasEsteMes: ventasMes.length,
      montoEsteMes: ventasMes.reduce((sum, v) => sum + v.total, 0),
      productoMasVendido: this.calcularProductoMasVendido(ventas),
      clienteFrecuente: this.calcularClienteFrecuente(ventas),
      ventasPendientes: ventas.filter(v => v.estado === 'PENDIENTE').length,
      pagosContado: 0, // TODO: Implementar cuando el modelo tenga pagos
      pagosCredito: ventas.filter(v => v.estado === 'PENDIENTE').length
    };

    this.estadisticasSignal.set(estadisticas);
  }

  /**
   * Calcula el producto más vendido
   */
  private calcularProductoMasVendido(ventas: VentaResponse[]): string {
    const conteoProductos = new Map<string, number>();
    
    ventas.forEach(venta => {
      venta.detalles.forEach(detalle => {
        const nombre = detalle.producto?.nombre || 'Desconocido';
        conteoProductos.set(nombre, (conteoProductos.get(nombre) || 0) + detalle.cantidad);
      });
    });

    let maxVentas = 0;
    let productoMasVendido = 'N/A';
    
    conteoProductos.forEach((cantidad, producto) => {
      if (cantidad > maxVentas) {
        maxVentas = cantidad;
        productoMasVendido = producto;
      }
    });

    return productoMasVendido;
  }

  /**
   * Calcula el cliente más frecuente
   */
  private calcularClienteFrecuente(ventas: VentaResponse[]): string {
    const conteoClientes = new Map<string, number>();
    
    ventas.forEach(venta => {
      const nombreCliente = `${venta.cliente.nombres} ${venta.cliente.apellidos}`;
      conteoClientes.set(nombreCliente, (conteoClientes.get(nombreCliente) || 0) + 1);
    });

    let maxCompras = 0;
    let clienteFrecuente = 'N/A';
    
    conteoClientes.forEach((cantidad, cliente) => {
      if (cantidad > maxCompras) {
        maxCompras = cantidad;
        clienteFrecuente = cliente;
      }
    });

    return clienteFrecuente;
  }

  /**
   * Notifica que se necesita refrescar los datos
   */
  notificarActualizacion(): void {
    this.needsRefreshSubject.next(true);
    
    // Reset después de un breve delay
    setTimeout(() => {
      this.needsRefreshSubject.next(false);
    }, 500);
  }

  /**
   * Obtiene las ventas actuales (no reactivo)
   */
  getVentas(): VentaResponse[] {
    return this.ventasSignal();
  }

  /**
   * Resetea todo el estado
   */
  resetearEstado(): void {
    this.ventasSignal.set([]);
    this.ventasSubject.next([]);
    this.limpiarFiltros();
    this.setLoading(false);
  }
}

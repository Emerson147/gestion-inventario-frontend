import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, catchError, of, BehaviorSubject, interval } from 'rxjs';
import { VentasService } from './ventas.service';
import { VentaResponse, ResumenDiarioResponse } from '../models/venta.model';

export interface EstadisticasVenta {
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

export interface DatosGrafico {
  labels: string[];
  datasets: {
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension: number;
    fill: boolean;
  }[];
}

export interface DistribucionPago {
  nombre: string;
  cantidad: number;
  porcentaje: number;
}

export interface ActividadReciente {
  titulo: string;
  descripcion: string;
  tiempo: string;
}

export interface TopProducto {
  nombre: string;
  cantidad: number;
}

@Injectable({ providedIn: 'root' })
export class EstadisticasVentasService {
  
  private ventasService = inject(VentasService);
  
  private estadisticasSubject = new BehaviorSubject<EstadisticasVenta>({
    ventasHoy: 0,
    totalVentasHoy: 0,
    clientesUnicos: 0,
    clientesNuevos: 0,
    productosVendidos: 0,
    tiposProductos: 0,
    porcentajeCrecimiento: 0,
    promedioVenta: 0,
    metaDiaria: 10000
  });

  private distribucionPagosSubject = new BehaviorSubject<DistribucionPago[]>([]);
  private actividadRecienteSubject = new BehaviorSubject<ActividadReciente[]>([]);
  private topProductosSubject = new BehaviorSubject<TopProducto[]>([]);
  private datosGraficoSubject = new BehaviorSubject<DatosGrafico>({
    labels: [],
    datasets: []
  });

  private cargandoSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  constructor() {
    // Auto-actualizar cada 3 minutos
    interval(3 * 60 * 1000).subscribe(() => {
      this.actualizarEstadisticas().subscribe();
    });
  }

  // Observables públicos
  get estadisticas$(): Observable<EstadisticasVenta> {
    return this.estadisticasSubject.asObservable();
  }

  get distribucionPagos$(): Observable<DistribucionPago[]> {
    return this.distribucionPagosSubject.asObservable();
  }

  get actividadReciente$(): Observable<ActividadReciente[]> {
    return this.actividadRecienteSubject.asObservable();
  }

  get topProductos$(): Observable<TopProducto[]> {
    return this.topProductosSubject.asObservable();
  }

  get datosGrafico$(): Observable<DatosGrafico> {
    return this.datosGraficoSubject.asObservable();
  }

  get cargando$(): Observable<boolean> {
    return this.cargandoSubject.asObservable();
  }

  get error$(): Observable<string | null> {
    return this.errorSubject.asObservable();
  }

  actualizarEstadisticas(): Observable<EstadisticasVenta> {
    this.cargandoSubject.next(true);
    this.errorSubject.next(null);

    const hoy = new Date().toISOString().split('T')[0];
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    const fechaAyer = ayer.toISOString().split('T')[0];

    console.log('📊 Cargando estadísticas para:', { hoy, ayer: fechaAyer });

    return forkJoin({
      resumenHoy: this.ventasService.obtenerResumenDiario(hoy).pipe(
        catchError(error => {
          console.warn('No se pudo obtener resumen de hoy:', error);
          return of(null);
        })
      ),
      resumenAyer: this.ventasService.obtenerResumenDiario(fechaAyer).pipe(
        catchError(error => {
          console.warn('No se pudo obtener resumen de ayer:', error);
          return of(null);
        })
      ),
      ventasHoy: this.ventasService.obtenerVentasPorFecha(hoy).pipe(
        catchError(error => {
          console.warn('No se pudieron obtener ventas de hoy:', error);
          return of([]);
        })
      ),
      ventasRecientes: this.ventasService.obtenerVentasRecientes(20).pipe(
        catchError(error => {
          console.warn('No se pudieron obtener ventas recientes:', error);
          return of([]);
        })
      )
    }).pipe(
      map(({ resumenHoy, resumenAyer, ventasHoy, ventasRecientes }) => {
        console.log('📈 Datos obtenidos:', { 
          resumenHoy, 
          resumenAyer, 
          ventasHoy: ventasHoy.length, 
          ventasRecientes: ventasRecientes.length 
        });

        const estadisticas = this.procesarEstadisticas(resumenHoy, resumenAyer, ventasHoy);
        this.estadisticasSubject.next(estadisticas);
        
        // Procesar datos adicionales
        this.procesarDistribucionPagos(ventasHoy);
        this.procesarActividadReciente(ventasRecientes);
        this.procesarTopProductos(ventasHoy);
        this.procesarDatosGrafico(ventasHoy);
        
        this.cargandoSubject.next(false);
        return estadisticas;
      }),
      catchError(error => {
        console.error('❌ Error actualizando estadísticas:', error);
        this.errorSubject.next('Error al cargar estadísticas');
        this.cargandoSubject.next(false);
        return of(this.getEstadisticasVacias());
      })
    );
  }

  private procesarEstadisticas(
    resumenHoy: ResumenDiarioResponse | null,
    resumenAyer: ResumenDiarioResponse | null,
    ventasHoy: VentaResponse[]
  ): EstadisticasVenta {
    
    if (resumenHoy) {
      // Usar datos del backend si están disponibles
      const totalHoy = resumenHoy.totalIngresos || 0;
      const totalAyer = resumenAyer?.totalIngresos || 0;
      const porcentajeCrecimiento = totalAyer > 0 
        ? ((totalHoy - totalAyer) / totalAyer) * 100 
        : 0;

      return {
        ventasHoy: resumenHoy.totalVentas || 0,
        totalVentasHoy: totalHoy,
        clientesUnicos: resumenHoy.clientesUnicos || 0,
        clientesNuevos: resumenHoy.clientesNuevos || 0,
        productosVendidos: resumenHoy.productosVendidos || 0,
        tiposProductos: resumenHoy.tiposProductos || 0,
        porcentajeCrecimiento,
        promedioVenta: resumenHoy.promedioVenta || 0,
        metaDiaria: 10000
      };
    }

    // Fallback: calcular desde las ventas
    return this.calcularEstadisticasManualmente(ventasHoy);
  }

  private calcularEstadisticasManualmente(ventasHoy: VentaResponse[]): EstadisticasVenta {
    console.log('⚙️ Calculando estadísticas manualmente para', ventasHoy.length, 'ventas');
    
    const totalVentasHoy = ventasHoy.reduce((sum, venta) => sum + venta.total, 0);
    const clientesUnicos = new Set(ventasHoy.map(v => v.cliente?.id).filter(Boolean)).size;
    
    let productosVendidos = 0;
    const tiposProductosSet = new Set<number>();
    
    ventasHoy.forEach(venta => {
      if (venta.detalles && venta.detalles.length > 0) {
        venta.detalles.forEach(detalle => {
          productosVendidos += detalle.cantidad;
          if (detalle.producto?.id) {
            tiposProductosSet.add(detalle.producto.id);
          }
        });
      }
    });

    return {
      ventasHoy: ventasHoy.length,
      totalVentasHoy,
      clientesUnicos,
      clientesNuevos: 0, 
      productosVendidos,
      tiposProductos: tiposProductosSet.size,
      porcentajeCrecimiento: 0,
      promedioVenta: ventasHoy.length > 0 ? totalVentasHoy / ventasHoy.length : 0,
      metaDiaria: 10000
    };
  }

  private procesarDistribucionPagos(ventasHoy: VentaResponse[]): void {
    const contadorMetodos: Record<string, number> = {};
    const totalVentas = ventasHoy.length;

    ventasHoy.forEach(() => {
      const metodo = this.mapearMetodoPago('EFECTIVO'); // Usar valor por defecto
      contadorMetodos[metodo] = (contadorMetodos[metodo] || 0) + 1;
    });

    const distribucion: DistribucionPago[] = Object.entries(contadorMetodos).map(([metodo, cantidad]) => ({
      nombre: metodo,
      cantidad,
      porcentaje: totalVentas > 0 ? Math.round((cantidad / totalVentas) * 100) : 0
    }));

    this.distribucionPagosSubject.next(distribucion);
  }

  private procesarActividadReciente(ventasRecientes: VentaResponse[]): void {
    const actividades: ActividadReciente[] = ventasRecientes
      .slice(0, 10)
      .map(venta => ({
        titulo: `Venta ${venta.estado.toLowerCase()}`,
        descripcion: `${venta.numeroVenta} - ${this.formatearMoneda(venta.total)}`,
        tiempo: this.calcularTiempoTranscurrido(new Date(venta.fechaCreacion))
      }));

    this.actividadRecienteSubject.next(actividades);
  }

  private procesarTopProductos(ventasHoy: VentaResponse[]): void {
    const contadorProductos: Record<string, { nombre: string; cantidad: number }> = {};

    ventasHoy.forEach(venta => {
      if (venta.detalles) {
        venta.detalles.forEach(detalle => {
          if (detalle.producto) {
            const id = detalle.producto.id.toString();
            if (!contadorProductos[id]) {
              contadorProductos[id] = {
                nombre: detalle.producto.nombre,
                cantidad: 0
              };
            }
            contadorProductos[id].cantidad += detalle.cantidad;
          }
        });
      }
    });

    const topProductos: TopProducto[] = Object.values(contadorProductos)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    this.topProductosSubject.next(topProductos);
  }

  private procesarDatosGrafico(ventasHoy: VentaResponse[]): void {
    const ventasPorHora = new Array(24).fill(0);
    
    ventasHoy.forEach(venta => {
      const hora = new Date(venta.fechaCreacion).getHours();
      ventasPorHora[hora] += venta.total;
    });

    const datosGrafico: DatosGrafico = {
      labels: Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`),
      datasets: [
        {
          data: ventasPorHora,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };

    this.datosGraficoSubject.next(datosGrafico);
  }

  private mapearMetodoPago(metodo: string): string {
    const mapeo: Record<string, string> = {
      'EFECTIVO': 'Efectivo',
      'TARJETA_DEBITO': 'Tarjeta',
      'TARJETA_CREDITO': 'Tarjeta',
      'YAPE': 'Digital',
      'PLIN': 'Digital',
      'TRANSFERENCIA': 'Transferencia'
    };
    return mapeo[metodo] || 'Otros';
  }

  private calcularTiempoTranscurrido(fecha: Date): string {
    const ahora = new Date();
    const diff = Math.floor((ahora.getTime() - fecha.getTime()) / 1000);
    
    if (diff < 60) return 'hace menos de 1 min';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} horas`;
    return `hace ${Math.floor(diff / 86400)} días`;
  }

  private formatearMoneda(monto: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(monto);
  }

  private getEstadisticasVacias(): EstadisticasVenta {
    return {
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
  }

  obtenerEstadisticasActuales(): EstadisticasVenta {
    return this.estadisticasSubject.value;
  }

  forzarActualizacion(): Observable<EstadisticasVenta> {
    return this.actualizarEstadisticas();
  }
}
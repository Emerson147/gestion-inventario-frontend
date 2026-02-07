import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { EstadoCaja, Tienda, ImpresoraConfig, AperturaCajaRequest, CierreCajaResponse } from '../models/caja.model';

@Injectable({
  providedIn: 'root'
})
export class CajaStateService {
  // Estado reactivo con signals
  private estadoCajaSignal = signal<EstadoCaja>({
    abierta: false,
    montoInicial: 0,
    fechaApertura: null,
    usuarioApertura: null,
    totalVentasDelDia: 0,
    cantidadVentas: 0,
    ultimaActualizacion: new Date(),
    tienda: null,
    impresora: null,
    turno: null
  });

  // BehaviorSubject para compatibilidad con código existente
  private cajaAbiertaSubject = new BehaviorSubject<boolean>(false);
  
  // Observables públicos
  public cajaAbierta$ = this.cajaAbiertaSubject.asObservable();
  
  // Computed signals
  public estadoCaja = this.estadoCajaSignal.asReadonly();
  public cajaAbierta = computed(() => this.estadoCajaSignal().abierta);
  public totalVentasDelDia = computed(() => this.estadoCajaSignal().totalVentasDelDia);
  public cantidadVentas = computed(() => this.estadoCajaSignal().cantidadVentas);
  public tiendaActual = computed(() => this.estadoCajaSignal().tienda);
  public impresoraActual = computed(() => this.estadoCajaSignal().impresora);
  public turnoActual = computed(() => this.estadoCajaSignal().turno);
  public promedioVenta = computed(() => {
    const estado = this.estadoCajaSignal();
    return estado.cantidadVentas > 0 
      ? estado.totalVentasDelDia / estado.cantidadVentas 
      : 0;
  });

  private readonly STORAGE_KEY = 'estado_caja';

  constructor() {
    this.cargarEstadoDesdeStorage();
  }

  /**
   * Abre la caja registradora con información completa
   */
  abrirCaja(request: AperturaCajaRequest & { tienda: Tienda, impresora: ImpresoraConfig }, usuario: string): void {
    const nuevoEstado: EstadoCaja = {
      abierta: true,
      montoInicial: request.montoInicial,
      fechaApertura: new Date(),
      usuarioApertura: usuario,
      totalVentasDelDia: 0,
      cantidadVentas: 0,
      ultimaActualizacion: new Date(),
      tienda: request.tienda,
      impresora: request.impresora,
      turno: request.turno,
      observaciones: request.observaciones
    };

    this.estadoCajaSignal.set(nuevoEstado);
    this.cajaAbiertaSubject.next(true);
    this.guardarEstadoEnStorage();
    
    console.log('✅ Caja abierta:', {
      tienda: request.tienda.nombre,
      turno: request.turno,
      monto: request.montoInicial
    });
  }

  /**
   * Cierra la caja registradora
   */
  cerrarCaja(response?: CierreCajaResponse): void {
    const estadoActual = this.estadoCajaSignal();
    
    if (response) {
      console.log('🔒 Cierre de caja:', {
        tienda: estadoActual.tienda?.nombre,
        turno: estadoActual.turno,
        montoFinal: response.montoFinal,
        diferencia: response.diferencia,
        totalVentas: response.totalVentas
      });
    }

    const estadoCerrado: EstadoCaja = {
      abierta: false,
      montoInicial: 0,
      fechaApertura: null,
      usuarioApertura: null,
      totalVentasDelDia: 0,
      cantidadVentas: 0,
      ultimaActualizacion: new Date(),
      tienda: null,
      impresora: null,
      turno: null
    };

    this.estadoCajaSignal.set(estadoCerrado);
    this.cajaAbiertaSubject.next(false);
    this.limpiarStorage();
  }

  /**
   * Actualiza las estadísticas de ventas del día
   */
  actualizarEstadisticas(totalVentas: number, cantidadVentas: number): void {
    const estadoActual = this.estadoCajaSignal();
    this.estadoCajaSignal.set({
      ...estadoActual,
      totalVentasDelDia: totalVentas,
      cantidadVentas,
      ultimaActualizacion: new Date()
    });
    this.guardarEstadoEnStorage();
  }

  /**
   * Incrementa el contador de ventas
   */
  registrarVenta(montoVenta: number): void {
    const estadoActual = this.estadoCajaSignal();
    this.estadoCajaSignal.set({
      ...estadoActual,
      totalVentasDelDia: estadoActual.totalVentasDelDia + montoVenta,
      cantidadVentas: estadoActual.cantidadVentas + 1,
      ultimaActualizacion: new Date()
    });
    this.guardarEstadoEnStorage();
  }

  /**
   * Obtiene el estado actual de la caja
   */
  obtenerEstadoActual(): EstadoCaja {
    return this.estadoCajaSignal();
  }

  /**
   * Obtiene la tienda actual
   */
  getTiendaActual(): Tienda | null {
    return this.estadoCajaSignal().tienda;
  }

  /**
   * Obtiene la impresora actual
   */
  getImpresoraActual(): ImpresoraConfig | null {
    return this.estadoCajaSignal().impresora;
  }

  /**
   * Verifica si la caja está abierta
   */
  isCajaAbierta(): boolean {
    return this.estadoCajaSignal().abierta;
  }

  /**
   * Guarda el estado en localStorage
   */
  private guardarEstadoEnStorage(): void {
    try {
      const estado = this.estadoCajaSignal();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(estado));
    } catch (error) {
      console.error('Error al guardar estado de caja:', error);
    }
  }

  /**
   * Carga el estado desde localStorage
   */
  private cargarEstadoDesdeStorage(): void {
    try {
      const estadoGuardado = localStorage.getItem(this.STORAGE_KEY);
      if (estadoGuardado) {
        const estado = JSON.parse(estadoGuardado) as EstadoCaja;
        
        // Convertir fechas de string a Date
        if (estado.fechaApertura) {
          estado.fechaApertura = new Date(estado.fechaApertura);
        }
        estado.ultimaActualizacion = new Date(estado.ultimaActualizacion);

        this.estadoCajaSignal.set(estado);
        this.cajaAbiertaSubject.next(estado.abierta);
      }
    } catch (error) {
      console.error('Error al cargar estado de caja:', error);
    }
  }

  /**
   * Limpia el storage
   */
  private limpiarStorage(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error al limpiar storage:', error);
    }
  }

  /**
   * Resetea el estado (útil para testing o logout)
   */
  resetearEstado(): void {
    this.estadoCajaSignal.set({
      abierta: false,
      montoInicial: 0,
      fechaApertura: null,
      usuarioApertura: null,
      totalVentasDelDia: 0,
      cantidadVentas: 0,
      ultimaActualizacion: new Date(),
      tienda: null,
      impresora: null,
      turno: null
    });
    this.cajaAbiertaSubject.next(false);
    this.limpiarStorage();
  }
}

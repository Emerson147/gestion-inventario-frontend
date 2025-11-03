import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { EstadisticasModeloResponse, FiltrosVentaRequest, ReporteVentasResponse, ResumenClienteResponse, ResumenDiarioResponse, VentaRequest, VentaResponse } from '../models/venta.model';
import { Observable, Subject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';


@Injectable({ providedIn: 'root' })
export class VentasService {

  private apiUrl = `${environment.apiUrl}api/ventas`;

  private http = inject(HttpClient);

  // Subject para notificar cuando se registra una nueva venta
  private ventaRegistrada$ = new Subject<VentaResponse>();

  // Observable público para que otros componentes se suscriban
  public onVentaRegistrada$ = this.ventaRegistrada$.asObservable();

  registrarVenta(venta: VentaRequest): Observable<VentaResponse> {
    return this.http.post<VentaResponse>(`${this.apiUrl}/registrar`, venta).pipe(
      tap(ventaRegistrada => {
        // Notificar a los suscriptores que se registró una nueva venta
        this.ventaRegistrada$.next(ventaRegistrada);
      })
    );
  }

  obtenerTodasLasVentas(): Observable<VentaResponse[]> {
    return this.http.get<VentaResponse[]>(this.apiUrl);
  }

    // Obtener todas las ventas con filtros
    obtenerVentas(filtros?: FiltrosVentaRequest): Observable<VentaResponse[]> {
      let params = new HttpParams();
      
      // Agregar filtros a los parámetros si existen
      if (filtros) {
        if (filtros.fechaDesde) {
          params = params.set('fechaInicio', this.formatDate(filtros.fechaDesde));
        }
        if (filtros.fechaHasta) {
          params = params.set('fechaFin', this.formatDate(filtros.fechaHasta));
        }
        if (filtros.estado && filtros.estado !== 'TODOS') {
          params = params.set('estado', filtros.estado);
        }
        if (filtros.termino) {
          params = params.set('termino', filtros.termino);
        }
      }
  
      // Si hay filtros específicos, usar endpoints de filtrado
      if (filtros?.termino) {
        return this.http.get<VentaResponse[]>(`${this.apiUrl}/buscar`, { params });
      } else if (filtros?.fechaDesde && filtros?.fechaHasta) {
        return this.http.get<VentaResponse[]>(`${this.apiUrl}/fechas`, { params });
      } else if (filtros?.estado && filtros?.estado !== 'TODOS') {
        return this.http.get<VentaResponse[]>(`${this.apiUrl}/estado/${filtros.estado}`);
      } else {
        return this.http.get<VentaResponse[]>(this.apiUrl);
      }
    }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  obtenerPorId(id: number): Observable<VentaResponse> {
    return this.http.get<VentaResponse>(`${this.apiUrl}/${id}`);
  }

   // Obtener venta por número
   obtenerVentaPorNumero(numeroVenta: string): Observable<VentaResponse> {
    return this.http.get<VentaResponse>(`${this.apiUrl}/numero/${numeroVenta}`);
  }

  // Obtener ventas por estado
  obtenerVentasPorEstado(estado: string): Observable<VentaResponse[]> {
    return this.http.get<VentaResponse[]>(`${this.apiUrl}/estado/${estado}`);
  }

  // Obtener ventas por cliente
  obtenerVentasPorCliente(clienteId: number): Observable<VentaResponse[]> {
    return this.http.get<VentaResponse[]>(`${this.apiUrl}/cliente/${clienteId}`);
  }

  // Obtener ventas por usuario
  obtenerVentasPorUsuario(usuarioId: number): Observable<VentaResponse[]> {
    return this.http.get<VentaResponse[]>(`${this.apiUrl}/usuario/${usuarioId}`);
  }

  // Obtener ventas por fecha
  obtenerVentasPorFecha(fecha: string): Observable<VentaResponse[]> {
    return this.http.get<VentaResponse[]>(`${this.apiUrl}/fecha`, {
      params: new HttpParams().set('fecha', fecha)
    });
  }

  // Obtener ventas entre fechas
  obtenerVentasEntreFechas(fechaInicio: string, fechaFin: string): Observable<VentaResponse[]> {
    return this.http.get<VentaResponse[]>(`${this.apiUrl}/fechas`, {
      params: new HttpParams()
        .set('fechaInicio', fechaInicio)
        .set('fechaFin', fechaFin)
    });
  }

  // Anular venta
  anularVenta(id: number, motivo: string): Observable<VentaResponse> {
    return this.http.put<VentaResponse>(`${this.apiUrl}/${id}/anular`, null, {
      params: new HttpParams().set('motivo', motivo)
    });
  }

  // Eliminar venta
  eliminarVenta(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Actualizar estado de venta
  actualizarEstadoVenta(id: number, nuevoEstado: string): Observable<VentaResponse> {
    return this.http.put<VentaResponse>(`${this.apiUrl}/${id}/estado`, null, {
      params: new HttpParams().set('nuevoEstado', nuevoEstado)
    });
  }

  // Actualizar comprobante de venta
  actualizarComprobante(id: number, serieComprobante: string, numeroComprobante: string): Observable<VentaResponse> {
    return this.http.put<VentaResponse>(`${this.apiUrl}/${id}/comprobante`, null, {
      params: new HttpParams()
        .set('serieComprobante', serieComprobante)
        .set('numeroComprobante', numeroComprobante)
    });
  }

  // Generar reporte de ventas
  generarReporteVentas(fechaInicio: string, fechaFin: string): Observable<ReporteVentasResponse> {
    return this.http.get<ReporteVentasResponse>(`${this.apiUrl}/reportes/ventas`, {
      params: new HttpParams()
        .set('fechaInicio', fechaInicio)
        .set('fechaFin', fechaFin)
    });
  }

  // Obtener resumen diario
  obtenerResumenDiario(fecha?: string): Observable<ResumenDiarioResponse> {
    let params = new HttpParams();
    if (fecha) {
      params = params.set('fecha', fecha);
    }
    return this.http.get<ResumenDiarioResponse>(`${this.apiUrl}/resumen-diario`, { params });
  }

  // Obtener ventas recientes
  obtenerVentasRecientes(cantidad = 10): Observable<VentaResponse[]> {
    return this.http.get<VentaResponse[]>(`${this.apiUrl}/recientes`, {
      params: new HttpParams().set('cantidad', cantidad.toString())
    });
  }

  // Buscar ventas
  buscarVentas(termino: string): Observable<VentaResponse[]> {
    return this.http.get<VentaResponse[]>(`${this.apiUrl}/buscar`, {
      params: new HttpParams().set('termino', termino)
    });
  }

  // Revertir venta completada
  revertirVentaCompletada(id: number, motivo: string): Observable<VentaResponse> {
    return this.http.put<VentaResponse>(`${this.apiUrl}/${id}/revertir`, null, {
      params: new HttpParams().set('motivo', motivo)
    });
  }

  // Obtener estadísticas por modelo
  obtenerEstadisticasPorModelo(fechaInicio: string, fechaFin: string): Observable<EstadisticasModeloResponse> {
    return this.http.get<EstadisticasModeloResponse>(`${this.apiUrl}/estadisticas/modelos`, {
      params: new HttpParams()
        .set('fechaInicio', fechaInicio)
        .set('fechaFin', fechaFin)
    });
  }

  // Obtener resumen de compras por cliente
  obtenerResumenComprasPorCliente(clienteId: number): Observable<ResumenClienteResponse> {
    return this.http.get<ResumenClienteResponse>(`${this.apiUrl}/clientes/${clienteId}/resumen`);
  }

  // otros métodos según endpoints...
}
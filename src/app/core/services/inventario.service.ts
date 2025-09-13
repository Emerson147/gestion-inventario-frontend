import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, of, throwError } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { catchError, tap, shareReplay, map } from 'rxjs/operators';
import { Inventario, MovimientoInventario, PagedResponse, InventarioRequest, EstadoInventario } from '../models/inventario.model';
import { InventarioStats, SugerenciaReposicion, InventarioValidationResult } from '../models/inventario-response.model';

export interface FiltrosInventario {
  producto?: string;
  almacen?: string;
  estado?: EstadoInventario;
  stockMin?: number;
  stockMax?: number;
  color?: string;
  talla?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
  soloStockCritico?: boolean;
  soloAgotados?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class InventarioService {

  private apiUrl = `${environment.apiUrl}api/inventarios`;
  private http = inject(HttpClient);

  // Cache simple en memoria
  private inventariosCache = new Map<string, { data: any; timestamp: number }>();

  /**
   * Obtener inventarios con paginación y filtros
   */
  obtenerInventarios(
    page = 0,
    size = 10,
    sortBy = 'id',
    sortDir = 'asc',
    filtros?: FiltrosInventario
  ): Observable<PagedResponse<Inventario>> {
    const cacheKey = this.generateCacheKey('inventarios', { page, size, sortBy, sortDir, filtros });

    // Verificar cache primero
    const cached = this.getFromCache<PagedResponse<Inventario>>(cacheKey);
    if (cached) {
      return of(cached);
    }

    // Si no está en cache, hacer request
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);

    // Aplicar filtros si existen
    if (filtros) {
      params = this.applyFilters(params, filtros);
    }

    return this.http.get<PagedResponse<Inventario>>(this.apiUrl, { params }).pipe(
      tap(response => {
        // Guardar en cache por 2 minutos
        this.setCache(cacheKey, response, 2);
      }),
      catchError(error => {
        console.error('Error al cargar inventarios:', error);
        return throwError(() => error);
      }),
      shareReplay(1)
    );
  }

  /**
   * Obtener inventario por ID
   */
  obtenerInventarioPorId(id: number): Observable<Inventario> {
    return this.http.get<Inventario>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error('Error al obtener inventario:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener inventario por producto
   */
  obtenerInventarioPorProducto(productoId: number): Observable<Inventario> {
    return this.http.get<Inventario>(`${this.apiUrl}/producto/${productoId}`).pipe(
      catchError(error => {
        console.error('Error al obtener inventario por producto:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Crear nuevo inventario
   */
  crearInventario(inventario: InventarioRequest): Observable<Inventario> {
    return this.http.post<Inventario>(`${this.apiUrl}/crear`, inventario).pipe(
      tap(response => {
        // Limpiar cache relacionado
        this.clearInventariosCache();
      }),
      catchError(error => {
        console.error('Error al crear inventario:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualizar inventario
   */
  actualizarInventario(id: number, inventario: InventarioRequest): Observable<Inventario> {
    return this.http.put<Inventario>(`${this.apiUrl}/${id}`, inventario).pipe(
      tap(response => {
        this.clearInventariosCache();
      }),
      catchError(error => {
        console.error('Error al actualizar inventario:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Eliminar inventario
   */
  eliminarInventario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/eliminar/${id}`).pipe(
      tap(() => {
        this.clearInventariosCache();
      }),
      catchError(error => {
        console.error('Error al eliminar inventario:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener movimientos de un inventario
   */
  obtenerMovimientos(
    inventarioId: number,
    page = 0,
    size = 10
  ): Observable<PagedResponse<MovimientoInventario>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PagedResponse<MovimientoInventario>>(
      `${this.apiUrl}/${inventarioId}/movimientos`,
      { params }
    ).pipe(
      catchError(error => {
        console.error('Error al obtener movimientos:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Registrar movimiento de inventario
   */
  registrarMovimiento(movimiento: {
    inventarioId: number;
    cantidad: number;
    tipo: 'ENTRADA' | 'SALIDA';
    descripcion: string;
    referencia?: string;
  }): Observable<MovimientoInventario> {
    return this.http.post<MovimientoInventario>(`${this.apiUrl}/movimiento`, movimiento).pipe(
      tap(() => {
        this.clearInventariosCache();
      }),
      catchError(error => {
        console.error('Error al registrar movimiento:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Búsqueda avanzada de inventarios con filtros múltiples
   */
  buscarInventarios(filtros: FiltrosInventario, page = 0, size = 20): Observable<PagedResponse<Inventario>> {
    const cacheKey = this.generateCacheKey('buscar', { filtros, page, size });

    const cached = this.getFromCache<PagedResponse<Inventario>>(cacheKey);
    if (cached) {
      return of(cached);
    }

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    params = this.applyFilters(params, filtros);

    return this.http.get<PagedResponse<Inventario>>(`${this.apiUrl}/buscar`, { params }).pipe(
      tap(response => {
        this.setCache(cacheKey, response, 1); // Cache por 1 minuto
      }),
      catchError(error => {
        console.error('Error en la búsqueda de inventarios:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener estadísticas de inventario
   */
  obtenerEstadisticas(): Observable<InventarioStats> {
    const cacheKey = 'inventario-stats';
    const cached = this.getFromCache<InventarioStats>(cacheKey);
    if (cached) {
      return of(cached);
    }

    return this.http.get<InventarioStats>(`${this.apiUrl}/estadisticas`).pipe(
      tap(response => {
        this.setCache(cacheKey, response, 5); // Cache por 5 minutos
      }),
      catchError(error => {
        console.error('Error al obtener estadísticas:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener inventarios con stock crítico
   */
  obtenerStockCritico(limite = 10): Observable<Inventario[]> {
    const params = new HttpParams().set('limite', limite.toString());

    return this.http.get<Inventario[]>(`${this.apiUrl}/stock-critico`, { params }).pipe(
      catchError(error => {
        console.error('Error al obtener stock crítico:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener productos agotados
   */
  obtenerProductosAgotados(): Observable<Inventario[]> {
    return this.http.get<Inventario[]>(`${this.apiUrl}/agotados`).pipe(
      catchError(error => {
        console.error('Error al obtener productos agotados:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener sugerencias de reposición
   */
  obtenerSugerenciasReposicion(): Observable<SugerenciaReposicion[]> {
    return this.http.get<SugerenciaReposicion[]>(`${this.apiUrl}/sugerencias-reposicion`).pipe(
      map(response => Array.isArray(response) ? response : []),
      catchError(error => {
        console.error('Error al obtener sugerencias:', error);
        return of([]);
      })
    );
  }

  /**
   * Validar inventario
   */
  validarInventario(inventarioId: number): Observable<InventarioValidationResult> {
    return this.http.post<InventarioValidationResult>(`${this.apiUrl}/${inventarioId}/validar`, {});
  }

  /**
   * Actualizar múltiples inventarios
   */
  actualizarMultiples(inventarios: { id: number; cantidad: number }[]): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizar-multiples`, { inventarios }).pipe(
      tap(() => {
        this.clearInventariosCache();
      }),
      catchError(error => {
        console.error('Error en actualización masiva:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Exportar inventarios
   */
  exportarInventarios(filtros?: FiltrosInventario, formato: 'excel' | 'csv' | 'pdf' = 'excel'): Observable<Blob> {
    let params = new HttpParams().set('formato', formato);

    if (filtros) {
      params = this.applyFilters(params, filtros);
    }

    return this.http.get(`${this.apiUrl}/exportar`, {
      params,
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Error al exportar inventarios:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Aplicar filtros a los parámetros HTTP
   */
  private applyFilters(params: HttpParams, filtros: FiltrosInventario): HttpParams {
    if (filtros.producto) {
      params = params.set('producto', filtros.producto);
    }
    if (filtros.almacen) {
      params = params.set('almacen', filtros.almacen);
    }
    if (filtros.estado) {
      params = params.set('estado', filtros.estado);
    }
    if (filtros.stockMin !== undefined) {
      params = params.set('stockMin', filtros.stockMin.toString());
    }
    if (filtros.stockMax !== undefined) {
      params = params.set('stockMax', filtros.stockMax.toString());
    }
    if (filtros.color) {
      params = params.set('color', filtros.color);
    }
    if (filtros.talla) {
      params = params.set('talla', filtros.talla);
    }
    if (filtros.fechaDesde) {
      params = params.set('fechaDesde', filtros.fechaDesde.toISOString());
    }
    if (filtros.fechaHasta) {
      params = params.set('fechaHasta', filtros.fechaHasta.toISOString());
    }
    if (filtros.soloStockCritico) {
      params = params.set('soloStockCritico', 'true');
    }
    if (filtros.soloAgotados) {
      params = params.set('soloAgotados', 'true');
    }
    return params;
  }

  /**
   * Generar clave de cache
   */
  private generateCacheKey(prefix: string, params: any): string {
    return `${prefix}-${JSON.stringify(params)}`;
  }

  /**
   * Obtener del cache
   */
  private getFromCache<T>(key: string): T | null {
    const cached = this.inventariosCache.get(key);
    if (!cached) return null;

    // Cache expira en 2 minutos
    if (Date.now() - cached.timestamp > 2 * 60 * 1000) {
      this.inventariosCache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Guardar en cache
   */
  private setCache<T>(key: string, data: T, ttlMinutes: number = 2): void {
    this.inventariosCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Limpiar cache de inventarios
   */
  private clearInventariosCache(): void {
    for (const key of this.inventariosCache.keys()) {
      if (key.startsWith('inventarios') || key.startsWith('buscar')) {
        this.inventariosCache.delete(key);
      }
    }
  }
}
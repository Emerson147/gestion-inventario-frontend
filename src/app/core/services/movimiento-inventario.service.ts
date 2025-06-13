import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, Observable } from 'rxjs';
import { MovimientoInventario, PagedResponse } from '../../core/models/movimientos-inventario.model';
import { environment } from '../../../environments/environment';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MovimientoInventarioService {

  private apiUrl = `${environment.apiUrl}api/movimientos`;

  constructor(private http: HttpClient) { }

  // Obtener todos los movimientos con búsqueda (sin filtros devuelve todos)
  getMovimientos(
    page: number = 0, 
    size: number = 100, 
    sortBy: string = 'nombre', 
    sortDir: string = 'asc'): Observable<PagedResponse<MovimientoInventario>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);

    return this.http.get<PagedResponse<MovimientoInventario>>(`${this.apiUrl}`, { params });
       
  }

  obtenerMovimientoPorId(id: number): Observable<MovimientoInventario> {
    return this.http.get<MovimientoInventario>(`${this.apiUrl}/${id}`);
  }

  createMovimiento(movimientoData: any): Observable<MovimientoInventario> {
    // El backend espera una estructura más simple que la interfaz MovimientoInventario
    return this.http.post<MovimientoInventario>(`${this.apiUrl}/registrar`, movimientoData);
  }

  updateMovimiento(movimiento: MovimientoInventario): Observable<MovimientoInventario> {
    // Nota: El backend no tiene endpoint de actualización, podrías necesitar agregarlo
    // Por ahora mantengo la estructura original
    return this.http.put<MovimientoInventario>(`${this.apiUrl}/${movimiento.id}`, movimiento);
  }

  eliminarMovimiento(id: number): Observable<void> {
    // Nota: El backend no tiene endpoint de eliminación, podrías necesitar agregarlo
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  deleteMultipleMovimientos(ids: number[]): Observable<void> {
    // Nota: El backend no tiene endpoint de eliminación múltiple, podrías necesitar agregarlo
    return this.http.post<void>(`${this.apiUrl}/delete-multiple`, { ids });
  }

  obtenerMovimientosPorInventario(inventarioId: number): Observable<PagedResponse<MovimientoInventario>> {
    return this.http.get<PagedResponse<MovimientoInventario>>(`${this.apiUrl}/inventario/${inventarioId}`)
  }

  // Método adicional para búsqueda avanzada
  buscarMovimientos(
    inventarioId?: number,
    productoId?: number,
    colorId?: number,
    tallaId?: number,
    tipo?: string,
    fechaInicio?: Date,
    fechaFin?: Date,
    page: number = 0,
    size: number = 100,
    sortBy: string = 'fechaMovimiento',
    sortDir: string = 'desc'
  ): Observable<PagedResponse<MovimientoInventario>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);

    if (inventarioId) params = params.set('inventarioId', inventarioId.toString());
    if (productoId) params = params.set('productoId', productoId.toString());
    if (colorId) params = params.set('colorId', colorId.toString());
    if (tallaId) params = params.set('tallaId', tallaId.toString());
    if (tipo) params = params.set('tipo', tipo);
    if (fechaInicio) params = params.set('fechaInicio', fechaInicio.toISOString());
    if (fechaFin) params = params.set('fechaFin', fechaFin.toISOString());

    return this.http.get<PagedResponse<MovimientoInventario>>(`${this.apiUrl}/buscar`, { params });
  }

  // Obtener tipos de movimiento disponibles
  getTiposMovimiento(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/tipos`);
  }
}
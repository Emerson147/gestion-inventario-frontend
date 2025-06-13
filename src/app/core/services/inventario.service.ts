import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { Inventario, MovimientoInventario, PagedResponse, InventarioRequest } from '../models/inventario.model';

@Injectable({
  providedIn: 'root'
})
export class InventarioService {

  private apiUrl = `${environment.apiUrl}api/inventarios`

  constructor(private http: HttpClient) {}

  obtenerInventarios(
    page: number = 0,
    size: number = 10,
    sortBy: string = 'id',
    sortDir: string = 'asc'
  ): Observable<PagedResponse<Inventario>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);
    return this.http.get<PagedResponse<Inventario>>(this.apiUrl, { params });
  }

  obtenerInventarioPorId(id: number): Observable<Inventario[]> {
    return this.http.get<Inventario[]>(`${this.apiUrl}/${id}`);
  }

  obtenerInventarioPorProducto(productoId: number): Observable<Inventario> {
    return this.http.get<Inventario>(`${this.apiUrl}/producto/${productoId}`);
  }

  crearInventario(inventario: InventarioRequest): Observable<Inventario> {
    return this.http.post<Inventario>(`${this.apiUrl}/crear`, inventario);
  }

  actualizarInventario(id: number, inventario: InventarioRequest): Observable<Inventario> {
    return this.http.put<Inventario>(`${this.apiUrl}/actualizar/${id}`, inventario);
  }

  eliminarInventario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/eliminar/${id}`);
  }

  registrarMovimiento(movimiento: MovimientoInventario): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/movimiento`, movimiento);
  }

  obtenerMovimientos(inventarioId: number, page: number = 0, size: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
      
   return this.http.get<any>(`${this.apiUrl}/${inventarioId}/movimientos`, { params });
  }

}
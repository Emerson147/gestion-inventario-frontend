import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ColorRequest, ColorResponse, PagedResponse } from '../models/colors.model';

@Injectable({
  providedIn: 'root'
})
export class ColorService {
  private apiUrl = `${environment.apiUrl}api/colores`;

  private http = inject(HttpClient);

  /**
   * Crea un nuevo color para un producto específico
   * @param productoId ID del producto al que se asociará el color
   * @param color Datos del color a crear
   */
  crearColor(productoId: number, color: ColorRequest): Observable<ColorResponse> {
    return this.http.post<ColorResponse>(`${this.apiUrl}/crear?productoId=${productoId}`, color);
  }

  /**
   * Método para traer todos los colores
   */
  getColores(
    page = 0, 
    size = 10, 
    sortBy = 'nombre', 
    sortDir = 'asc'
  ): Observable<PagedResponse<ColorResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);

    return this.http.get<PagedResponse<ColorResponse>>(this.apiUrl, { params });
  }

  /**
   * Método para obtener colores por producto
   * @param productoId - ID del producto
   * @returns Lista de colores del producto
   */
  getColoresPorProducto(productoId: number): Observable<ColorResponse[]> {
    return this.http.get<ColorResponse[]>(`${this.apiUrl}/producto/${productoId}`);
  }

  /**
   * Obtiene un color por su ID
   * @param id ID del color a obtener
   */
  getColorPorId(id: number): Observable<ColorResponse> {
    return this.http.get<ColorResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Actualiza un color existente
   * @param id ID del color a actualizar
   * @param color Nuevos datos del color
   */
  actualizarColor(id: number, color: ColorRequest): Observable<ColorResponse> {
    return this.http.put<ColorResponse>(`${this.apiUrl}/${id}`, color);
  }

  /**
   * Elimina un color por su ID
   * @param id ID del color a eliminar
   */
  eliminarColor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Elimina una talla específica de un color
   * @param colorId ID del color
   * @param tallaId ID de la talla a eliminar
   */
  eliminarTalla(colorId: number, tallaId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${colorId}/tallas/${tallaId}`);
  }

  /**
   * Obtiene todas las tallas disponibles
   */
  getTallas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/tallas`);
  }
}
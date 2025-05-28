import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';
import { Color, ColorRequest, ColorResponse, PagedResponse } from '../models/colors.model';

@Injectable({
  providedIn: 'root'
})
export class ColorService {
  private apiUrl = `${environment.apiUrl}api/colores`;

  constructor(private http: HttpClient) {}

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
    page: number = 0, 
    size: number = 10, 
    sortBy: string = 'nombre', 
    sortDir: string = 'asc'
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
  eliminarColor(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

 // En tu ColorService
  eliminarTalla(colorId: number, tallaId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${colorId}/tallas/${tallaId}`);
  }
}
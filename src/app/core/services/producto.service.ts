import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto, ProductoRequest, PagedResponse } from '../models/product.model';

// Interfaz para la respuesta de carga de imagen
interface ImageUploadResponse {
  message: string;
  imageUrl: string;
  fileName: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private apiUrl = `${environment.apiUrl}api/productos`;
  private http = inject(HttpClient);

  /**
   * Obtiene una lista paginada de productos
   * @param page Número de página (0-based)
   * @param size Tamaño de la página
   * @param sortBy Campo por el que ordenar
   * @param sortDir Dirección de ordenación (asc/desc)
   */
  getProducts(
    page = 0, 
    size = 10,
    sortBy = 'nombre',
    sortDir = 'asc'
  ): Observable<PagedResponse<Producto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);
      
    return this.http.get<PagedResponse<Producto>>(this.apiUrl, { params });
  }

  /**
   * Obtiene un producto por su ID
   * @param id ID del producto
   */
  getProductById(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crea un nuevo producto
   * @param producto Datos del producto a crear
   */
  createProduct(producto: ProductoRequest): Observable<Producto> {
    return this.http.post<Producto>(`${this.apiUrl}/crear`, producto);
  }

  /**
   * Actualiza un producto existente
   * @param id ID del producto a actualizar
   * @param producto Datos actualizados del producto
   */
  updateProduct(id: number, producto: ProductoRequest): Observable<Producto> {
    return this.http.put<Producto>(`${this.apiUrl}/actualizar/${id}`, producto);
  }

  /**
   * Elimina un producto
   * @param id ID del producto a eliminar
   */
  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/eliminar/${id}`);
  }

  /**
   * Sube una imagen para un producto
   * @param id ID del producto
   * @param formData Datos del formulario que contiene la imagen
   * @returns Respuesta con la URL de la imagen subida
   */
  uploadImage(id: number, formData: FormData): Observable<ImageUploadResponse> {
    return this.http.post<ImageUploadResponse>(
      `${this.apiUrl}/${id}/imagen`, 
      formData
    );
  }

  /**
   * Obtiene la URL completa de la imagen de un producto
   * @param producto Producto del que se quiere obtener la URL de la imagen
   * @returns URL completa de la imagen o una imagen por defecto si no hay imagen
   */
  getImageUrl(producto: Producto): string {
    if (!producto || !producto.imagen) {
      return 'assets/images/girl.jpg'; // Imagen predeterminada
    }
    return `${environment.apiUrl}/api/files/${producto.imagen}`;
  }
}
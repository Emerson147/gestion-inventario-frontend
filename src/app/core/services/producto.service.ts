import { Injectable } from '@angular/core';
import { environment } from '../../../enviroments/enviroment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto, ProductoRequest } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {

  private apiUrl = `${environment.apiUrl}api/productos`
  constructor(private http: HttpClient) {

   }

   getProducts(page: number = 0, size: number = 10): Observable<any> {

    //Asegurarse que la pagina no sea negativa
    page = Math.max(page, 0);
    //Asegurarse que el tamaño no sea negativo
    size = Math.max(size, 1);
    const params = new HttpParams()
    .set('page', page.toString())
    .set('size', size.toString());

    console.log(`🚀 ~ Solicitando pagina ${page} con ${size} productos por pagina`);
    return this.http.get<any>(`${this.apiUrl}`, { params });
   }

   getProductById(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${id}`);
   }

   createProduct(producto: ProductoRequest): Observable<Producto> {
    return this.http.post<Producto>(`${this.apiUrl}/crear`, producto);
   }

   updateProduct(id: number, producto: any): Observable<Producto> {
    return this.http.put<Producto>(`${this.apiUrl}/actualizar/${id}`, producto);
   }

   deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/eliminar/${id}`);
   }

   uploadImage(id: number, formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/imagen`, formData);
   }
}

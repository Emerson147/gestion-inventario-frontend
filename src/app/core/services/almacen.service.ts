import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, tap } from 'rxjs';
import { Almacen, AlmacenRequest, PagedResponse } from '../models/almacen.model';

@Injectable({
  providedIn: 'root'
})
export class AlmacenService {

  private apiUrl = `${environment.apiUrl}api/almacenes`;
  
  private http = inject(HttpClient);

  getAlmacenes(): Observable<PagedResponse<Almacen> | Almacen[]> {
  console.log('🌐 AlmacenService: Llamando a', this.apiUrl);
  
  return this.http.get<PagedResponse<Almacen> | Almacen[]>(this.apiUrl).pipe(
    tap(response => {
      console.log('✅ AlmacenService: Respuesta exitosa', response);
      
      // Verificar si la respuesta es un array o un objeto paginado
      if (Array.isArray(response)) {
        console.log('📊 Total elementos:', response.length);
        console.log('📦 Contenido:', response.length, 'almacenes');
      } else {
        console.log('📊 Total elementos:', response?.totalElementos);
        console.log('📦 Contenido:', response?.contenido?.length, 'almacenes');
      }
    }),
    catchError((error: HttpErrorResponse) => {
      console.error('❌ AlmacenService: Error en petición');
      console.error('🔗 URL:', this.apiUrl);
      console.error('📊 Status:', error.status);
      console.error('💬 Message:', error.message);
      console.error('🔍 Error completo:', error);
      throw error;
    })
  );
}

  getAlmacenesById(id: number): Observable<Almacen> {
    return this.http.get<Almacen>(`${this.apiUrl}/${id}`);
  }

  createAlmacenes(almacen: AlmacenRequest): Observable<Almacen> {
    return this.http.post<Almacen>(`${this.apiUrl}/crear`, almacen);
  }

  updateAlmacenes(id: number, almacen: AlmacenRequest): Observable<Almacen> {
    return this.http.put<Almacen>(`${this.apiUrl}/actualizar/${id}`, almacen);
  }

  deleteAlmacenes(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/eliminar/${id}`);
  }
}
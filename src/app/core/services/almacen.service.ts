import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Almacen, AlmacenRequest } from '../models/almacen.model';
import { PagedResponse } from '../models/paged-response.model';

@Injectable({
  providedIn: 'root'
})
export class AlmacenService {

  private apiUrl = `${environment.apiUrl}api/almacenes`;
  
  private http = inject(HttpClient);

  getAlmacenes(): Observable<PagedResponse<Almacen>> {
    return this.http.get<PagedResponse<Almacen>>(this.apiUrl);
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
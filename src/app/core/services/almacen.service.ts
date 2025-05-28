import { Injectable } from '@angular/core';
import { environment } from '../../../enviroments/enviroment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Almacen } from '../models/almacen.model';
import { AlmacenRequest } from '../models/almacen.model';

@Injectable({
  providedIn: 'root'
})
export class AlmacenService {

  private apiUrl = `${environment.apiUrl}api/almacenes`;
  
  constructor(private http: HttpClient) { }

  getAlmacenes(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
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

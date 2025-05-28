import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { VentaRequest, VentaResponse } from '../models/venta.model';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroment';

@Injectable({ providedIn: 'root' })
export class VentasService {

  private apiUrl = `${environment.apiUrl}api/ventas`;

  constructor(private http: HttpClient) {}

  registrarVenta(venta: VentaRequest): Observable<VentaResponse> {
    return this.http.post<VentaResponse>(`${this.apiUrl}/registrar`, venta);
  }

  listar(): Observable<VentaResponse[]> {
    return this.http.get<VentaResponse[]>(this.apiUrl);
  }

  obtenerPorId(id: number): Observable<VentaResponse> {
    return this.http.get<VentaResponse>(`${this.apiUrl}/${id}`);
  }

  buscar(termino: string): Observable<VentaResponse[]> {
    return this.http.get<VentaResponse[]>(`${this.apiUrl}/buscar?termino=${encodeURIComponent(termino)}`);
  }

  // otros métodos según endpoints...
}
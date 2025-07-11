import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PagoRequest, PagoResponse } from '../models/pago.model';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PagosService {
  private apiUrl = `${environment.apiUrl}api/pagos`;

  private http = inject(HttpClient);

  registrarPago(pago: PagoRequest): Observable<PagoResponse> {
    return this.http.post<PagoResponse>(`${this.apiUrl}/registrar`, pago);
  }

  listarPorVenta(ventaId: number): Observable<PagoResponse[]> {
    return this.http.get<PagoResponse[]>(`${this.apiUrl}/venta/${ventaId}`);
  }
}
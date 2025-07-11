import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Cliente } from '../models/cliente.model';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  
  private apiUrl = `${environment.apiUrl}api/clientes`;

  private http = inject(HttpClient);

  listar(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.apiUrl);
  }

  listarActivos(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.apiUrl}/activos`);
  }

  buscar(termino: string): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.apiUrl}/buscar?termino=${encodeURIComponent(termino)}`);
  }

  obtenerPorId(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/${id}`);
  }

  crear(cliente: Partial<Cliente>): Observable<Cliente> {
    return this.http.post<Cliente>(`${this.apiUrl}/crear`, cliente);
  }

  actualizar(id: number, cliente: Partial<Cliente>): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.apiUrl}/actualizar/${id}`, cliente);
  }

  desactivar(id: number) {
    return this.http.put(`${this.apiUrl}/${id}/desactivar`, {});
  }

  reactivar(id: number) {
    return this.http.put(`${this.apiUrl}/${id}/reactivar`, {});
  }

  eliminar(id: number) {
    return this.http.delete(`${this.apiUrl}/eliminar/${id}`);
  }
}
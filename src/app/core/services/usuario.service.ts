import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, UsuarioRequest } from '../models/user.model';
import { tap, catchError } from 'rxjs/operators';

// Interfaz para la respuesta paginada de usuarios
export interface PagedUserResponse {
  contenido: User[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private apiUrl = `${environment.apiUrl}api/usuarios`;

  private http = inject(HttpClient);

  /**
   * Obtiene una lista paginada de usuarios
   * @param page Número de página (0-based)
   * @param size Tamaño de la página
   * @returns Observable con la respuesta paginada de usuarios
   */
  getUsers(page = 0, size = 10): Observable<PagedUserResponse> {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('size', size.toString());
    
    const url = `${this.apiUrl}?${params.toString()}`;
    console.log('🌐 Realizando petición GET a:', url);
    
    return this.http.get<PagedUserResponse>(url).pipe(
      tap(response => {
        console.log('✅ Respuesta exitosa del servicio de usuarios:', response);
      }),
      catchError(error => {
        console.error('❌ Error en servicio de usuarios:', error);
        console.error('🔍 URL de la petición:', url);
        console.error('🔍 Configuración del environment:', { apiUrl: this.apiUrl });
        throw error;
      })
    );
  }

  /**
   * Obtiene un usuario por su ID
   * @param id ID del usuario a buscar
   * @returns Observable con los datos del usuario
   */
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crea un nuevo usuario
   * @param user Datos del usuario a crear
   * @returns Observable con el usuario creado
   */
  createUser(user: UsuarioRequest): Observable<User> {
    const userToSend = {
      ...user,
      // Aseguramos que roles sea un array
      roles: Array.isArray(user.roles) ? user.roles : [user.roles]
    };
    return this.http.post<User>(`${this.apiUrl}/crear`, userToSend);
  }

  /**
   * Actualiza un usuario existente
   * @param id ID del usuario a actualizar
   * @param user Datos actualizados del usuario
   * @returns Observable con el usuario actualizado
   */
  updateUser(id: number, user: Partial<User>): Observable<User> {
    const userToSend = {
      ...user,
      // Aseguramos que roles sea un array
      roles: user.roles ? (Array.isArray(user.roles) ? user.roles : [user.roles]) : []
    };
    return this.http.put<User>(`${this.apiUrl}/actualizar/${id}`, userToSend);
  }

  /**
   * Elimina un usuario
   * @param id ID del usuario a eliminar
   * @returns Observable que se completa cuando la operación termina
   */
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/eliminar/${id}`);
  }
}
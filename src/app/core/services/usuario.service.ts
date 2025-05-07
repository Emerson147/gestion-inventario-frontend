import { Injectable } from '@angular/core';
import {environment} from '../../../enviroments/enviroment';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {User, UsuarioRequest} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private apiUrl = `${environment.apiUrl}api/usuarios`;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  createUser(user: UsuarioRequest): Observable<User> {
    const userToSend = {
      ...user,
      roles: Array.isArray(user.roles) ? user.roles : [user.roles]
    }
    return this.http.post<User>(`${this.apiUrl}/crear`, userToSend);
  }

  updateUser(id: number, user: Partial<User>): Observable<User> {
    const userToSend = {
      ...user,
      roles: Array.isArray(user.roles) ? user.roles : [user.roles]
    }
    return this.http.put<User>(`${this.apiUrl}/actualizar/${id}`, userToSend);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/eliminar/${id}`);
  }
}

import { inject, Injectable } from '@angular/core';
import {Observable, tap} from 'rxjs';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {jwtDecode} from 'jwt-decode';
import {Router} from '@angular/router';
import {environment} from '../../../environments/environment';


interface JwtResponse {
  token: string;
  tokenType: string;
  refreshToken: string;
  id: number;
  username: string;
  email: string;
  roles: string[];
}

interface CambiarPasswordRequest {
  email: string;
  newPassword: string;
}


interface DecodedToken {
  sub: string;
  roles: string;
  exp: number;
}

interface LoginRequest {
  username: string;
  password: string;
}

interface RegistroRequest {
  username: string;
  email: string;
  password: string;
}

interface MensajeResponse {
  mensaje: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = `${environment.apiUrl}api/auth`;

  private http = inject(HttpClient);
  private router = inject(Router);

  login(loginRequest: LoginRequest): Observable<JwtResponse> {
    return this.http.post<JwtResponse>(`${this.apiUrl}/login`, loginRequest).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('refreshToken', response.refreshToken);

        // Almacenar informacion del usuario relevante
        localStorage.setItem('user', JSON.stringify({
          id: response.id,
          username: response.username,
          email: response.email,
          roles: response.roles
        }));
      })
    );
  }

  registro(registroRequest: RegistroRequest): Observable<JwtResponse> {
    return this.http.post<JwtResponse>(`${this.apiUrl}/registro`, registroRequest);
  }

  refreshToken(refreshToken: string): Observable<JwtResponse> {
    return this.http.post<JwtResponse>(`${this.apiUrl}/refresh-token`, refreshToken).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('refreshToken', response.refreshToken);
      })
    );
  }

  cambiarPassword(cambiarPasswordRequest: CambiarPasswordRequest): Observable<MensajeResponse> {
    return this.http.post<MensajeResponse>(`${this.apiUrl}/cambiar-password`, cambiarPasswordRequest);
  }

  logout(token: string): Observable<MensajeResponse> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.post<MensajeResponse>(`${this.apiUrl}/logout`, null, { headers }).pipe(
      tap(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      })
    );
  }

  validarToken(token: string): Observable<MensajeResponse> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.get<MensajeResponse>(`${this.apiUrl}/validar-token`, { headers });
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  getUserRole(): string | null {
    const token = this.getToken();
    if (token) {
      const decoded: DecodedToken = jwtDecode(token);
      return decoded.roles.replace('ROLE_', '');
    }
    return null;
  }

  // Obtener roles como array (util si un usuario puede tener varios roles)
  getUserRoles(): string[] {
    const token = this.getToken();
    if (token) {
      const decoded: DecodedToken = jwtDecode(token);
      // Separar roles si vienen como string con comas
      return decoded.roles.split(',').map(role => role.trim());
    }
    return [];
  }

  hasRole(role: string): boolean {
    const userRoles = this.getUserRoles();
    return userRoles.includes(role);
  }

  // Redireccionar según el rol del usuario
  redirectBasedOnRole(): void {
    if (this.hasRole('ROLE_ADMIN')) {
      this.router.navigate(['/admin/dashboard']);
    } else if (this.hasRole('ROLE_VENTAS')) {
      this.router.navigate(['/ventas/dashboard']);
    } else {
      // Ruta por defecto si no coincide con ningún rol específico
      this.router.navigate(['/dashboard']);
    }
  }

  // Verificar si el token está expirado
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const decoded: DecodedToken = jwtDecode(token);
      return decoded.exp * 1000 < Date.now();
    } catch (error: unknown) {
      // Si hay un error al decodificar el token, lo consideramos expirado
      console.error('Error al decodificar el token:', error);
      return true;
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken() && !this.isTokenExpired();
  }

  // Limpiar datos de sesión al cerrar sesión
  clearSession(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  // Método para logout más completo
  logoutAndRedirect(): void {
    const token = this.getToken();
    if (token) {
      this.logout(token).subscribe({
        next: () => {
          this.clearSession();
          this.router.navigate(['/login']);
        },
        error: () => {
          // En caso de error, limpiar igualmente
          this.clearSession();
          this.router.navigate(['/login']);
        }
      });
    } else {
      this.clearSession();
      this.router.navigate(['/login']);
    }
  }


  getCurrentUserRole() {
    return '';
  }
}
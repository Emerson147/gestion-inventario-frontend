import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';


export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();

  // Agregar token a la solicitud si existe
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Manejar la respuesta y los errores
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token expirado o inválido
        const refreshToken = authService.getRefreshToken();

        if (refreshToken) {
          return authService.refreshToken(refreshToken).pipe(
            switchMap((response) => {
              // Crear nueva solicitud con el nuevo token
              const newReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${response.token}`
                }
              });
              // Reenviar la solicitud con el nuevo token
              return next(newReq);
            }),
            catchError(() => {
              // Error al refrescar token, cerrar sesión
              authService.clearSession();
              router.navigate(['/login']);
              return throwError(() => error);
            })
          );
        } else {
          // No hay refresh token, redirigir a login
          authService.clearSession();
          router.navigate(['/login']);
        }
      } else if (error.status === 403) {
        // Acceso prohibido
        router.navigate(['/unauthorized']);
      }

      return throwError(() => error);
    })
  );
};

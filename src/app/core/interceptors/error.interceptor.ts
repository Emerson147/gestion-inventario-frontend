import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private messageService = inject(MessageService);
  private router = inject(Router);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Error desconocido';
        let severity: 'error' | 'warn' | 'info' = 'error';

        if (error.error instanceof ErrorEvent) {
          // Error del lado del cliente
          errorMessage = `Error de conexión: ${error.error.message}`;
        } else {
          // Error del lado del servidor
          switch (error.status) {
            case 400:
              errorMessage = this.extractErrorMessage(error) || 'Datos inválidos enviados al servidor';
              severity = 'warn';
              break;
            case 401:
              errorMessage = 'Sesión expirada. Por favor, inicie sesión nuevamente';
              this.router.navigate(['/login']);
              break;
            case 403:
              errorMessage = 'No tiene permisos para realizar esta acción';
              severity = 'warn';
              break;
            case 404:
              errorMessage = 'Recurso no encontrado';
              severity = 'warn';
              break;
            case 409:
              errorMessage = this.extractErrorMessage(error) || 'Conflicto: El recurso ya existe o está en uso';
              severity = 'warn';
              break;
            case 422:
              errorMessage = this.extractErrorMessage(error) || 'Datos de entrada inválidos';
              severity = 'warn';
              break;
            case 429:
              errorMessage = 'Demasiadas solicitudes. Intente nuevamente en unos momentos';
              severity = 'warn';
              break;
            case 500:
              errorMessage = 'Error interno del servidor. Contacte al administrador';
              break;
            case 502:
              errorMessage = 'Servicio temporalmente no disponible';
              break;
            case 503:
              errorMessage = 'Servicio en mantenimiento. Intente más tarde';
              break;
            default:
              errorMessage = `Error del servidor (${error.status}): ${error.message}`;
          }
        }

        // Solo mostrar el mensaje si no es un error 401 (ya redirigimos)
        if (error.status !== 401) {
          this.showErrorMessage(errorMessage, severity);
        }

        // Log del error para debugging
        console.error('HTTP Error:', {
          status: error.status,
          message: error.message,
          url: error.url,
          error: error.error
        });

        return throwError(() => error);
      })
    );
  }

  private extractErrorMessage(error: HttpErrorResponse): string | null {
    if (error.error && typeof error.error === 'object') {
      // Intentar extraer mensaje del backend
      if (error.error.message) {
        return error.error.message;
      }
      if (error.error.error) {
        return error.error.error;
      }
      if (error.error.details) {
        return error.error.details;
      }
      // Si es un array de errores de validación
      if (Array.isArray(error.error) && error.error.length > 0) {
        return error.error.map((err: any) => err.message || err).join(', ');
      }
    }
    return null;
  }

  private showErrorMessage(message: string, severity: 'error' | 'warn' | 'info'): void {
    this.messageService.add({
      severity,
      summary: this.getSummaryBySeverity(severity),
      detail: message,
      life: severity === 'error' ? 8000 : 5000,
      sticky: severity === 'error'
    });
  }

  private getSummaryBySeverity(severity: 'error' | 'warn' | 'info'): string {
    switch (severity) {
      case 'error':
        return 'Error';
      case 'warn':
        return 'Advertencia';
      case 'info':
        return 'Información';
      default:
        return 'Notificación';
    }
  }
}
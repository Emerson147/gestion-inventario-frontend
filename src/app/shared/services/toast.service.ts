import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Toast, ToastAction } from '../components/toast-notification/toast-notification.component';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$ = this.toastsSubject.asObservable();

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private addToast(toast: Omit<Toast, 'id'>): string {
    const id = this.generateId();
    const newToast: Toast = { ...toast, id };
    
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, newToast]);
    
    return id;
  }

  /**
   * Muestra un toast de éxito
   */
  success(title: string, message: string, options?: Partial<Toast>): string {
    return this.addToast({
      type: 'success',
      title,
      message,
      duration: 3000, // Cambiar a 3 segundos
      icon: 'pi pi-check-circle',
      ...options
    });
  }

  /**
   * Muestra un toast de error
   */
  error(title: string, message: string, options?: Partial<Toast>): string {
    return this.addToast({
      type: 'error',
      title,
      message,
      duration: 6000,
      icon: 'pi pi-times-circle',
      persistent: true, // Los errores por defecto son persistentes
      ...options
    });
  }

  /**
   * Muestra un toast de advertencia
   */
  warning(title: string, message: string, options?: Partial<Toast>): string {
    return this.addToast({
      type: 'warning',
      title,
      message,
      duration: 4000, // Cambiar a 4 segundos para advertencias
      icon: 'pi pi-exclamation-triangle',
      ...options
    });
  }

  /**
   * Muestra un toast informativo
   */
  info(title: string, message: string, options?: Partial<Toast>): string {
    return this.addToast({
      type: 'info',
      title,
      message,
      duration: 3000, // Cambiar a 3 segundos
      icon: 'pi pi-info-circle',
      ...options
    });
  }

  /**
   * Toast personalizado para agregar productos al carrito
   */
  productAdded(productName: string, quantity: number = 1): string {
    return this.success(
      '🛒 Producto Agregado',
      `${quantity}x ${productName} añadido al carrito`,
      {
        duration: 3000,
        icon: 'pi pi-shopping-cart',
        actions: [
          {
            label: 'Ver Carrito',
            action: () => {
              // Scroll al carrito o abrir modal
              const carritoElement = document.querySelector('.carrito-section');
              carritoElement?.scrollIntoView({ behavior: 'smooth' });
            }
          }
        ]
      }
    );
  }

  /**
   * Toast para ventas completadas
   */
  saleCompleted(total: string, receiptNumber: string): string {
    return this.success(
      '💰 Venta Completada',
      `Venta #${receiptNumber} por ${total} procesada exitosamente`,
      {
        duration: 6000,
        icon: 'pi pi-check-circle',
        actions: [
          {
            label: 'Imprimir',
            action: () => window.print(),
            primary: true
          },
          {
            label: 'Nueva Venta',
            action: () => {
              // Limpiar carrito y reiniciar
              window.location.reload();
            }
          }
        ]
      }
    );
  }

  /**
   * Toast para errores de stock
   */
  stockError(productName: string, availableStock: number): string {
    return this.error(
      '📦 Stock Insuficiente',
      `${productName} solo tiene ${availableStock} unidades disponibles`,
      {
        icon: 'pi pi-exclamation-triangle',
        actions: [
          {
            label: 'Ajustar Cantidad',
            action: () => {
              // Lógica para ajustar cantidad
            },
            primary: true
          }
        ]
      }
    );
  }

  /**
   * Toast para conexión con SUNAT
   */
  sunatStatus(isConnected: boolean): string {
    if (isConnected) {
      return this.success(
        '🟢 SUNAT Conectado',
        'Conexión establecida con los servicios de SUNAT',
        {
          duration: 3000,
          icon: 'pi pi-check-circle'
        }
      );
    } else {
      return this.error(
        '🔴 SUNAT Desconectado',
        'No se puede conectar con los servicios de SUNAT',
        {
          icon: 'pi pi-exclamation-triangle',
          actions: [
            {
              label: 'Reintentar',
              action: () => {
                // Lógica para reconectar
              },
              primary: true
            }
          ]
        }
      );
    }
  }

  /**
   * Elimina un toast específico
   */
  dismiss(toastId: string): void {
    const currentToasts = this.toastsSubject.value;
    const filteredToasts = currentToasts.filter(toast => toast.id !== toastId);
    this.toastsSubject.next(filteredToasts);
  }

  /**
   * Elimina todos los toasts
   */
  dismissAll(): void {
    this.toastsSubject.next([]);
  }

  /**
   * Obtiene los toasts actuales
   */
  getCurrentToasts(): Toast[] {
    return this.toastsSubject.value;
  }
}
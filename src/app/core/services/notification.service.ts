import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { BehaviorSubject, Observable } from 'rxjs';

export interface NotificationConfig {
  title?: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  sticky?: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

export interface SystemNotification extends NotificationConfig {
  id: string;
  timestamp: Date;
  read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private messageService = inject(MessageService);
  
  private notificationsSubject = new BehaviorSubject<SystemNotification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);

  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();

  /**
   * Muestra una notificación de éxito
   */
  showSuccess(message: string, title = 'Éxito', duration = 3000): void {
    this.show({
      type: 'success',
      title,
      message,
      duration
    });
  }

  /**
   * Muestra una notificación de error
   */
  showError(message: string, title = 'Error', sticky = false): void {
    this.show({
      type: 'error',
      title,
      message,
      duration: sticky ? 0 : 8000,
      sticky
    });
  }

  /**
   * Muestra una notificación de advertencia
   */
  showWarning(message: string, title = 'Advertencia', duration = 5000): void {
    this.show({
      type: 'warning',
      title,
      message,
      duration
    });
  }

  /**
   * Muestra una notificación informativa
   */
  showInfo(message: string, title = 'Información', duration = 4000): void {
    this.show({
      type: 'info',
      title,
      message,
      duration
    });
  }

  /**
   * Muestra una notificación personalizada
   */
  show(config: NotificationConfig): void {
    const {
      title = '',
      message,
      type,
      duration = 5000,
      sticky = false,
      actions = []
    } = config;

    // Mostrar en PrimeNG Toast
    this.messageService.add({
      severity: type === 'error' ? 'error' : type === 'warning' ? 'warn' : type,
      summary: title,
      detail: message,
      life: sticky ? 0 : duration,
      sticky
    });

    // Agregar a notificaciones del sistema
    this.addSystemNotification(config);
  }

  /**
   * Muestra una notificación con acciones personalizadas
   */
  showWithActions(config: NotificationConfig): void {
    const notification: SystemNotification = {
      ...config,
      id: this.generateId(),
      timestamp: new Date(),
      read: false
    };

    // Mostrar toast básico
    this.messageService.add({
      severity: config.type === 'error' ? 'error' : config.type === 'warning' ? 'warn' : config.type,
      summary: config.title || '',
      detail: config.message,
      life: config.duration || 5000
    });

    // Agregar a sistema de notificaciones
    this.addToNotifications(notification);
  }

  /**
   * Muestra notificación de stock bajo
   */
  showStockAlert(productName: string, currentStock: number, minStock: number): void {
    this.showWarning(
      `El producto "${productName}" tiene stock bajo. Stock actual: ${currentStock}, mínimo: ${minStock}`,
      'Stock Crítico'
    );
  }

  /**
   * Muestra notificación de producto agotado
   */
  showOutOfStockAlert(productName: string): void {
    this.showError(
      `El producto "${productName}" está agotado`,
      'Producto Agotado',
      true
    );
  }

  /**
   * Muestra notificación de movimiento de inventario
   */
  showInventoryMovement(type: 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'TRASLADO', productName: string, quantity: number): void {
    const typeLabels = {
      'ENTRADA': 'Entrada',
      'SALIDA': 'Salida',
      'AJUSTE': 'Ajuste',
      'TRASLADO': 'Traslado'
    };

    const typeColors = {
      'ENTRADA': 'success',
      'SALIDA': 'warning',
      'AJUSTE': 'info',
      'TRASLADO': 'info'
    } as const;

    this.show({
      type: typeColors[type],
      title: `${typeLabels[type]} de Inventario`,
      message: `${typeLabels[type]} de ${quantity} unidades de "${productName}"`,
      duration: 4000
    });
  }

  /**
   * Limpia todas las notificaciones
   */
  clearAll(): void {
    this.messageService.clear();
    this.notificationsSubject.next([]);
    this.unreadCountSubject.next(0);
  }

  /**
   * Marca una notificación como leída
   */
  markAsRead(notificationId: string): void {
    const notifications = this.notificationsSubject.value;
    const notification = notifications.find(n => n.id === notificationId);
    
    if (notification && !notification.read) {
      notification.read = true;
      this.notificationsSubject.next([...notifications]);
      this.updateUnreadCount();
    }
  }

  /**
   * Marca todas las notificaciones como leídas
   */
  markAllAsRead(): void {
    const notifications = this.notificationsSubject.value.map(n => ({ ...n, read: true }));
    this.notificationsSubject.next(notifications);
    this.unreadCountSubject.next(0);
  }

  /**
   * Elimina una notificación específica
   */
  removeNotification(notificationId: string): void {
    const notifications = this.notificationsSubject.value.filter(n => n.id !== notificationId);
    this.notificationsSubject.next(notifications);
    this.updateUnreadCount();
  }

  /**
   * Obtiene todas las notificaciones
   */
  getNotifications(): Observable<SystemNotification[]> {
    return this.notifications$;
  }

  /**
   * Obtiene el conteo de notificaciones no leídas
   */
  getUnreadCount(): Observable<number> {
    return this.unreadCount$;
  }

  private addSystemNotification(config: NotificationConfig): void {
    const notification: SystemNotification = {
      ...config,
      id: this.generateId(),
      timestamp: new Date(),
      read: false
    };

    this.addToNotifications(notification);
  }

  private addToNotifications(notification: SystemNotification): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = [notification, ...currentNotifications].slice(0, 50); // Mantener solo las últimas 50
    
    this.notificationsSubject.next(updatedNotifications);
    this.updateUnreadCount();
  }

  private updateUnreadCount(): void {
    const unreadCount = this.notificationsSubject.value.filter(n => !n.read).length;
    this.unreadCountSubject.next(unreadCount);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
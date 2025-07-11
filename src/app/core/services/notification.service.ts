import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

// Tipos específicos para los datos de notificación
export interface UserNotificationData {
  userId: number;
  userName?: string;
  email?: string;
}

export interface SecurityNotificationData {
  ipAddress?: string;
  location?: string;
  deviceInfo?: string;
}

export interface SystemNotificationData {
  component?: string;
  status?: string;
  details?: Record<string, unknown>;
}

export type NotificationData = 
  | UserNotificationData 
  | SecurityNotificationData 
  | SystemNotificationData 
  | Record<string, unknown>; // Para tipos genéricos

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'user' | 'security' | 'system';
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  data?: NotificationData;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor() {
    this.loadInitialNotifications();
  }

  private loadInitialNotifications(): void {
    // Simular notificaciones iniciales
    const initialNotifications: Notification[] = [
      {
        id: '1',
        title: 'Nuevo usuario registrado',
        message: 'Juan Pérez se ha registrado en el sistema',
        type: 'user',
        timestamp: new Date(),
        read: false,
        priority: 'medium',
        data: { 
          userId: 123,
          userName: 'Juan Pérez',
          email: 'juan.perez@example.com'
        } as UserNotificationData
      },
      {
        id: '2',
        title: 'Intento de login sospechoso',
        message: 'Se detectó un intento de login desde una ubicación inusual',
        type: 'security',
        timestamp: new Date(Date.now() - 3600000),
        read: false,
        priority: 'high',
        data: {
          ipAddress: '192.168.1.100',
          location: 'Nueva York, EE. UU.',
          deviceInfo: 'Chrome 120.0.0 / Windows 10'
        } as SecurityNotificationData
      }
    ];
    
    this.notificationsSubject.next(initialNotifications);
    this.updateUnreadCount();
  }

  addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): void {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };
    
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = [newNotification, ...currentNotifications];
    
    this.notificationsSubject.next(updatedNotifications);
    this.updateUnreadCount();
  }

  markAsRead(notificationId: string): void {
    const notifications = this.notificationsSubject.value.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    
    this.notificationsSubject.next(notifications);
    this.updateUnreadCount();
  }

  markAllAsRead(): void {
    const notifications = this.notificationsSubject.value.map(n => ({ ...n, read: true }));
    this.notificationsSubject.next(notifications);
    this.updateUnreadCount();
  }

  removeNotification(notificationId: string): void {
    const notifications = this.notificationsSubject.value.filter(n => n.id !== notificationId);
    this.notificationsSubject.next(notifications);
    this.updateUnreadCount();
  }

  private updateUnreadCount(): void {
    const unreadCount = this.notificationsSubject.value.filter(n => !n.read).length;
    this.unreadCountSubject.next(unreadCount);
  }

  getNotifications(): Observable<Notification[]> {
    return this.notifications$;
  }

  getUnreadCount(): Observable<number> {
    return this.unreadCount$;
  }
}
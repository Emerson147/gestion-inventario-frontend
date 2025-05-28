import { Injectable, signal } from '@angular/core';
import { AuthService } from './auth.service';

// Definición de los tipos de permisos
export enum PermissionType {
  VIEW = 'VIEW',
  CREATE = 'CREATE',
  EDIT = 'EDIT',
  DELETE = 'DELETE'
}

// Mapa de permisos por módulo y rol
const ROLE_PERMISSIONS: {[key: string]: {[key: string]: PermissionType[]}} = {
  'ROLE_ADMIN': {
    'productos': [PermissionType.VIEW, PermissionType.CREATE, PermissionType.EDIT, PermissionType.DELETE],
    'inventario': [PermissionType.VIEW, PermissionType.CREATE, PermissionType.EDIT, PermissionType.DELETE],
    'usuarios': [PermissionType.VIEW, PermissionType.CREATE, PermissionType.EDIT, PermissionType.DELETE],
    'colores': [PermissionType.VIEW, PermissionType.CREATE, PermissionType.EDIT, PermissionType.DELETE],
    'almacenes': [PermissionType.VIEW, PermissionType.CREATE, PermissionType.EDIT, PermissionType.DELETE],
    'ventas': [PermissionType.VIEW, PermissionType.CREATE, PermissionType.EDIT, PermissionType.DELETE],
    'dashboard': [PermissionType.VIEW],
    'clientes': [PermissionType.VIEW, PermissionType.CREATE, PermissionType.EDIT, PermissionType.DELETE],
  },
  'ROLE_VENTAS': {
    'productos': [PermissionType.VIEW],
    'inventario': [PermissionType.VIEW],
    'usuarios': [PermissionType.VIEW],
    'colores': [PermissionType.VIEW],
    'almacenes': [PermissionType.VIEW],
    'ventas': [PermissionType.VIEW, PermissionType.CREATE],
    'dashboard': [PermissionType.VIEW],
    'clientes': [PermissionType.VIEW, PermissionType.CREATE],
  }
};

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  // Signals para reactividad en Angular 19+
  private permissionsLoaded = signal(false);

  constructor(private authService: AuthService) {}

  /**
   * Verifica si el usuario tiene el permiso especificado para un módulo específico
   */
  hasPermission(module: string, permission: PermissionType): boolean {
    const userRoles = this.authService.getUserRoles();
    
    // Si no hay roles o módulo, no tiene permiso
    if (!userRoles || userRoles.length === 0 || !module) {
      return false;
    }

    // Si es un administrador, siempre tiene permisos completos
    if (userRoles.includes('ROLE_ADMIN')) {
      return true;
    }

    // Verificamos para cada rol si tiene el permiso requerido
    return userRoles.some(role => {
      const modulePermissions = ROLE_PERMISSIONS[role]?.[module.toLowerCase()];
      return modulePermissions?.includes(permission) || false;
    });
  }

  /**
   * Verifica si el usuario tiene permiso para ver un módulo específico
   */
  canView(module: string): boolean {
    return this.hasPermission(module, PermissionType.VIEW);
  }

  /**
   * Verifica si el usuario tiene permiso para crear en un módulo específico
   */
  canCreate(module: string): boolean {
    return this.hasPermission(module, PermissionType.CREATE);
  }

  /**
   * Verifica si el usuario tiene permiso para editar en un módulo específico
   */
  canEdit(module: string): boolean {
    return this.hasPermission(module, PermissionType.EDIT);
  }

  /**
   * Verifica si el usuario tiene permiso para eliminar en un módulo específico
   */
  canDelete(module: string): boolean {
    return this.hasPermission(module, PermissionType.DELETE);
  }

  /**
   * Utilidad para verificar si el usuario es un administrador
   */
  isAdmin(): boolean {
    return this.authService.hasRole('ROLE_ADMIN');
  }

  /**
   * Utilidad para verificar si el usuario es un vendedor
   */
  isVendedor(): boolean {
    return this.authService.hasRole('ROLE_VENTAS');
  }
}
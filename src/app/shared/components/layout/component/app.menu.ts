import {Component, inject, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import {AuthService} from '../../../../core/services/auth.service';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of filteredModel; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `
})
export class AppMenu implements OnInit{
    model: MenuItem[] = [];
    filteredModel: MenuItem[] = [];
    userRoles: string[] = [];

    private authService = inject(AuthService);

    ngOnInit() {
        // Obtener roles del usuario
        this.userRoles = this.authService.getUserRoles();

        //Definir el modelo completo
        this.model = [
          {
            label: 'Gestion Inventario',
            visible: this.hasRole(['ROLE_ADMIN', 'ROLE_VENTAS']),
            items: [
              { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/dashboard'] },
              { label: 'Usuarios', icon: 'pi pi-user', routerLink: ['/admin/usuarios'] },
              { label: 'Productos', icon: 'pi pi-fw pi-shopping-bag', routerLink: ['/admin/productos'] },
              { label: 'Colores y Tallas', icon: 'pi pi-fw pi-palette', routerLink: ['/admin/colores'] },  
              { label: 'Almacenes', icon: 'pi pi-fw pi-warehouse', routerLink: ['/admin/almacenes'] },
              { label: 'Inventario', icon: 'pi pi-fw pi-database', routerLink: ['/admin/inventario'] },
              { label: 'Movimientos', icon: 'pi pi-fw pi-sitemap', routerLink: ['/admin/movimientos-inventario'] }              
            ]
          },
          {
            label: 'Ventas',
            visible: this.hasRole(['ROLE_VENTAS', 'ROLE_ADMIN']),
            items: [ 
              { label: 'Clientes', icon: 'pi pi-fw pi-users', routerLink: ['/ventas/clientes'] },
              { label: 'Ventas', icon: 'pi pi-fw pi-shopping-bag', routerLink: ['/ventas/realizar-venta'] }
            ]
          }
        ];

        // Filtrar el modelo segun roles
        this.filteredModel = this.filterMenuByRoles(this.model);
    }

    // Verificar si el usuario tiene uno de los roles especificados
    hasRole(requiredRoles: string[]): boolean {
      if (!requiredRoles || requiredRoles.length === 0) {
        return true;
      }
      return this.userRoles.some(role => requiredRoles.includes(role));
    }

    // FIltrar elementos del menu basados en los roles
    filterMenuByRoles(menuItems :  MenuItem[]): MenuItem[] {
      return menuItems.filter(item => {
        // Si el elemento tiene propiedad 'visible', usarla
        if (item.visible !== undefined) {
          return item.visible;
        }

        // Si tiene subelementos, filtrarlos recursivamente
        if (item.items && item.items.length > 0) {
          item.items = this.filterMenuByRoles(item.items);
          // Mostrar este elemento solo si tiene subelementos visibles
          return item.items.length > 0;
        }

        // Por defecto, mostrar el elemento
        return true;
      })
    }
}
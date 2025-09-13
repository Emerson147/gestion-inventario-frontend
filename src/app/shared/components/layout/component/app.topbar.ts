import { Component, inject, ViewChild } from '@angular/core';
import { MenuItem, MessageService } from 'primeng/api';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '../service/layout.service';
import { ButtonModule } from 'primeng/button';
import { Popover, PopoverModule } from 'primeng/popover';
import { AuthService } from '../../../../core/services/auth.service';
import { Toast } from 'primeng/toast';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [Toast ,RouterModule, CommonModule, StyleClassModule, AppConfigurator, ButtonModule, PopoverModule],
    providers: [MessageService],
    templateUrl: './app.topbar.html'
})
export class AppTopbar {

    items!: MenuItem[];

    layoutService = inject(LayoutService);
    private messageService = inject(MessageService);
    private authService = inject(AuthService);
    private router = inject(Router);

  get userRole(): string {
    const role = this.authService.getUserRoles() ? this.authService.getUserRoles()[0] : '';

    // Convertir el rol a un formato más amigable
    if (role.includes('ROLE_ADMIN')) {
      return 'Administrador';
    } else if (role.includes('ROLE_VENTAS')) {
      return 'Ventas';
    } else {
      return role.replace('ROLE_', '');
    }
  }

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
    }


    @ViewChild('op') op!: Popover;

    members = [
        { name: 'Amy Elsner', image: 'amyelsner.png', email: 'amy@email.com', role: 'Owner' },
        { name: 'Bernardo Dominic', image: 'bernardodominic.png', email: 'bernardo@email.com', role: 'Editor' },
        { name: 'Ioni Bowcher', image: 'ionibowcher.png', email: 'ioni@email.com', role: 'Viewer' },
    ];

    toggle(event: Event) {
        this.op.toggle(event);
    }

    //Cerrar Sesion
    onLogout() {
        this.authService.logoutAndRedirect();
        this.messageService.add({
          severity: 'warn',
          summary: 'Advertencia',
          detail: 'Estas cerrando Sesion!!'
        });
    }

} 
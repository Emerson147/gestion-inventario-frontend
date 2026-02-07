import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

// Servicios
import { ToastService } from '../../../shared/services/toast.service';

// Componentes
import { ToastNotificationComponent } from '../../../shared/components/toast-notification/toast-notification.component';

/**
 * Layout simple para el módulo de ventas
 * Solo proporciona toast global y router-outlet
 * Cada componente hijo maneja su propia lógica
 */
@Component({
  selector: 'app-ventas-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ConfirmDialogModule,
    ToastNotificationComponent
  ],
  templateUrl: './ventas-layout.component.html',
  styleUrls: ['./ventas-layout.component.scss']
})
export class VentasLayoutComponent {
  // Solo servicios para toast global
  public toastService = inject(ToastService);

  /**
   * Maneja el evento de dismissal de toast
   */
  onToastDismissed(id: string): void {
    // El servicio de toast maneja esto automáticamente
  }
}

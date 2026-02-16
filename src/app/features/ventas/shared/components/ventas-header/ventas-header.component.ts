import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-ventas-header',
  standalone: true,
  imports: [CommonModule, MenuModule, ButtonModule, TooltipModule],
  templateUrl: './ventas-header.component.html',
  styleUrls: ['./ventas-header.component.scss'],
})
export class VentasHeaderComponent {
  @Input() currentUser: string = '';
  @Input() currentDateTime: string = '';
  @Input() opcionesExportacion: MenuItem[] = [];

  @Output() onExportarDashboard = new EventEmitter<void>();

  exportar() {
    this.onExportarDashboard.emit();
  }
}

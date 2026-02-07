import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportesComponent } from '../shared/components/reporte-ventas/reporte-ventas.component';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, ReportesComponent],
  template: `
    <div class="h-full w-full">
      <app-reporte-ventas></app-reporte-ventas>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      width: 100%;
    }
  `]
})
export class ReportesVentasComponent {}

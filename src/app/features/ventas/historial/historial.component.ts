import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HistorialVentasComponent } from '../shared/components/historial-ventas/historial-ventas.component';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, HistorialVentasComponent],
  template: `
    <div class="h-full w-full">
      <app-historial-ventas></app-historial-ventas>
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
export class HistorialComponent {}

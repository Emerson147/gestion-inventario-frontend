import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PosVentasComponent } from '../shared/components/pos-ventas/pos-ventas.component';

@Component({
  selector: 'app-punto-venta',
  standalone: true,
  imports: [CommonModule, PosVentasComponent],
  template: `
    <div class="h-full w-full">
      <app-pos-ventas></app-pos-ventas>
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
export class PuntoVentaComponent {}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfiguracionComponent } from '../shared/components/configuracion/configuracion.component';

@Component({
  selector: 'app-configuracion-ventas',
  standalone: true,
  imports: [CommonModule, ConfiguracionComponent],
  template: `
    <div class="h-full w-full">
      <app-configuracion></app-configuracion>
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
export class ConfiguracionVentasComponent {}

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import {
  ChartData,
  ChartOptions,
} from '../../../../../core/models/reportes.model';

@Component({
  selector: 'app-ventas-ai-section',
  standalone: true,
  imports: [CommonModule, ChartModule],
  templateUrl: './ventas-ai-section.component.html',
  styleUrls: ['./ventas-ai-section.component.scss'],
})
export class VentasAiSectionComponent {
  @Input() calculandoIA: boolean = false;
  @Input() ventasHistoricas: number[] = [];
  @Input() prediccionesIA: any = {
    mostrar: false,
    crecimiento: 0,
    ventaProyectada: 0,
  };
  @Input() dataGraficoPrediccion!: ChartData;
  @Input() opcionesGraficoDark!: ChartOptions;

  @Output() generarPrediccion = new EventEmitter<void>();

  onGenerarPrediccion() {
    this.generarPrediccion.emit();
  }

  formatearMoneda(valor: number): string {
    return (
      'S/ ' +
      (valor
        ? valor.toLocaleString('es-PE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : '0.00')
    );
  }
}

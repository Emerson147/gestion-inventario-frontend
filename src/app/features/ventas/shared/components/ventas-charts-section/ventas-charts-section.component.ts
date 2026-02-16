import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChartModule } from 'primeng/chart';
import { SelectButtonModule } from 'primeng/selectbutton';
import {
  TipoGrafico,
  ChartData,
  ChartOptions,
} from '../../../../../core/models/reportes.model';

@Component({
  selector: 'app-ventas-charts-section',
  standalone: true,
  imports: [CommonModule, FormsModule, ChartModule, SelectButtonModule],
  templateUrl: './ventas-charts-section.component.html',
  styleUrls: ['./ventas-charts-section.component.scss'],
})
export class VentasChartsSectionComponent {
  @Input() tiposGrafico: TipoGrafico[] = [];
  @Input() tipoGraficoVentas: string = 'line';
  @Output() tipoGraficoVentasChange = new EventEmitter<string>();

  @Input() datosGraficoVentas!: ChartData;
  @Input() opcionesGraficoVentas!: ChartOptions;

  @Input() progresoMeta: number = 0;
  @Input() datosGraficoMeta!: ChartData;
  @Input() opcionesGraficoCircular!: ChartOptions;
  @Input() metaMensual: number = 0;

  onTipoGraficoChange(value: string) {
    this.tipoGraficoVentas = value;
    this.tipoGraficoVentasChange.emit(value);
  }
}

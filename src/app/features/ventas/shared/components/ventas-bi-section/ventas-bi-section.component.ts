import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import {
  TopCliente,
  ChartData,
  ChartOptions,
} from '../../../../../core/models/reportes.model';

@Component({
  selector: 'app-ventas-bi-section',
  standalone: true,
  imports: [CommonModule, TableModule, ChartModule],
  templateUrl: './ventas-bi-section.component.html',
  styleUrls: ['./ventas-bi-section.component.scss'],
})
export class VentasBiSectionComponent {
  @Input() topClientes: TopCliente[] = [];
  @Input() datosDistribucionTickets!: ChartData;
  @Input() opcionesGraficoBarras!: ChartOptions;
}

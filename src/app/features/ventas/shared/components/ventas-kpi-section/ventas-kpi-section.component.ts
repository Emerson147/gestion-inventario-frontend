import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  KPIData,
  KPIFinanciero,
  KPIInventario,
} from '../../../../../core/models/reportes.model';
import { ZenMetricCardComponent } from '../../../../ventas/shared/components/zen-metric-card/zen-metric-card.component';

@Component({
  selector: 'app-ventas-kpi-section',
  standalone: true,
  imports: [CommonModule, ZenMetricCardComponent],
  templateUrl: './ventas-kpi-section.component.html',
  styleUrls: ['./ventas-kpi-section.component.scss'],
})
export class VentasKpiSectionComponent {
  @Input() kpis!: KPIData;
  @Input() kpisFinancieros!: KPIFinanciero;
  @Input() kpisInventario!: KPIInventario;
}

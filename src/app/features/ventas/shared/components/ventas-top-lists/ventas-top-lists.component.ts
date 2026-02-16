import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';
import {
  TopProducto,
  TopVendedor,
} from '../../../../../core/models/reportes.model';

@Component({
  selector: 'app-ventas-top-lists',
  standalone: true,
  imports: [CommonModule, TableModule, TooltipModule, ButtonModule],
  templateUrl: './ventas-top-lists.component.html',
  styleUrls: ['./ventas-top-lists.component.scss'],
})
export class VentasTopListsComponent {
  @Input() topProductos: TopProducto[] = [];
  @Input() topVendedores: TopVendedor[] = [];
}

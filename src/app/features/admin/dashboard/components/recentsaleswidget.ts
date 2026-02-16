import { Component, OnInit, inject } from '@angular/core';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { MenuModule } from 'primeng/menu';
import { TagModule } from 'primeng/tag';
import { DashboardService } from '../../../../core/services/dashboard.service';

interface Sale {
  id: string;
  product: string;
  customer: string;
  category: string;
  price: number;
  quantity: number;
  total: number;
  status: 'completed' | 'pending' | 'processing' | 'cancelled';
  date: string;
  time: string;
}

@Component({
  standalone: true,
  selector: 'app-recent-sales-widget',
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    RippleModule,
    MenuModule,
    TagModule,
  ],
  template: ` <div
    class="rounded-[2rem] bg-surface-50 dark:bg-surface-950 border border-surface-200 dark:border-surface-800 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full"
  >
    <!-- Header Section -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h2
          class="font-bold text-xl text-surface-900 dark:text-surface-0 mb-1 flex items-center gap-2"
        >
          <span
            class="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400"
          >
            <i class="pi pi-shopping-cart text-sm"></i>
          </span>
          Ventas Recientes
          <span
            class="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/30 rounded-full"
          >
            {{ sales.length }}
          </span>
        </h2>
        <p class="text-sm text-surface-500 dark:text-surface-400 ml-10">
          Últimas transacciones realizadas
        </p>
      </div>
      <div>
        <button
          pButton
          type="button"
          icon="pi pi-ellipsis-v"
          class="p-button-rounded p-button-text p-button-secondary hover:bg-surface-100 dark:hover:bg-surface-800"
          (click)="menu.toggle($event)"
        >
          <span class="sr-only">Mostrar opciones</span>
        </button>
        <p-menu #menu [popup]="true" [model]="menuItems"></p-menu>
      </div>
    </div>

    <!-- Sales Table (Zen List) -->
    <div
      class="bg-white dark:bg-surface-900 rounded-[1.5rem] border border-surface-100 dark:border-surface-800 overflow-hidden shadow-sm"
    >
      <p-table
        [value]="sales"
        [paginator]="true"
        [rows]="5"
        [rowsPerPageOptions]="[5, 10, 20]"
        [showCurrentPageReport]="false"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} ventas"
        responsiveLayout="scroll"
        styleClass="p-datatable-sm p-datatable-gridlines-none"
      >
        <ng-template pTemplate="header">
          <tr class="border-b border-surface-100 dark:border-surface-800">
            <th class="text-left px-6 py-4 bg-transparent">
              <span
                class="text-xs font-bold text-surface-500 uppercase tracking-wider"
                >ID</span
              >
            </th>
            <th class="text-left px-6 py-4 bg-transparent">
              <span
                class="text-xs font-bold text-surface-500 uppercase tracking-wider"
                >Producto</span
              >
            </th>
            <th class="text-left px-6 py-4 bg-transparent hidden md:table-cell">
              <span
                class="text-xs font-bold text-surface-500 uppercase tracking-wider"
                >Cliente</span
              >
            </th>
            <th class="text-right px-6 py-4 bg-transparent">
              <span
                class="text-xs font-bold text-surface-500 uppercase tracking-wider"
                >Total</span
              >
            </th>
            <th class="text-center px-6 py-4 bg-transparent">
              <span
                class="text-xs font-bold text-surface-500 uppercase tracking-wider"
                >Estado</span
              >
            </th>
          </tr>
        </ng-template>

        <ng-template pTemplate="body" let-sale>
          <tr
            class="group hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors border-b border-surface-50 dark:border-surface-800/50 last:border-0"
          >
            <!-- ID -->
            <td class="px-6 py-4">
              <span
                class="font-mono text-xs text-surface-500 bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded-md"
              >
                {{ sale.id }}
              </span>
            </td>

            <!-- Product -->
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div
                  class="w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center shrink-0"
                >
                  <i class="pi pi-box text-surface-500 text-sm"></i>
                </div>
                <div class="flex flex-col">
                  <span
                    class="font-semibold text-sm text-surface-900 dark:text-surface-100 truncate max-w-[150px]"
                    title="{{ sale.product }}"
                    >{{ sale.product }}</span
                  >
                  <span class="text-[10px] text-surface-500">{{
                    sale.category
                  }}</span>
                </div>
              </div>
            </td>

            <!-- Customer -->
            <td class="px-6 py-4 hidden md:table-cell">
              <span class="text-sm text-surface-600 dark:text-surface-300">{{
                sale.customer
              }}</span>
            </td>

            <!-- Total -->
            <td class="px-6 py-4 text-right">
              <span class="font-bold text-surface-900 dark:text-surface-100">
                S/. {{ sale.total | number: '1.2-2' }}
              </span>
            </td>

            <!-- Status -->
            <td class="px-6 py-4 text-center">
              <span
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                [ngClass]="{
                  'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400':
                    sale.status === 'completed',
                  'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400':
                    sale.status === 'pending',
                  'bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400':
                    sale.status === 'processing',
                  'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400':
                    sale.status === 'cancelled',
                }"
              >
                <span
                  class="w-1.5 h-1.5 rounded-full"
                  [ngClass]="{
                    'bg-emerald-500': sale.status === 'completed',
                    'bg-amber-500': sale.status === 'pending',
                    'bg-sky-500': sale.status === 'processing',
                    'bg-rose-500': sale.status === 'cancelled',
                  }"
                ></span>
                {{ getStatusLabel(sale.status) }}
              </span>
            </td>
          </tr>
        </ng-template>

        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="5" class="text-center py-12">
              <div class="flex flex-col items-center gap-3">
                <div
                  class="w-12 h-12 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center"
                >
                  <i class="pi pi-inbox text-surface-400 text-xl"></i>
                </div>
                <span class="text-surface-500 font-medium"
                  >No hay ventas recientes</span
                >
              </div>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  </div>`,
})
export class RecentSalesWidget implements OnInit {
  sales: Sale[] = [];

  menuItems = [
    { label: 'Exportar a Excel', icon: 'pi pi-fw pi-file-excel' },
    { label: 'Exportar a PDF', icon: 'pi pi-fw pi-file-pdf' },
    {
      label: 'Actualizar',
      icon: 'pi pi-fw pi-refresh',
      command: () => this.loadSales(),
    },
    { separator: true },
    { label: 'Ver Todas las Ventas', icon: 'pi pi-fw pi-external-link' },
  ];

  private dashboardService = inject(DashboardService);

  ngOnInit() {
    this.loadSales();
  }

  loadSales() {
    this.dashboardService.getVentasRecientes().subscribe((ventas) => {
      this.sales = ventas.map((venta) => this.mapVentaToSale(venta));
    });
  }

  private mapVentaToSale(venta: any): Sale {
    const detalles = venta.detalles || [];
    const primerProducto = detalles[0]?.producto;
    const nombreProducto = primerProducto?.nombre || 'Venta General';
    const cantidadOtros = detalles.length > 1 ? ` +${detalles.length - 1}` : '';
    const cantidadTotal = detalles.reduce(
      (acc: number, d: any) => acc + d.cantidad,
      0,
    );

    // Parsear fecha
    const fechaObj = new Date(venta.fechaCreacion || venta.fecha || new Date());

    // Mapear estado
    let status: Sale['status'] = 'completed';
    const estadoNormalized = (venta.estado || '').toUpperCase();
    if (estadoNormalized === 'PENDIENTE') status = 'pending';
    else if (estadoNormalized === 'ANULADA') status = 'cancelled';
    else if (estadoNormalized === 'PROCESANDO') status = 'processing';

    // Categoría (usamos marca como proxy)
    const categoria =
      primerProducto?.marca ||
      (primerProducto as any)?.categoria?.nombre ||
      'General';

    return {
      id: venta.numeroVenta || `#${venta.id}`,
      product: nombreProducto + cantidadOtros,
      customer:
        `${venta.cliente?.nombres || ''} ${venta.cliente?.apellidos || ''}`.trim() ||
        'Cliente General',
      category: categoria,
      price: venta.total / (cantidadTotal || 1), // Precio promedio aprox
      quantity: cantidadTotal,
      total: venta.total,
      status: status,
      date: fechaObj.toLocaleDateString(),
      time: fechaObj.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      completed: 'Completada',
      pending: 'Pendiente',
      processing: 'Procesando',
      cancelled: 'Anulada',
    };
    return labels[status] || status;
  }

  getStatusSeverity(status: string): 'success' | 'warning' | 'info' | 'danger' {
    const severities: {
      [key: string]: 'success' | 'warning' | 'info' | 'danger';
    } = {
      completed: 'success',
      pending: 'warning',
      processing: 'info',
      cancelled: 'danger',
    };
    return severities[status] || 'info';
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      completed: 'pi pi-check-circle',
      pending: 'pi pi-clock',
      processing: 'pi pi-spin pi-spinner',
      cancelled: 'pi pi-times-circle',
    };
    return icons[status] || 'pi pi-info-circle';
  }

  getTotalSales(): number {
    return this.sales.length;
  }

  getTotalRevenue(): number {
    return this.sales.reduce((sum, sale) => sum + sale.total, 0);
  }

  getAverageTicket(): number {
    return this.getTotalSales() > 0
      ? this.getTotalRevenue() / this.getTotalSales()
      : 0;
  }
}

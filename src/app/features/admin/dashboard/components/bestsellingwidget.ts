import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { DashboardService } from '../../../../core/services/dashboard.service';

interface BestSeller {
  name: string;
  category: string;
  quantity: number;
  total: number;
  percentage: number;
  color: string;
  icon: string;
}

@Component({
  standalone: true,
  selector: 'app-best-selling-widget',
  imports: [CommonModule, ButtonModule, MenuModule],
  template: ` <div
    class="rounded-[2rem] bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full"
  >
    <!-- Header Section -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h2
          class="font-bold text-xl text-surface-900 dark:text-surface-0 mb-1 flex items-center gap-2"
        >
          <span
            class="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400"
          >
            <i class="pi pi-star-fill text-sm"></i>
          </span>
          Productos Top
        </h2>
        <p class="text-sm text-surface-500 dark:text-surface-400 ml-10">
          Mejor rendimiento
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
        <p-menu #menu [popup]="true" [model]="items"></p-menu>
      </div>
    </div>

    <!-- Products List -->
    <ul class="list-none p-0 m-0 space-y-3">
      <li
        *ngFor="let product of products"
        class="bg-white dark:bg-surface-900 p-4 rounded-2xl border border-surface-100 dark:border-surface-800 hover:border-surface-300 dark:hover:border-surface-600 transition-all duration-200 group shadow-sm"
      >
        <div
          class="flex flex-col md:flex-row md:items-center md:justify-between gap-3"
        >
          <div class="flex items-center gap-3 flex-1 overflow-hidden">
            <!-- Dynamic Icon Container -->
            <div
              [ngClass]="getIconBgClass(product.color)"
              class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"
            >
              <i
                [class]="product.icon"
                [ngClass]="getIconColorClass(product.color)"
                class="text-lg"
              ></i>
            </div>
            <div class="truncate">
              <span
                class="text-surface-900 dark:text-surface-100 font-semibold text-sm block truncate"
                title="{{ product.name }}"
                >{{ product.name }}</span
              >
              <div class="flex items-center gap-1.5 mt-0.5">
                <span
                  class="text-xs text-surface-500 bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 rounded"
                  >{{ product.category }}</span
                >
              </div>
            </div>
          </div>
          <div class="flex items-center gap-4 shrink-0">
            <div
              class="bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden h-2 w-24 lg:w-32"
            >
              <div
                [ngClass]="getBarClass(product.color)"
                class="h-full rounded-full shadow-sm transition-all duration-1000"
                [style.width.%]="product.percentage"
              ></div>
            </div>
            <div class="text-right w-[45px]">
              <span
                [ngClass]="getTextColorClass(product.color)"
                class="font-bold text-sm"
                >{{ product.percentage | number: '1.0-0' }}%</span
              >
            </div>
          </div>
        </div>
      </li>

      <!-- Empty State -->
      <li *ngIf="products.length === 0" class="text-center py-8">
        <div class="flex flex-col items-center gap-3">
          <div
            class="w-12 h-12 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center"
          >
            <i class="pi pi-chart-bar text-surface-400 text-xl"></i>
          </div>
          <span class="text-surface-500 font-medium text-sm"
            >Sin datos de ventas</span
          >
        </div>
      </li>
    </ul>

    <!-- Footer -->
    <div
      class="mt-6 pt-4 border-t border-surface-200 dark:border-surface-800 flex justify-between items-center"
    >
      <span class="text-xs text-surface-500 flex items-center gap-1">
        <i class="pi pi-check-circle text-emerald-500"></i>
        Actualizado hoy
      </span>
      <button
        pButton
        label="Ver Todos"
        icon="pi pi-arrow-right"
        iconPos="right"
        class="p-button-sm p-button-text p-button-secondary text-xs"
      ></button>
    </div>
  </div>`,
})
export class BestSellingWidget implements OnInit {
  products: BestSeller[] = [];
  private dashboardService = inject(DashboardService);

  // Zen Colors Palette
  private colors = ['orange', 'cyan', 'pink', 'green', 'purple', 'teal'];
  private icons = [
    'pi-shopping-bag',
    'pi-palette',
    'pi-star',
    'pi-book',
    'pi-mobile',
    'pi-gift',
  ];

  items = [
    {
      label: 'Actualizar',
      icon: 'pi pi-fw pi-refresh',
      command: () => this.loadData(),
    },
    { label: 'Exportar', icon: 'pi pi-fw pi-download' },
  ];

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.dashboardService.getProductosMasVendidos().subscribe((data) => {
      if (!data || data.length === 0) {
        this.products = [];
        return;
      }

      const totalQuantity = data.reduce((sum, item) => sum + item.cantidad, 0);

      this.products = data.map((item, index) => {
        const color = this.colors[index % this.colors.length];
        const icon = this.icons[index % this.icons.length];
        // Evitar división por cero
        const percentage =
          totalQuantity > 0 ? (item.cantidad / totalQuantity) * 100 : 0;

        return {
          name: item.nombre,
          category: item.categoria,
          quantity: item.cantidad,
          total: item.total,
          percentage: percentage,
          color: color,
          icon: `pi ${icon}`,
        };
      });
    });
  }

  // Helper methods for dynamic styling based on color name
  getIconBgClass(color: string): string {
    return `bg-gradient-to-br from-${color}-100 to-${color}-200 dark:from-${color}-900 dark:to-${color}-800`;
  }

  getIconColorClass(color: string): string {
    return `text-${color}-600 dark:text-${color}-400`;
  }

  getBarClass(color: string): string {
    return `bg-gradient-to-r from-${color}-500 to-${color}-600`;
  }

  getTextColorClass(color: string): string {
    return `text-${color}-600 dark:text-${color}-400`;
  }
}

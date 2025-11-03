import { Component, OnInit } from '@angular/core';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { MenuModule } from 'primeng/menu';
import { TagModule } from 'primeng/tag';

interface Sale {
    id: string;
    product: string;
    customer: string;
    category: string;
    price: number;
    quantity: number;
    total: number;
    status: 'completed' | 'pending' | 'processing';
    date: string;
    time: string;
}

@Component({
    standalone: true,
    selector: 'app-recent-sales-widget',
    imports: [CommonModule, TableModule, ButtonModule, RippleModule, MenuModule, TagModule],
    template: `
    <div class="card hover:shadow-xl transition-all duration-300 border-l-4 border-green-500 !mb-8">
        <!-- Header Section -->
        <div class="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
            <div>
                <h2 class="font-bold text-2xl text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
                    <i class="pi pi-shopping-cart text-green-500"></i>
                    Ventas Recientes
                    <span class="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-green-500 rounded-full">
                        {{sales.length}}
                    </span>
                </h2>
                <p class="text-sm text-gray-500">Últimas transacciones realizadas</p>
            </div>
            <div>
                <button 
                    pButton 
                    type="button" 
                    icon="pi pi-ellipsis-v" 
                    class="p-button-rounded p-button-text p-button-plain hover:bg-gray-100 dark:hover:bg-gray-700" 
                    (click)="menu.toggle($event)">
                    <span class="sr-only">Mostrar opciones</span>
                </button>
                <p-menu #menu [popup]="true" [model]="menuItems"></p-menu>
            </div>
        </div>

        <!-- Sales Table -->
        <div class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <p-table 
                [value]="sales" 
                [paginator]="true" 
                [rows]="5" 
                [rowsPerPageOptions]="[5, 10, 20]"
                [showCurrentPageReport]="true"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} ventas"
                responsiveLayout="scroll"
                styleClass="p-datatable-sm">
                
                <ng-template pTemplate="header">
                    <tr class="bg-gray-50 dark:bg-gray-800">
                        <th class="text-left px-4 py-3">
                            <span class="font-semibold text-gray-700 dark:text-gray-300">ID</span>
                        </th>
                        <th class="text-left px-4 py-3">
                            <span class="font-semibold text-gray-700 dark:text-gray-300">Producto</span>
                        </th>
                        <th class="text-left px-4 py-3">
                            <span class="font-semibold text-gray-700 dark:text-gray-300">Cliente</span>
                        </th>
                        <th class="text-left px-4 py-3">
                            <span class="font-semibold text-gray-700 dark:text-gray-300">Categoría</span>
                        </th>
                        <th class="text-right px-4 py-3">
                            <span class="font-semibold text-gray-700 dark:text-gray-300">Cantidad</span>
                        </th>
                        <th class="text-right px-4 py-3">
                            <span class="font-semibold text-gray-700 dark:text-gray-300">Total</span>
                        </th>
                        <th class="text-center px-4 py-3">
                            <span class="font-semibold text-gray-700 dark:text-gray-300">Estado</span>
                        </th>
                        <th class="text-center px-4 py-3">
                            <span class="font-semibold text-gray-700 dark:text-gray-300">Acciones</span>
                        </th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-sale>
                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-700">
                        <!-- ID -->
                        <td class="px-4 py-3">
                            <span class="text-xs font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                {{sale.id}}
                            </span>
                        </td>

                        <!-- Product -->
                        <td class="px-4 py-3">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center shrink-0">
                                    <i class="pi pi-box text-blue-600 dark:text-blue-400"></i>
                                </div>
                                <div>
                                    <div class="font-semibold text-gray-900 dark:text-gray-100">{{sale.product}}</div>
                                    <div class="text-xs text-gray-500 flex items-center gap-1">
                                        <i class="pi pi-clock text-xs"></i>
                                        {{sale.time}}
                                    </div>
                                </div>
                            </div>
                        </td>

                        <!-- Customer -->
                        <td class="px-4 py-3">
                            <div class="flex items-center gap-2">
                                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 flex items-center justify-center">
                                    <i class="pi pi-user text-sm text-purple-600 dark:text-purple-400"></i>
                                </div>
                                <span class="text-gray-700 dark:text-gray-300">{{sale.customer}}</span>
                            </div>
                        </td>

                        <!-- Category -->
                        <td class="px-4 py-3">
                            <span class="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                <i class="pi pi-tag text-xs"></i>
                                {{sale.category}}
                            </span>
                        </td>

                        <!-- Quantity -->
                        <td class="px-4 py-3 text-right">
                            <span class="font-semibold text-gray-900 dark:text-gray-100">{{sale.quantity}}</span>
                            <span class="text-xs text-gray-500 ml-1">unid.</span>
                        </td>

                        <!-- Total -->
                        <td class="px-4 py-3 text-right">
                            <span class="font-bold text-green-600 dark:text-green-400 text-lg">
                                S/. {{sale.total | number:'1.2-2'}}
                            </span>
                        </td>

                        <!-- Status -->
                        <td class="px-4 py-3 text-center">
                            <p-tag 
                                [value]="getStatusLabel(sale.status)" 
                                [severity]="getStatusSeverity(sale.status)"
                                [icon]="getStatusIcon(sale.status)"
                                styleClass="text-xs">
                            </p-tag>
                        </td>

                        <!-- Actions -->
                        <td class="px-4 py-3 text-center">
                            <div class="flex items-center justify-center gap-2">
                                <button 
                                    pButton 
                                    pRipple 
                                    type="button" 
                                    icon="pi pi-eye" 
                                    class="p-button-rounded p-button-text p-button-sm hover:bg-blue-50 dark:hover:bg-blue-900"
                                    pTooltip="Ver detalles"
                                    tooltipPosition="top">
                                </button>
                                <button 
                                    pButton 
                                    pRipple 
                                    type="button" 
                                    icon="pi pi-print" 
                                    class="p-button-rounded p-button-text p-button-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                                    pTooltip="Imprimir ticket"
                                    tooltipPosition="top">
                                </button>
                            </div>
                        </td>
                    </tr>
                </ng-template>

                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td colspan="8" class="text-center py-8">
                            <div class="flex flex-col items-center gap-3">
                                <i class="pi pi-inbox text-5xl text-gray-300"></i>
                                <span class="text-gray-500">No hay ventas recientes</span>
                            </div>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <!-- Footer Statistics -->
        <div class="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{getTotalSales()}}</div>
                <div class="text-xs text-gray-500 mt-1">Total de Ventas</div>
            </div>
            <div class="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                <div class="text-2xl font-bold text-green-600 dark:text-green-400">S/. {{getTotalRevenue() | number:'1.2-2'}}</div>
                <div class="text-xs text-gray-500 mt-1">Ingresos Totales</div>
            </div>
            <div class="text-center p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{getAverageTicket() | number:'1.2-2'}}</div>
                <div class="text-xs text-gray-500 mt-1">Ticket Promedio</div>
            </div>
        </div>
    </div>`
})
export class RecentSalesWidget implements OnInit {
    sales: Sale[] = [];
    
    menuItems = [
        { label: 'Exportar a Excel', icon: 'pi pi-fw pi-file-excel' },
        { label: 'Exportar a PDF', icon: 'pi pi-fw pi-file-pdf' },
        { label: 'Actualizar', icon: 'pi pi-fw pi-refresh' },
        { separator: true },
        { label: 'Ver Todas las Ventas', icon: 'pi pi-fw pi-external-link' }
    ];

    ngOnInit() {
        this.loadSampleSales();
    }

    loadSampleSales() {
        this.sales = [
            {
                id: '#VTA-001',
                product: 'Laptop HP Pavilion',
                customer: 'Juan Pérez',
                category: 'Electrónica',
                price: 2499.00,
                quantity: 1,
                total: 2499.00,
                status: 'completed',
                date: '2025-10-19',
                time: '14:30'
            },
            {
                id: '#VTA-002',
                product: 'Mouse Logitech',
                customer: 'María García',
                category: 'Accesorios',
                price: 45.00,
                quantity: 2,
                total: 90.00,
                status: 'completed',
                date: '2025-10-19',
                time: '14:15'
            },
            {
                id: '#VTA-003',
                product: 'Teclado Mecánico',
                customer: 'Carlos Rodríguez',
                category: 'Accesorios',
                price: 189.00,
                quantity: 1,
                total: 189.00,
                status: 'processing',
                date: '2025-10-19',
                time: '13:45'
            },
            {
                id: '#VTA-004',
                product: 'Monitor Samsung 27"',
                customer: 'Ana López',
                category: 'Electrónica',
                price: 899.00,
                quantity: 1,
                total: 899.00,
                status: 'completed',
                date: '2025-10-19',
                time: '13:20'
            },
            {
                id: '#VTA-005',
                product: 'Auriculares Sony',
                customer: 'Luis Martínez',
                category: 'Audio',
                price: 159.00,
                quantity: 1,
                total: 159.00,
                status: 'pending',
                date: '2025-10-19',
                time: '12:50'
            },
            {
                id: '#VTA-006',
                product: 'Webcam Logitech HD',
                customer: 'Patricia Sánchez',
                category: 'Accesorios',
                price: 129.00,
                quantity: 1,
                total: 129.00,
                status: 'completed',
                date: '2025-10-19',
                time: '12:30'
            },
            {
                id: '#VTA-007',
                product: 'SSD Kingston 500GB',
                customer: 'Roberto Castro',
                category: 'Almacenamiento',
                price: 249.00,
                quantity: 2,
                total: 498.00,
                status: 'completed',
                date: '2025-10-19',
                time: '11:45'
            },
            {
                id: '#VTA-008',
                product: 'Cable HDMI 2.1',
                customer: 'Sandra Torres',
                category: 'Cables',
                price: 35.00,
                quantity: 3,
                total: 105.00,
                status: 'completed',
                date: '2025-10-19',
                time: '11:20'
            }
        ];
    }

    getStatusLabel(status: string): string {
        const labels: { [key: string]: string } = {
            'completed': 'Completada',
            'pending': 'Pendiente',
            'processing': 'Procesando'
        };
        return labels[status] || status;
    }

    getStatusSeverity(status: string): 'success' | 'warning' | 'info' | 'danger' {
        const severities: { [key: string]: 'success' | 'warning' | 'info' | 'danger' } = {
            'completed': 'success',
            'pending': 'warning',
            'processing': 'info'
        };
        return severities[status] || 'info';
    }

    getStatusIcon(status: string): string {
        const icons: { [key: string]: string } = {
            'completed': 'pi pi-check-circle',
            'pending': 'pi pi-clock',
            'processing': 'pi pi-spin pi-spinner'
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
        return this.getTotalSales() > 0 ? this.getTotalRevenue() / this.getTotalSales() : 0;
    }
}

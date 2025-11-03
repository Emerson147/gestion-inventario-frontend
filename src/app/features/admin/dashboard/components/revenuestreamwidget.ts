import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { debounceTime, Subscription } from 'rxjs';
import { LayoutService } from '../../../../shared/components/layout/service/layout.service';

interface ChartDataset {
    type: string;
    label: string;
    backgroundColor: string;
    data: number[];
    barThickness?: number;
    borderRadius?: {
        topLeft: number;
        topRight: number;
        bottomLeft: number;
        bottomRight: number;
    };
    borderSkipped?: boolean;
}

interface ChartData {
    labels: string[];
    datasets: ChartDataset[];
}

interface ChartOptions {
    maintainAspectRatio: boolean;
    aspectRatio: number;
    plugins: {
        legend: {
            labels: {
                color: string;
                font?: {
                    weight: string;
                    size: number;
                };
                padding: number;
                usePointStyle: boolean;
            };
        };
        tooltip: {
            backgroundColor: string;
            titleColor: string;
            bodyColor: string;
            borderColor: string;
            borderWidth: number;
            padding: number;
            displayColors: boolean;
        };
    };
    scales: {
        x: {
            stacked: boolean;
            ticks: {
                color: string;
                font?: {
                    size: number;
                    weight: string;
                };
            };
            grid: {
                color: string;
                borderColor: string;
            };
        };
        y: {
            stacked: boolean;
            ticks: {
                color: string;
                callback?: (value: any) => string;
            };
            grid: {
                color: string;
                borderColor: string;
                drawTicks: boolean;
            };
        };
    };
}

@Component({
    standalone: true,
    selector: 'app-revenue-stream-widget',
    imports: [CommonModule, ChartModule, ButtonModule, MenuModule],
    template: `
    <div class="card hover:shadow-xl transition-all duration-300 border-l-4 border-indigo-500 !mb-8">
        <!-- Header Section -->
        <div class="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
            <div>
                <h2 class="font-bold text-2xl text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
                    <i class="pi pi-chart-bar text-indigo-500"></i>
                    Flujo de Ingresos
                </h2>
                <p class="text-sm text-gray-500">Análisis trimestral por categoría</p>
            </div>
            <div class="flex items-center gap-2">
                <div class="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
                    <i class="pi pi-calendar text-gray-500 text-sm"></i>
                    <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">2025</span>
                </div>
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

        <!-- Statistics Summary -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <!-- Total Revenue -->
            <div class="p-4 rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 border border-indigo-200 dark:border-indigo-700">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Total</span>
                    <i class="pi pi-chart-line text-indigo-500"></i>
                </div>
                <div class="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                    S/. {{getTotalRevenue() | number:'1.0-0'}}
                </div>
                <div class="text-xs text-indigo-600 dark:text-indigo-400 mt-1 flex items-center gap-1">
                    <i class="pi pi-arrow-up text-xs"></i>
                    <span>+15.3% vs año anterior</span>
                </div>
            </div>

            <!-- Subscriptions -->
            <div class="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border border-blue-200 dark:border-blue-700">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Suscripciones</span>
                    <i class="pi pi-users text-blue-500"></i>
                </div>
                <div class="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    S/. {{getDatasetTotal(0) | number:'1.0-0'}}
                </div>
                <div class="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    {{getDatasetPercentage(0)}}% del total
                </div>
            </div>

            <!-- Advertising -->
            <div class="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border border-purple-200 dark:border-purple-700">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">Publicidad</span>
                    <i class="pi pi-megaphone text-purple-500"></i>
                </div>
                <div class="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    S/. {{getDatasetTotal(1) | number:'1.0-0'}}
                </div>
                <div class="text-xs text-purple-600 dark:text-purple-400 mt-1">
                    {{getDatasetPercentage(1)}}% del total
                </div>
            </div>

            <!-- Affiliate -->
            <div class="p-4 rounded-lg bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/30 dark:to-pink-800/30 border border-pink-200 dark:border-pink-700">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-semibold text-pink-600 dark:text-pink-400 uppercase tracking-wide">Afiliados</span>
                    <i class="pi pi-link text-pink-500"></i>
                </div>
                <div class="text-2xl font-bold text-pink-700 dark:text-pink-300">
                    S/. {{getDatasetTotal(2) | number:'1.0-0'}}
                </div>
                <div class="text-xs text-pink-600 dark:text-pink-400 mt-1">
                    {{getDatasetPercentage(2)}}% del total
                </div>
            </div>
        </div>

        <!-- Chart Section -->
        <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p-chart type="bar" [data]="chartData" [options]="chartOptions" class="h-80" />
        </div>

        <!-- Quarter Analysis -->
        <div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div *ngFor="let quarter of quarters; let i = index" 
                 class="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-bold text-gray-700 dark:text-gray-300">{{quarter}}</span>
                    <i class="pi pi-calendar text-gray-400 text-xs"></i>
                </div>
                <div class="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    S/. {{getQuarterTotal(i) | number:'1.0-0'}}
                </div>
                <div class="text-xs text-gray-500 mt-1">
                    {{getQuarterGrowth(i)}}% crecimiento
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <div class="flex items-center gap-4">
                <span class="text-sm text-gray-500 flex items-center gap-2">
                    <i class="pi pi-info-circle"></i>
                    Datos actualizados en tiempo real
                </span>
            </div>
            <div class="flex items-center gap-2">
                <button pButton label="Exportar" icon="pi pi-download" 
                        class="p-button-sm p-button-outlined">
                </button>
                <button pButton label="Ver Reporte Completo" icon="pi pi-arrow-right" iconPos="right"
                        class="p-button-sm">
                </button>
            </div>
        </div>
    </div>`
})
export class RevenueStreamWidget implements OnInit, OnDestroy {
    chartData!: ChartData;
    chartOptions!: ChartOptions;
    subscription!: Subscription;
    quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    
    menuItems = [
        { label: 'Ver Detalles', icon: 'pi pi-fw pi-eye' },
        { label: 'Exportar a Excel', icon: 'pi pi-fw pi-file-excel' },
        { label: 'Exportar a PDF', icon: 'pi pi-fw pi-file-pdf' },
        { separator: true },
        { label: 'Configurar Gráfico', icon: 'pi pi-fw pi-cog' }
    ];
    
    private layoutService = inject(LayoutService);

    constructor() {
        this.subscription = this.layoutService.configUpdate$.pipe(debounceTime(25)).subscribe(() => {
            this.initChart();
        });
    }

    ngOnInit() {
        this.initChart();
    }

    initChart() {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color');
        const borderColor = documentStyle.getPropertyValue('--surface-border');
        const textMutedColor = documentStyle.getPropertyValue('--text-color-secondary');

        this.chartData = {
            labels: this.quarters,
            datasets: [
                {
                    type: 'bar',
                    label: 'Suscripciones',
                    backgroundColor: 'rgba(99, 102, 241, 0.8)', // Indigo
                    data: [4000, 10000, 15000, 4000],
                    barThickness: 32
                },
                {
                    type: 'bar',
                    label: 'Publicidad',
                    backgroundColor: 'rgba(147, 51, 234, 0.8)', // Purple
                    data: [2100, 8400, 2400, 7500],
                    barThickness: 32
                },
                {
                    type: 'bar',
                    label: 'Afiliados',
                    backgroundColor: 'rgba(236, 72, 153, 0.8)', // Pink
                    data: [4100, 5200, 3400, 7400],
                    borderRadius: {
                        topLeft: 8,
                        topRight: 8,
                        bottomLeft: 0,
                        bottomRight: 0
                    },
                    borderSkipped: false,
                    barThickness: 32
                }
            ]
        };

        this.chartOptions = {
            maintainAspectRatio: false,
            aspectRatio: 0.8,
            plugins: {
                legend: {
                    labels: {
                        color: textColor,
                        font: {
                            weight: '600',
                            size: 12
                        },
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true
                }
            },
            scales: {
                x: {
                    stacked: true,
                    ticks: {
                        color: textMutedColor,
                        font: {
                            size: 12,
                            weight: '600'
                        }
                    },
                    grid: {
                        color: 'transparent',
                        borderColor: 'transparent'
                    }
                },
                y: {
                    stacked: true,
                    ticks: {
                        color: textMutedColor,
                        callback: function(value: any) {
                            return 'S/. ' + value.toLocaleString();
                        }
                    },
                    grid: {
                        color: borderColor,
                        borderColor: 'transparent',
                        drawTicks: false
                    }
                }
            }
        };
    }

    getTotalRevenue(): number {
        if (!this.chartData || !this.chartData.datasets) return 0;
        return this.chartData.datasets.reduce((total, dataset) => {
            return total + dataset.data.reduce((sum, value) => sum + value, 0);
        }, 0);
    }

    getDatasetTotal(datasetIndex: number): number {
        if (!this.chartData || !this.chartData.datasets[datasetIndex]) return 0;
        return this.chartData.datasets[datasetIndex].data.reduce((sum, value) => sum + value, 0);
    }

    getDatasetPercentage(datasetIndex: number): string {
        const total = this.getTotalRevenue();
        if (total === 0) return '0';
        const datasetTotal = this.getDatasetTotal(datasetIndex);
        return ((datasetTotal / total) * 100).toFixed(1);
    }

    getQuarterTotal(quarterIndex: number): number {
        if (!this.chartData || !this.chartData.datasets) return 0;
        return this.chartData.datasets.reduce((total, dataset) => {
            return total + (dataset.data[quarterIndex] || 0);
        }, 0);
    }

    getQuarterGrowth(quarterIndex: number): string {
        if (quarterIndex === 0) return '+12.5';
        const current = this.getQuarterTotal(quarterIndex);
        const previous = this.getQuarterTotal(quarterIndex - 1);
        if (previous === 0) return '0';
        const growth = ((current - previous) / previous) * 100;
        return growth > 0 ? `+${growth.toFixed(1)}` : growth.toFixed(1);
    }

    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }
}

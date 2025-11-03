import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Stat {
    title: string;
    value: string | number;
    icon: string;
    iconColor: string;
    bgColor: string;
    change: string;
    changeLabel: string;
    trend: 'up' | 'down' | 'neutral';
    percentage?: string;
}

@Component({
    standalone: true,
    selector: 'app-stats-widget',
    imports: [CommonModule],
    template: `
        <!-- Pedidos -->
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0 hover:shadow-xl transition-all duration-300 cursor-pointer group border-l-4 border-blue-500">
                <div class="flex justify-between mb-4">
                    <div class="flex-1">
                        <span class="block text-gray-500 font-medium mb-3 text-sm uppercase tracking-wide">Pedidos</span>
                        <div class="text-gray-900 dark:text-gray-100 font-bold text-3xl mb-2 group-hover:text-blue-600 transition-colors">
                            {{stats[0].value}}
                        </div>
                        <div class="flex items-center gap-2 text-sm">
                            <span class="flex items-center gap-1 font-semibold"
                                  [ngClass]="getTrendClass(stats[0].trend)">
                                <i class="text-xs" [ngClass]="getTrendIcon(stats[0].trend)"></i>
                                {{stats[0].change}}
                            </span>
                            <span class="text-gray-500">{{stats[0].changeLabel}}</span>
                        </div>
                    </div>
                    <div class="flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300" 
                         style="width: 3.5rem; height: 3.5rem">
                        <i class="{{stats[0].icon}} text-blue-600 dark:text-blue-400 text-2xl"></i>
                    </div>
                </div>
                <div class="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                    <span class="text-xs text-gray-400 flex items-center gap-1">
                        <i class="pi pi-clock text-xs"></i>
                        Actualizado hace 5 min
                    </span>
                    <i class="pi pi-arrow-right text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all"></i>
                </div>
            </div>
        </div>

        <!-- Ingresos -->
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0 hover:shadow-xl transition-all duration-300 cursor-pointer group border-l-4 border-orange-500">
                <div class="flex justify-between mb-4">
                    <div class="flex-1">
                        <span class="block text-gray-500 font-medium mb-3 text-sm uppercase tracking-wide">Ingresos</span>
                        <div class="text-gray-900 dark:text-gray-100 font-bold text-3xl mb-2 group-hover:text-orange-600 transition-colors">
                            {{stats[1].value}}
                        </div>
                        <div class="flex items-center gap-2 text-sm">
                            <span class="flex items-center gap-1 font-semibold"
                                  [ngClass]="getTrendClass(stats[1].trend)">
                                <i class="text-xs" [ngClass]="getTrendIcon(stats[1].trend)"></i>
                                {{stats[1].change}}
                            </span>
                            <span class="text-gray-500">{{stats[1].changeLabel}}</span>
                        </div>
                    </div>
                    <div class="flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300" 
                         style="width: 3.5rem; height: 3.5rem">
                        <i class="{{stats[1].icon}} text-orange-600 dark:text-orange-400 text-2xl"></i>
                    </div>
                </div>
                <div class="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                    <span class="text-xs text-gray-400 flex items-center gap-1">
                        <i class="pi pi-chart-line text-xs"></i>
                        vs semana pasada
                    </span>
                    <i class="pi pi-arrow-right text-gray-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all"></i>
                </div>
            </div>
        </div>

        <!-- Clientes -->
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0 hover:shadow-xl transition-all duration-300 cursor-pointer group border-l-4 border-cyan-500">
                <div class="flex justify-between mb-4">
                    <div class="flex-1">
                        <span class="block text-gray-500 font-medium mb-3 text-sm uppercase tracking-wide">Clientes</span>
                        <div class="text-gray-900 dark:text-gray-100 font-bold text-3xl mb-2 group-hover:text-cyan-600 transition-colors">
                            {{stats[2].value}}
                        </div>
                        <div class="flex items-center gap-2 text-sm">
                            <span class="flex items-center gap-1 font-semibold"
                                  [ngClass]="getTrendClass(stats[2].trend)">
                                <i class="text-xs" [ngClass]="getTrendIcon(stats[2].trend)"></i>
                                {{stats[2].change}}
                            </span>
                            <span class="text-gray-500">{{stats[2].changeLabel}}</span>
                        </div>
                    </div>
                    <div class="flex items-center justify-center bg-gradient-to-br from-cyan-100 to-cyan-200 dark:from-cyan-900 dark:to-cyan-800 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300" 
                         style="width: 3.5rem; height: 3.5rem">
                        <i class="{{stats[2].icon}} text-cyan-600 dark:text-cyan-400 text-2xl"></i>
                    </div>
                </div>
                <div class="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                    <span class="text-xs text-gray-400 flex items-center gap-1">
                        <i class="pi pi-user-plus text-xs"></i>
                        Nuevos registros
                    </span>
                    <i class="pi pi-arrow-right text-gray-400 group-hover:text-cyan-600 group-hover:translate-x-1 transition-all"></i>
                </div>
            </div>
        </div>

        <!-- Comentarios -->
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0 hover:shadow-xl transition-all duration-300 cursor-pointer group border-l-4 border-purple-500">
                <div class="flex justify-between mb-4">
                    <div class="flex-1">
                        <span class="block text-gray-500 font-medium mb-3 text-sm uppercase tracking-wide">Comentarios</span>
                        <div class="text-gray-900 dark:text-gray-100 font-bold text-3xl mb-2 group-hover:text-purple-600 transition-colors">
                            {{stats[3].value}}
                        </div>
                        <div class="flex items-center gap-2 text-sm">
                            <span class="flex items-center gap-1 font-semibold"
                                  [ngClass]="getTrendClass(stats[3].trend)">
                                <i class="text-xs" [ngClass]="getTrendIcon(stats[3].trend)"></i>
                                {{stats[3].change}}
                            </span>
                            <span class="text-gray-500">{{stats[3].changeLabel}}</span>
                        </div>
                    </div>
                    <div class="flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300" 
                         style="width: 3.5rem; height: 3.5rem">
                        <i class="{{stats[3].icon}} text-purple-600 dark:text-purple-400 text-2xl"></i>
                    </div>
                </div>
                <div class="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                    <span class="text-xs text-gray-400 flex items-center gap-1">
                        <i class="pi pi-check-circle text-xs"></i>
                        Respondidos
                    </span>
                    <i class="pi pi-arrow-right text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all"></i>
                </div>
            </div>
        </div>
    `
})
export class StatsWidget implements OnInit {
    stats: Stat[] = [
        {
            title: 'Pedidos',
            value: '152',
            icon: 'pi pi-shopping-cart',
            iconColor: 'text-blue-500',
            bgColor: 'bg-blue-100 dark:bg-blue-900',
            change: '+24',
            changeLabel: 'desde última visita',
            trend: 'up'
        },
        {
            title: 'Ingresos',
            value: 'S/. 2,100',
            icon: 'pi pi-dollar',
            iconColor: 'text-orange-500',
            bgColor: 'bg-orange-100 dark:bg-orange-900',
            change: '+52%',
            changeLabel: 'desde la semana pasada',
            trend: 'up',
            percentage: '52'
        },
        {
            title: 'Clientes',
            value: '28,441',
            icon: 'pi pi-users',
            iconColor: 'text-cyan-500',
            bgColor: 'bg-cyan-100 dark:bg-cyan-900',
            change: '+520',
            changeLabel: 'nuevos registros',
            trend: 'up'
        },
        {
            title: 'Comentarios',
            value: '152',
            icon: 'pi pi-comment',
            iconColor: 'text-purple-500',
            bgColor: 'bg-purple-100 dark:bg-purple-900',
            change: '85',
            changeLabel: 'respondidos',
            trend: 'neutral'
        }
    ];

    ngOnInit() {
        // Aquí podrías cargar datos reales desde un servicio
        this.loadStats();
    }

    loadStats() {
        // Simulación de carga de datos
        // En producción, esto vendría de un servicio
        console.log('📊 Estadísticas cargadas:', this.stats);
    }

    getTrendClass(trend: 'up' | 'down' | 'neutral'): string {
        const classes = {
            'up': 'text-green-600 dark:text-green-400',
            'down': 'text-red-600 dark:text-red-400',
            'neutral': 'text-blue-600 dark:text-blue-400'
        };
        return classes[trend];
    }

    getTrendIcon(trend: 'up' | 'down' | 'neutral'): string {
        const icons = {
            'up': 'pi pi-arrow-up',
            'down': 'pi pi-arrow-down',
            'neutral': 'pi pi-minus'
        };
        return icons[trend];
    }
}

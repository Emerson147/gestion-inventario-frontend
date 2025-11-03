import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { BadgeModule } from 'primeng/badge';

@Component({
    standalone: true,
    selector: 'app-notifications-widget',
    imports: [CommonModule, ButtonModule, MenuModule, BadgeModule],
    template: `
    <div class="card hover:shadow-xl transition-all duration-300 border-l-4 border-purple-500">
        <!-- Header Section -->
        <div class="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
            <div>
                <h2 class="font-bold text-2xl text-gray-900 dark:text-gray-100 mb-1 flex items-center gap-2">
                    <i class="pi pi-bell text-purple-500"></i>
                    Notificaciones
                    <span class="inline-flex items-center justify-center w-7 h-7 text-xs font-bold text-white bg-red-500 rounded-full">
                        6
                    </span>
                </h2>
                <p class="text-sm text-gray-500">Actividad reciente del sistema</p>
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
                <p-menu #menu [popup]="true" [model]="items"></p-menu>
            </div>
        </div>

        <!-- TODAY Section -->
        <div class="mb-6">
            <div class="flex items-center gap-2 mb-4">
                <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Hoy</span>
                <div class="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                <span class="text-xs text-gray-400">2 nuevas</span>
            </div>
            <ul class="p-0 m-0 list-none space-y-3">
                <li class="p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 border border-transparent hover:border-blue-200 dark:hover:border-blue-800 group">
                    <div class="flex items-start gap-3">
                        <div class="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                            <i class="pi pi-dollar text-xl text-blue-600 dark:text-blue-400"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-gray-900 dark:text-gray-100 leading-relaxed">
                                <span class="font-semibold">Richard Jones</span>
                                <span class="text-gray-600 dark:text-gray-400"> ha comprado una camiseta azul por </span>
                                <span class="font-bold text-blue-600 dark:text-blue-400">S/. 79.00</span>
                            </p>
                            <span class="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                <i class="pi pi-clock text-xs"></i>
                                Hace 5 minutos
                            </span>
                        </div>
                    </div>
                </li>
                <li class="p-3 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-200 border border-transparent hover:border-orange-200 dark:hover:border-orange-800 group">
                    <div class="flex items-start gap-3">
                        <div class="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800 rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                            <i class="pi pi-download text-xl text-orange-600 dark:text-orange-400"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-gray-900 dark:text-gray-100 leading-relaxed">
                                Tu solicitud de retiro de 
                                <span class="font-bold text-orange-600 dark:text-orange-400">S/. 2,500.00</span>
                                <span class="text-gray-600 dark:text-gray-400"> ha sido iniciada.</span>
                            </p>
                            <span class="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                <i class="pi pi-clock text-xs"></i>
                                Hace 1 hora
                            </span>
                        </div>
                    </div>
                </li>
            </ul>
        </div>

        <!-- YESTERDAY Section -->
        <div class="mb-6">
            <div class="flex items-center gap-2 mb-4">
                <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Ayer</span>
                <div class="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                <span class="text-xs text-gray-400">2 notificaciones</span>
            </div>
            <ul class="p-0 m-0 list-none space-y-3">
                <li class="p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 border border-transparent hover:border-blue-200 dark:hover:border-blue-800 group">
                    <div class="flex items-start gap-3">
                        <div class="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                            <i class="pi pi-dollar text-xl text-blue-600 dark:text-blue-400"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-gray-900 dark:text-gray-100 leading-relaxed">
                                <span class="font-semibold">Keyser Wick</span>
                                <span class="text-gray-600 dark:text-gray-400"> ha comprado una chaqueta negra por </span>
                                <span class="font-bold text-blue-600 dark:text-blue-400">S/. 59.00</span>
                            </p>
                            <span class="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                <i class="pi pi-clock text-xs"></i>
                                Ayer a las 18:30
                            </span>
                        </div>
                    </div>
                </li>
                <li class="p-3 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all duration-200 border border-transparent hover:border-pink-200 dark:hover:border-pink-800 group">
                    <div class="flex items-start gap-3">
                        <div class="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900 dark:to-pink-800 rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                            <i class="pi pi-question text-xl text-pink-600 dark:text-pink-400"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-gray-900 dark:text-gray-100 leading-relaxed">
                                <span class="font-semibold">Jane Davis</span>
                                <span class="text-gray-600 dark:text-gray-400"> ha publicado una nueva pregunta sobre tu producto.</span>
                            </p>
                            <span class="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                <i class="pi pi-clock text-xs"></i>
                                Ayer a las 14:15
                            </span>
                        </div>
                    </div>
                </li>
            </ul>
        </div>

        <!-- LAST WEEK Section -->
        <div class="mb-4">
            <div class="flex items-center gap-2 mb-4">
                <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Última Semana</span>
                <div class="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                <span class="text-xs text-gray-400">2 notificaciones</span>
            </div>
            <ul class="p-0 m-0 list-none space-y-3">
                <li class="p-3 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200 border border-transparent hover:border-green-200 dark:hover:border-green-800 group">
                    <div class="flex items-start gap-3">
                        <div class="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                            <i class="pi pi-arrow-up text-xl text-green-600 dark:text-green-400"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-gray-900 dark:text-gray-100 leading-relaxed">
                                Tus ingresos han aumentado en 
                                <span class="font-bold text-green-600 dark:text-green-400">25%</span>
                            </p>
                            <span class="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                <i class="pi pi-clock text-xs"></i>
                                Hace 5 días
                            </span>
                        </div>
                    </div>
                </li>
                <li class="p-3 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200 border border-transparent hover:border-purple-200 dark:hover:border-purple-800 group">
                    <div class="flex items-start gap-3">
                        <div class="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 rounded-xl shrink-0 group-hover:scale-110 transition-transform">
                            <i class="pi pi-heart text-xl text-purple-600 dark:text-purple-400"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-gray-900 dark:text-gray-100 leading-relaxed">
                                <span class="font-bold text-purple-600 dark:text-purple-400">12 usuarios</span>
                                <span class="text-gray-600 dark:text-gray-400"> han agregado tus productos a sus favoritos.</span>
                            </p>
                            <span class="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                <i class="pi pi-clock text-xs"></i>
                                Hace 6 días
                            </span>
                        </div>
                    </div>
                </li>
            </ul>
        </div>

        <!-- Footer -->
        <div class="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <span class="text-sm text-gray-500">
                <i class="pi pi-check-circle text-green-500 mr-1"></i>
                6 notificaciones totales
            </span>
            <button pButton label="Marcar Todo como Leído" icon="pi pi-check-square" iconPos="right" 
                    class="p-button-sm p-button-text hover:bg-purple-50 dark:hover:bg-purple-900">
            </button>
        </div>
    </div>`
})
export class NotificationsWidget {
    items = [
        { label: 'Marcar como Leído', icon: 'pi pi-fw pi-check' },
        { label: 'Actualizar', icon: 'pi pi-fw pi-refresh' },
        { label: 'Configuración', icon: 'pi pi-fw pi-cog' },
        { separator: true },
        { label: 'Eliminar Todas', icon: 'pi pi-fw pi-trash', styleClass: 'text-red-500' }
    ];
}

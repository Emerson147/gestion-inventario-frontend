import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';

@Component({
    standalone: true,
    selector: 'app-best-selling-widget',
    imports: [CommonModule, ButtonModule, MenuModule],
    template: ` 
    <div class="card hover:shadow-xl transition-all duration-300 border-l-4 border-blue-500">
        <!-- Header Section -->
        <div class="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
            <div>
                <h2 class="font-bold text-2xl text-gray-900 dark:text-gray-100 mb-1">
                    <i class="pi pi-star-fill text-yellow-500 mr-2"></i>
                    Productos Más Vendidos
                </h2>
                <p class="text-sm text-gray-500">Top 6 productos con mejor rendimiento</p>
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

        <!-- Products List -->
        <ul class="list-none p-0 m-0 space-y-4">
            <!-- Space T-Shirt -->
            <li class="p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 border border-transparent hover:border-orange-200 dark:hover:border-orange-800 group">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div class="flex items-center gap-3 flex-1">
                        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <i class="pi pi-shopping-bag text-orange-600 dark:text-orange-400 text-xl"></i>
                        </div>
                        <div>
                            <span class="text-gray-900 dark:text-gray-100 font-semibold text-lg block">Space T-Shirt</span>
                            <div class="flex items-center gap-2 mt-1">
                                <i class="pi pi-tag text-xs text-gray-400"></i>
                                <span class="text-sm text-gray-500">Ropa</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden h-3 w-32 lg:w-40">
                            <div class="bg-gradient-to-r from-orange-500 to-orange-600 h-full rounded-full shadow-md transition-all duration-500" style="width: 50%"></div>
                        </div>
                        <div class="text-right min-w-[60px]">
                            <span class="text-orange-600 dark:text-orange-400 font-bold text-lg">50%</span>
                        </div>
                    </div>
                </div>
            </li>

            <!-- Portal Sticker -->
            <li class="p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 border border-transparent hover:border-cyan-200 dark:hover:border-cyan-800 group">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div class="flex items-center gap-3 flex-1">
                        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-100 to-cyan-200 dark:from-cyan-900 dark:to-cyan-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <i class="pi pi-palette text-cyan-600 dark:text-cyan-400 text-xl"></i>
                        </div>
                        <div>
                            <span class="text-gray-900 dark:text-gray-100 font-semibold text-lg block">Portal Sticker</span>
                            <div class="flex items-center gap-2 mt-1">
                                <i class="pi pi-tag text-xs text-gray-400"></i>
                                <span class="text-sm text-gray-500">Accesorios</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden h-3 w-32 lg:w-40">
                            <div class="bg-gradient-to-r from-cyan-500 to-cyan-600 h-full rounded-full shadow-md transition-all duration-500" style="width: 16%"></div>
                        </div>
                        <div class="text-right min-w-[60px]">
                            <span class="text-cyan-600 dark:text-cyan-400 font-bold text-lg">16%</span>
                        </div>
                    </div>
                </div>
            </li>

            <!-- Supernova Sticker -->
            <li class="p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 border border-transparent hover:border-pink-200 dark:hover:border-pink-800 group">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div class="flex items-center gap-3 flex-1">
                        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900 dark:to-pink-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <i class="pi pi-star text-pink-600 dark:text-pink-400 text-xl"></i>
                        </div>
                        <div>
                            <span class="text-gray-900 dark:text-gray-100 font-semibold text-lg block">Supernova Sticker</span>
                            <div class="flex items-center gap-2 mt-1">
                                <i class="pi pi-tag text-xs text-gray-400"></i>
                                <span class="text-sm text-gray-500">Accesorios</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden h-3 w-32 lg:w-40">
                            <div class="bg-gradient-to-r from-pink-500 to-pink-600 h-full rounded-full shadow-md transition-all duration-500" style="width: 67%"></div>
                        </div>
                        <div class="text-right min-w-[60px]">
                            <span class="text-pink-600 dark:text-pink-400 font-bold text-lg">67%</span>
                        </div>
                    </div>
                </div>
            </li>

            <!-- Wonders Notebook -->
            <li class="p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 border border-transparent hover:border-green-200 dark:hover:border-green-800 group">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div class="flex items-center gap-3 flex-1">
                        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <i class="pi pi-book text-green-600 dark:text-green-400 text-xl"></i>
                        </div>
                        <div>
                            <span class="text-gray-900 dark:text-gray-100 font-semibold text-lg block">Wonders Notebook</span>
                            <div class="flex items-center gap-2 mt-1">
                                <i class="pi pi-tag text-xs text-gray-400"></i>
                                <span class="text-sm text-gray-500">Oficina</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden h-3 w-32 lg:w-40">
                            <div class="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full shadow-md transition-all duration-500" style="width: 35%"></div>
                        </div>
                        <div class="text-right min-w-[60px]">
                            <span class="text-green-600 dark:text-green-400 font-bold text-lg">35%</span>
                        </div>
                    </div>
                </div>
            </li>

            <!-- Mat Black Case -->
            <li class="p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 border border-transparent hover:border-purple-200 dark:hover:border-purple-800 group">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div class="flex items-center gap-3 flex-1">
                        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <i class="pi pi-mobile text-purple-600 dark:text-purple-400 text-xl"></i>
                        </div>
                        <div>
                            <span class="text-gray-900 dark:text-gray-100 font-semibold text-lg block">Mat Black Case</span>
                            <div class="flex items-center gap-2 mt-1">
                                <i class="pi pi-tag text-xs text-gray-400"></i>
                                <span class="text-sm text-gray-500">Accesorios</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden h-3 w-32 lg:w-40">
                            <div class="bg-gradient-to-r from-purple-500 to-purple-600 h-full rounded-full shadow-md transition-all duration-500" style="width: 75%"></div>
                        </div>
                        <div class="text-right min-w-[60px]">
                            <span class="text-purple-600 dark:text-purple-400 font-bold text-lg">75%</span>
                        </div>
                    </div>
                </div>
            </li>

            <!-- Robots T-Shirt -->
            <li class="p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 border border-transparent hover:border-teal-200 dark:hover:border-teal-800 group">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div class="flex items-center gap-3 flex-1">
                        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-900 dark:to-teal-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <i class="pi pi-shopping-bag text-teal-600 dark:text-teal-400 text-xl"></i>
                        </div>
                        <div>
                            <span class="text-gray-900 dark:text-gray-100 font-semibold text-lg block">Robots T-Shirt</span>
                            <div class="flex items-center gap-2 mt-1">
                                <i class="pi pi-tag text-xs text-gray-400"></i>
                                <span class="text-sm text-gray-500">Ropa</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden h-3 w-32 lg:w-40">
                            <div class="bg-gradient-to-r from-teal-500 to-teal-600 h-full rounded-full shadow-md transition-all duration-500" style="width: 40%"></div>
                        </div>
                        <div class="text-right min-w-[60px]">
                            <span class="text-teal-600 dark:text-teal-400 font-bold text-lg">40%</span>
                        </div>
                    </div>
                </div>
            </li>
        </ul>

        <!-- Footer -->
        <div class="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <span class="text-sm text-gray-500">
                <i class="pi pi-info-circle mr-1"></i>
                Actualizado hace 5 minutos
            </span>
            <button pButton label="Ver Todos" icon="pi pi-arrow-right" iconPos="right" 
                    class="p-button-sm p-button-text hover:bg-blue-50 dark:hover:bg-blue-900">
            </button>
        </div>
    </div>`
})
export class BestSellingWidget {
    menu = null;

    items = [
        { label: 'Agregar Nuevo', icon: 'pi pi-fw pi-plus' },
        { label: 'Exportar', icon: 'pi pi-fw pi-download' },
        { label: 'Actualizar', icon: 'pi pi-fw pi-refresh' },
        { separator: true },
        { label: 'Eliminar', icon: 'pi pi-fw pi-trash', styleClass: 'text-red-500' }
    ];
}

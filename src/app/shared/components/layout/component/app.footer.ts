import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    standalone: true,
    selector: 'app-footer',
    imports: [CommonModule],
    template: `
        <div class="layout-footer flex flex-col md:flex-row items-center justify-between pt-6 pb-4 px-6 select-none opacity-80 hover:opacity-100 transition-opacity duration-300">
            
            <div class="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400 mb-2 md:mb-0">
                <span>&copy; {{ currentYear }} Creado con</span>
                <i class="pi pi-bolt text-yellow-500 text-xs animate-pulse"></i> <span>por</span>
                <span class="font-bold text-surface-700 dark:text-surface-200">Emerson</span>
            </div>

            <div class="flex items-center gap-4">
                
                <a href="https://migatte.dev" target="_blank" rel="noopener noreferrer" 
                   class="group flex items-center gap-2 no-underline px-3 py-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-300">
                    
                    <i class="pi pi-box text-indigo-500 group-hover:rotate-12 transition-transform duration-300"></i>
                    
                    <span class="text-sm font-bold text-surface-600 dark:text-surface-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        Migatte<span class="font-mono text-indigo-500">.Dev</span>
                    </span>
                </a>

                <div class="w-px h-3 bg-surface-300 dark:bg-surface-700"></div>

                <span class="text-[10px] font-mono font-medium text-surface-400 cursor-help" title="Versión del Sistema">
                    v2.1.0-build
                </span>
            </div>

        </div>
    `
})
export class AppFooter {
    get currentYear(): number {
        return new Date().getFullYear();
    }
}
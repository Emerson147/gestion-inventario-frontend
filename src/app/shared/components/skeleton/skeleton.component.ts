import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="animate-pulse" [ngClass]="containerClass">
      <!-- Skeleton para cards de inventario -->
      <div *ngIf="type === 'inventory-card'" class="bg-white rounded-xl p-6 border border-gray-200">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="bg-gray-300 w-10 h-10 rounded-lg"></div>
            <div>
              <div class="bg-gray-300 h-4 w-24 rounded mb-2"></div>
              <div class="bg-gray-300 h-3 w-16 rounded"></div>
            </div>
          </div>
          <div class="bg-gray-300 h-6 w-20 rounded-full"></div>
        </div>
        
        <!-- Variante info -->
        <div class="grid grid-cols-2 gap-2 mb-4">
          <div class="bg-gray-300 h-8 rounded-lg"></div>
          <div class="bg-gray-300 h-8 rounded-lg"></div>
        </div>
        
        <!-- Cantidad -->
        <div class="text-center mb-4">
          <div class="bg-gray-300 h-12 w-20 rounded mx-auto mb-2"></div>
          <div class="bg-gray-300 h-4 w-32 rounded mx-auto"></div>
        </div>
        
        <!-- Métricas -->
        <div class="grid grid-cols-2 gap-3 mb-4">
          <div class="bg-gray-300 h-12 rounded-lg"></div>
          <div class="bg-gray-300 h-12 rounded-lg"></div>
        </div>
        
        <!-- Acciones -->
        <div class="flex gap-2">
          <div class="bg-gray-300 h-8 flex-1 rounded"></div>
          <div class="bg-gray-300 h-8 w-8 rounded"></div>
          <div class="bg-gray-300 h-8 w-8 rounded"></div>
        </div>
      </div>

      <!-- Skeleton para tabla -->
      <div *ngIf="type === 'table'" class="bg-white rounded-xl border border-gray-200">
        <!-- Header de tabla -->
        <div class="p-4 border-b border-gray-200">
          <div class="flex justify-between items-center">
            <div class="bg-gray-300 h-6 w-48 rounded"></div>
            <div class="bg-gray-300 h-8 w-64 rounded"></div>
          </div>
        </div>
        
        <!-- Filas de tabla -->
        <div class="divide-y divide-gray-200">
          <div *ngFor="let item of [1,2,3,4,5]" class="p-4">
            <div class="grid grid-cols-8 gap-4 items-center">
              <div class="bg-gray-300 h-4 rounded"></div>
              <div class="bg-gray-300 h-4 rounded"></div>
              <div class="bg-gray-300 h-4 rounded"></div>
              <div class="bg-gray-300 h-4 rounded"></div>
              <div class="bg-gray-300 h-4 rounded"></div>
              <div class="bg-gray-300 h-4 rounded"></div>
              <div class="bg-gray-300 h-4 rounded"></div>
              <div class="flex gap-2">
                <div class="bg-gray-300 h-6 w-6 rounded"></div>
                <div class="bg-gray-300 h-6 w-6 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Skeleton para dashboard metrics -->
      <div *ngIf="type === 'dashboard-metric'" class="bg-white rounded-xl p-4 border border-gray-200">
        <div class="flex items-center gap-3">
          <div class="bg-gray-300 w-12 h-12 rounded-lg"></div>
          <div class="flex-1">
            <div class="bg-gray-300 h-6 w-16 rounded mb-2"></div>
            <div class="bg-gray-300 h-4 w-24 rounded"></div>
          </div>
        </div>
      </div>

      <!-- Skeleton genérico -->
      <div *ngIf="type === 'generic'">
        <div class="bg-gray-300 h-4 rounded mb-3" [style.width]="width"></div>
        <div class="bg-gray-300 h-4 rounded mb-3" [style.width]="'75%'"></div>
        <div class="bg-gray-300 h-4 rounded" [style.width]="'50%'"></div>
      </div>

      <!-- Skeleton para formulario -->
      <div *ngIf="type === 'form'" class="space-y-4">
        <div *ngFor="let field of [1,2,3,4]">
          <div class="bg-gray-300 h-4 w-24 rounded mb-2"></div>
          <div class="bg-gray-300 h-10 w-full rounded"></div>
        </div>
      </div>

      <!-- Skeleton para gráfico -->
      <div *ngIf="type === 'chart'" class="bg-white rounded-xl p-6 border border-gray-200">
        <div class="bg-gray-300 h-6 w-32 rounded mb-4"></div>
        <div class="bg-gray-300 h-64 w-full rounded"></div>
      </div>
    </div>
  `,
  styles: [`
    .animate-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: .5;
      }
    }
  `]
})
export class SkeletonComponent {
  @Input() type: 'inventory-card' | 'table' | 'dashboard-metric' | 'generic' | 'form' | 'chart' = 'generic';
  @Input() width: string = '100%';
  @Input() containerClass: string = '';
}
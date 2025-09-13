import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { LoadingService } from '../../../core/services/loading.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-global-loading',
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule],
  template: `
    <div 
      *ngIf="isLoading$ | async" 
      class="global-loading-overlay"
      role="progressbar"
      aria-label="Cargando..."
    >
      <div class="loading-content">
        <p-progressSpinner 
          [style]="{'width': '50px', 'height': '50px'}" 
          strokeWidth="4"
          fill="transparent"
          animationDuration="1s"
        />
        <div class="loading-text">
          <p class="text-lg font-medium text-gray-700 mb-1">Cargando...</p>
          <p class="text-sm text-gray-500">Por favor espere</p>
        </div>
        
        <!-- Mostrar operaciones activas en desarrollo -->
        <div *ngIf="showDebugInfo" class="debug-info">
          <p class="text-xs text-gray-400 mt-2">Operaciones activas:</p>
          <ul class="text-xs text-gray-400">
            <li *ngFor="let operation of activeOperations">{{ operation }}</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .global-loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.3s ease-in-out;
    }
    
    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 2rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(0, 0, 0, 0.05);
    }
    
    .loading-text {
      text-align: center;
    }
    
    .debug-info {
      text-align: center;
      max-width: 200px;
    }
    
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    
    :host ::ng-deep .p-progress-spinner-circle {
      stroke: #3b82f6;
    }
  `]
})
export class GlobalLoadingComponent implements OnInit {
  private loadingService = inject(LoadingService);
  
  isLoading$!: Observable<boolean>;
  activeOperations: string[] = [];
  showDebugInfo = false; // Cambiar a true para debugging

  ngOnInit(): void {
    this.isLoading$ = this.loadingService.isAnyLoading();
    
    // Suscribirse a cambios en las operaciones activas
    this.loadingService.loading$.subscribe(state => {
      this.activeOperations = this.loadingService.getActiveLoadingOperations();
    });
  }
}
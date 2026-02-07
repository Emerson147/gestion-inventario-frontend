import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="animate-pulse space-y-4" [attr.aria-label]="'Cargando contenido'">
      <!-- Header skeleton -->
      <div *ngIf="showHeader" class="skeleton-card h-32"></div>
      
      <!-- Text lines skeleton -->
      <div *ngIf="showText" class="space-y-2">
        <div class="skeleton-text w-3/4"></div>
        <div class="skeleton-text w-1/2"></div>
        <div class="skeleton-text w-2/3"></div>
      </div>
      
      <!-- Buttons skeleton -->
      <div *ngIf="showButtons" class="flex gap-3">
        <div class="skeleton-button flex-1"></div>
        <div class="skeleton-button flex-1"></div>
      </div>
      
      <!-- Cards skeleton -->
      <div *ngIf="showCards" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div *ngFor="let item of cardArray" class="skeleton-card h-48"></div>
      </div>
      
      <!-- Table skeleton -->
      <div *ngIf="showTable" class="space-y-3">
        <div *ngFor="let row of tableRows" class="flex space-x-4">
          <div class="skeleton w-1/4 h-6"></div>
          <div class="skeleton w-1/3 h-6"></div>
          <div class="skeleton w-1/4 h-6"></div>
          <div class="skeleton w-1/6 h-6"></div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkeletonLoaderComponent {
  @Input() showHeader: boolean = false;
  @Input() showText: boolean = true;
  @Input() showButtons: boolean = false;
  @Input() showCards: boolean = false;
  @Input() showTable: boolean = false;
  @Input() cardCount: number = 3;
  @Input() tableRowCount: number = 5;

  get cardArray(): number[] {
    return Array(this.cardCount).fill(0);
  }

  get tableRows(): number[] {
    return Array(this.tableRowCount).fill(0);
  }
}
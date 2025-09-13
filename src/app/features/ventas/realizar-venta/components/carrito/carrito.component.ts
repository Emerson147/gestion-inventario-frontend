import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { CardModule } from 'primeng/card';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

export interface CarritoItem {
  id: number;
  inventarioId: number;
  producto: {
    id: number;
    codigo: string;
    nombre: string;
    imagen?: string;
  };
  color: {
    id: number;
    nombre: string;
  };
  talla: {
    id: number;
    numero: string;
  };
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  stock: number;
  codigoCompleto: string;
}

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputNumberModule,
    CardModule,
    BadgeModule,
    TooltipModule,
    ToastModule
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="carrito-container bg-white rounded-lg shadow-lg border border-gray-200">
      <!-- Header del Carrito -->
      <div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <i class="pi pi-shopping-cart text-xl"></i>
            <h3 class="text-lg font-bold">Carrito de Compras</h3>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm opacity-90">{{ items.length }} productos</span>
            <div class="bg-white/20 px-2 py-1 rounded-full text-xs">
              {{ getTotalItems() }} unidades
            </div>
          </div>
        </div>
      </div>

      <!-- Lista de Productos -->
      <div class="p-4 max-h-96 overflow-y-auto custom-scrollbar">
        <div *ngIf="items.length === 0" class="text-center py-8">
          <i class="pi pi-shopping-bag text-4xl text-gray-300 mb-4"></i>
          <p class="text-gray-500">El carrito está vacío</p>
          <p class="text-sm text-gray-400">Agrega productos para comenzar</p>
        </div>

        <div *ngFor="let item of items; trackBy: trackByItemId" 
             class="carrito-item bg-gray-50 rounded-lg p-3 mb-3 border border-gray-200 hover:shadow-md transition-shadow">
          
          <!-- Información del Producto -->
          <div class="flex items-start gap-3">
            <!-- Imagen del Producto -->
            <div class="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
              <img *ngIf="item.producto.imagen" 
                   [src]="item.producto.imagen" 
                   [alt]="item.producto.nombre"
                   class="w-full h-full object-cover rounded-lg">
              <i *ngIf="!item.producto.imagen" 
                 class="pi pi-image text-gray-400 text-xl"></i>
            </div>

            <!-- Detalles del Producto -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between mb-2">
                <div class="flex-1">
                  <h4 class="font-semibold text-gray-900 truncate">{{ item.producto.nombre }}</h4>
                  <div class="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      {{ item.color.nombre }}
                    </span>
                    <span class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                      Talla {{ item.talla.numero }}
                    </span>
                    <span class="text-gray-500">#{{ item.producto.codigo }}</span>
                  </div>
                </div>
                
                <!-- Botón Eliminar -->
                <button class="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                        (click)="removeItem(item.id)"
                        pTooltip="Eliminar del carrito"
                        tooltipPosition="top">
                  <i class="pi pi-trash text-sm"></i>
                </button>
              </div>

              <!-- Controles de Cantidad y Precio -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <label class="text-sm text-gray-600">Cantidad:</label>
                  <div class="flex items-center border border-gray-300 rounded-lg">
                    <button class="px-2 py-1 text-gray-600 hover:bg-gray-100 transition-colors"
                            (click)="decreaseQuantity(item)"
                            [disabled]="item.cantidad <= 1">
                      <i class="pi pi-minus text-xs"></i>
                    </button>
                    <input type="number" 
                           [value]="item.cantidad"
                           (input)="updateQuantity(item, $event)"
                           class="w-12 text-center border-none focus:outline-none text-sm"
                           min="1"
                           [max]="item.stock">
                    <button class="px-2 py-1 text-gray-600 hover:bg-gray-100 transition-colors"
                            (click)="increaseQuantity(item)"
                            [disabled]="item.cantidad >= item.stock">
                      <i class="pi pi-plus text-xs"></i>
                    </button>
                  </div>
                  <span class="text-xs text-gray-500">Stock: {{ item.stock }}</span>
                </div>

                <div class="text-right">
                  <div class="text-sm text-gray-500">Precio unitario</div>
                  <div class="font-semibold text-gray-900">{{ formatCurrency(item.precioUnitario) }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Subtotal del Item -->
          <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
            <div class="text-sm text-gray-600">
              Subtotal: <span class="font-semibold text-blue-600">{{ formatCurrency(item.subtotal) }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span *ngIf="item.cantidad > 1" class="text-xs text-gray-500">
                {{ item.cantidad }} × {{ formatCurrency(item.precioUnitario) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Resumen del Carrito -->
      <div *ngIf="items.length > 0" class="border-t border-gray-200 p-4 bg-gray-50">
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Subtotal:</span>
            <span class="font-medium">{{ formatCurrency(subtotal) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">IGV (18%):</span>
            <span class="font-medium">{{ formatCurrency(igv) }}</span>
          </div>
          <div *ngIf="descuento > 0" class="flex justify-between text-sm">
            <span class="text-gray-600">Descuento:</span>
            <span class="font-medium text-red-600">-{{ formatCurrency(descuento) }}</span>
          </div>
          <div class="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
            <span class="text-gray-800">TOTAL:</span>
            <span class="text-blue-600">{{ formatCurrency(total) }}</span>
          </div>
        </div>

        <!-- Botones de Acción -->
        <div class="flex gap-2 mt-4">
          <button class="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
                  (click)="clearCart()">
            <i class="pi pi-trash mr-2"></i>
            Vaciar Carrito
          </button>
          <button class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                  (click)="proceedToCheckout()"
                  [disabled]="!canProceed">
            <i class="pi pi-credit-card mr-2"></i>
            Proceder al Pago
          </button>
        </div>
      </div>
    </div>

    <p-toast position="top-right"></p-toast>
  `,
  styles: [`
    .carrito-container {
      min-height: 400px;
    }
    
    .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: #cbd5e0 #f7fafc;
    }
    
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #f7fafc;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #cbd5e0;
      border-radius: 3px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #a0aec0;
    }
    
    .carrito-item {
      transition: all 0.2s ease;
    }
    
    .carrito-item:hover {
      transform: translateY(-1px);
    }
  `]
})
export class CarritoComponent {
  @Input() items: CarritoItem[] = [];
  @Input() subtotal: number = 0;
  @Input() igv: number = 0;
  @Input() descuento: number = 0;
  @Input() total: number = 0;
  @Input() canProceed: boolean = false;

  @Output() itemRemoved = new EventEmitter<number>();
  @Output() quantityChanged = new EventEmitter<{ itemId: number; quantity: number }>();
  @Output() cartCleared = new EventEmitter<void>();
  @Output() checkoutRequested = new EventEmitter<void>();

  private messageService = inject(MessageService);

  trackByItemId(index: number, item: CarritoItem): number {
    return item.id;
  }

  getTotalItems(): number {
    return this.items.reduce((total, item) => total + item.cantidad, 0);
  }

  removeItem(itemId: number): void {
    this.itemRemoved.emit(itemId);
    this.messageService.add({
      severity: 'info',
      summary: 'Producto eliminado',
      detail: 'El producto ha sido removido del carrito',
      life: 2000
    });
  }

  updateQuantity(item: CarritoItem, event: Event): void {
    const input = event.target as HTMLInputElement;
    const newQuantity = parseInt(input.value) || 1;
    
    if (newQuantity < 1) {
      input.value = '1';
      return;
    }
    
    if (newQuantity > item.stock) {
      input.value = item.stock.toString();
      this.messageService.add({
        severity: 'warn',
        summary: 'Stock insuficiente',
        detail: `Solo hay ${item.stock} unidades disponibles`,
        life: 3000
      });
      return;
    }
    
    this.quantityChanged.emit({ itemId: item.id, quantity: newQuantity });
  }

  increaseQuantity(item: CarritoItem): void {
    if (item.cantidad < item.stock) {
      this.quantityChanged.emit({ itemId: item.id, quantity: item.cantidad + 1 });
    }
  }

  decreaseQuantity(item: CarritoItem): void {
    if (item.cantidad > 1) {
      this.quantityChanged.emit({ itemId: item.id, quantity: item.cantidad - 1 });
    }
  }

  clearCart(): void {
    this.cartCleared.emit();
    this.messageService.add({
      severity: 'info',
      summary: 'Carrito vaciado',
      detail: 'Todos los productos han sido removidos',
      life: 2000
    });
  }

  proceedToCheckout(): void {
    this.checkoutRequested.emit();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  }
}

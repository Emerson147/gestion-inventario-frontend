import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';
import { Tienda, ImpresoraConfig, AperturaCajaRequest } from '../../models/caja.model';
import { InputTextModule } from 'primeng/inputtext';
 
@Component({
  selector: 'app-apertura-caja-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputNumberModule,
    DropdownModule,
    InputTextModule,
    TooltipModule
  ],
  template: `
    <div class="flex flex-col h-full bg-white dark:bg-surface-950 relative">
      
      <div class="flex items-center justify-between px-8 py-6 border-b border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 sticky top-0 z-50">
          <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 shadow-sm">
                  <i class="pi pi-lock-open text-xl"></i>
              </div>
              <div>
                  <h2 class="text-xl font-bold text-surface-900 dark:text-surface-0 m-0 leading-none tracking-tight">Apertura de Caja</h2>
                  <span class="text-sm font-medium text-surface-500 dark:text-surface-400 mt-1 block">Configura tu sesión de ventas</span>
              </div>
          </div>
          <button (click)="onCancel()" class="w-9 h-9 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-500 hover:text-surface-900 dark:hover:text-surface-0 transition-colors focus:outline-none">
              <i class="pi pi-times"></i>
          </button>
      </div>

      <div class="p-8 overflow-y-auto custom-scrollbar flex-1">
        <form [formGroup]="form" class="space-y-8" (keydown.enter)="$event.preventDefault()">
            
            <div class="bg-surface-50 dark:bg-surface-800/50 rounded-[2rem] p-8 text-center border border-surface-200 dark:border-surface-700 shadow-sm relative overflow-hidden group focus-within:border-indigo-300 transition-colors">
                <label class="block text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-widest mb-4">Efectivo Inicial en Caja <span class="text-red-500">*</span></label>
                
                <div class="relative flex items-baseline justify-center gap-2">
                    <span class="text-4xl font-bold text-surface-400 dark:text-surface-500 transform -translate-y-2">S/.</span>
                    <p-inputNumber
                      formControlName="montoInicial"
                      mode="decimal"
                      [minFractionDigits]="2"
                      [maxFractionDigits]="2"
                      [min]="0"
                      placeholder="0.00"
                      styleClass="zen-money-input"
                    />
                </div>
                <p class="text-sm font-medium text-surface-500 dark:text-surface-400 mt-4 flex items-center justify-center gap-2">
                    <i class="pi pi-info-circle"></i>
                    Ingresa el monto físico contado
                </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div class="space-y-2">
                    <label class="text-sm font-bold text-surface-700 dark:text-surface-200 tracking-tight flex items-center gap-2">
                        <i class="pi pi-building text-surface-400"></i> Sucursal <span class="text-red-500">*</span>
                    </label>
                    <p-dropdown
                      formControlName="tiendaId"
                      [options]="tiendas"
                      optionLabel="nombre"
                      optionValue="id"
                      placeholder="Seleccione sucursal"
                      styleClass="w-full border-none bg-surface-50 dark:bg-surface-800 rounded-xl h-12 flex items-center px-3 shadow-sm focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900 transition-all"
                      [showClear]="true"
                      appendTo="body"
                    >
                        <ng-template pTemplate="selectedItem" let-selected>
                            <div class="flex items-center gap-2 font-medium">
                                <i class="pi pi-building text-indigo-500"></i>
                                <span>{{ selected.nombre }}</span>
                            </div>
                        </ng-template>
                    </p-dropdown>
                </div>

                <div class="space-y-2">
                    <label class="text-sm font-bold text-surface-700 dark:text-surface-200 tracking-tight flex items-center gap-2">
                        <i class="pi pi-clock text-surface-400"></i> Turno <span class="text-red-500">*</span>
                    </label>
                    <p-dropdown
                      formControlName="turno"
                      [options]="turnos"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccione turno"
                      styleClass="w-full border-none bg-surface-50 dark:bg-surface-800 rounded-xl h-12 flex items-center px-3 shadow-sm focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900 transition-all"
                      appendTo="body"
                    >
                        <ng-template pTemplate="selectedItem" let-selected>
                            <div class="flex items-center gap-2 font-medium">
                                <i class="pi pi-sun text-amber-500" *ngIf="selected.value === 'MAÑANA'"></i>
                                <i class="pi pi-moon text-indigo-500" *ngIf="selected.value !== 'MAÑANA'"></i>
                                <span>{{ selected.label.split(' ')[1] }}</span>
                            </div>
                        </ng-template>
                    </p-dropdown>
                </div>

                <div class="md:col-span-2 space-y-2">
                    <div class="flex justify-between items-center">
                        <label class="text-sm font-bold text-surface-700 dark:text-surface-200 tracking-tight flex items-center gap-2">
                            <i class="pi pi-print text-surface-400"></i> Impresora Térmica <span class="text-red-500">*</span>
                        </label>
                        
                        <div *ngIf="impresoraValidada" class="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md animate-fade-in">
                            <i class="pi pi-check-circle"></i> Lista
                        </div>
                    </div>
                    
                    <div class="flex gap-3">
                        <p-dropdown
                            formControlName="impresoraId"
                            [options]="impresoras"
                            optionLabel="nombre"
                            optionValue="id"
                            placeholder="Seleccione dispositivo"
                            styleClass="w-full border-none bg-surface-50 dark:bg-surface-800 rounded-xl h-12 flex items-center px-3 shadow-sm focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900 transition-all"
                            class="flex-1"
                            [showClear]="true"
                            appendTo="body"
                        >
                            <ng-template pTemplate="selectedItem" let-selected>
                                <div class="flex items-center gap-2 font-medium truncate">
                                    <i class="pi pi-print text-purple-500"></i>
                                    <span>{{ selected.nombre }}</span>
                                </div>
                            </ng-template>
                            <ng-template pTemplate="item" let-impresora>
                                <div class="flex flex-col py-1">
                                    <span class="font-medium">{{ impresora.nombre }}</span>
                                    <span class="text-xs text-surface-500">{{ impresora.puerto }}</span>
                                </div>
                            </ng-template>
                        </p-dropdown>
                        
                        <button
                            type="button"
                            [disabled]="!form.get('impresoraId')?.value || validandoImpresora"
                            class="w-12 h-12 rounded-xl bg-surface-900 dark:bg-surface-0 text-white dark:text-surface-900 flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                            (click)="validarImpresora()"
                            pTooltip="Probar conexión"
                            tooltipPosition="top"
                        >
                            <i class="pi" [ngClass]="validandoImpresora ? 'pi-spin pi-spinner' : 'pi-bolt'"></i>
                        </button>
                    </div>
                </div>

                <div class="md:col-span-2 space-y-2">
                    <label class="text-sm font-bold text-surface-700 dark:text-surface-200 tracking-tight flex items-center gap-2">
                        <i class="pi pi-align-left text-surface-400"></i> Notas Adicionales
                    </label>
                    <textarea
                      pInputTextarea
                      formControlName="observaciones"
                      rows="3"
                      placeholder="Ej. Billetes de alta denominación, cambio inicial..."
                      class="w-full bg-surface-50 dark:bg-surface-800 border-none rounded-xl p-4 shadow-sm resize-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition-all placeholder:text-surface-400"
                    ></textarea>
                </div>
            </div>
        </form>
      </div>

      <div class="px-8 py-6 border-t border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 sticky bottom-0 z-50">
          <button
            type="button"
            class="group w-full py-4 bg-surface-900 dark:bg-surface-0 hover:bg-black dark:hover:bg-surface-200 text-white dark:text-surface-900 rounded-2xl font-bold text-xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3"
            [disabled]="form.invalid || loading"
            (click)="onSubmit()"
          >
            <span *ngIf="!loading">Confirmar Apertura</span>
            <span *ngIf="loading">Abriendo Caja...</span>
            <i class="pi" [ngClass]="loading ? 'pi-spin pi-spinner' : 'pi-arrow-right group-hover:translate-x-1 transition-transform'"></i>
          </button>
      </div>
    </div>
  `,
  styles: [`
    /* ========================================= */
    /* AQUÍ ESTÁ LA MEJORA QUE PEDISTE MI REY  */
    /* ========================================= */

    :host ::ng-deep .zen-money-input .p-inputnumber-input {
        /* Aumentado de 4rem a 5.5rem */
        font-size: 5.5rem !important; 
        
       
        font-weight: 700 !important;
        
        /* Ajuste fino */
        letter-spacing: -3px !important;
        line-height: 1 !important;
        
        /* Resto de estilos base */
        text-align: center;
        background: transparent;
        border: none;
        box-shadow: none !important;
        padding: 0;
        margin: 0;
        width: 100%;
        color: var(--surface-900);
    }
    
    /* Soporte Dark Mode */
    :host ::ng-deep .dark .zen-money-input .p-inputnumber-input {
        color: #ffffff;
    }

    /* Ajuste del placeholder */
    :host ::ng-deep .zen-money-input .p-inputnumber-input::placeholder {
        color: var(--surface-300);
        font-weight: 700;
        opacity: 0.5;
    }

    /* Asegurar que el contenedor padre no restrinja el tamaño */
    :host ::ng-deep .zen-money-input {
        width: 100%;
        display: block;
    }

    /* ========================================= */
    
    /* Asegurar que los dropdowns sólidos no tengan borde de PrimeNG */
    :host ::ng-deep .p-dropdown {
        border: none !important;
    }
  `]
})
export class AperturaCajaDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(DynamicDialogRef);

  form!: FormGroup;
  loading = false;
  validandoImpresora = false;
  impresoraValidada = false;

  tiendas: Tienda[] = [
    { id: 1, nombre: 'Tienda Principal', direccion: 'Av. Principal 123', telefono: '', ruc: '' },
    { id: 2, nombre: 'Sucursal Norte', direccion: 'Jr. Norte 456', telefono: '', ruc: '' },
    { id: 3, nombre: 'Sucursal Sur', direccion: 'Av. Sur 789', telefono: '', ruc: '' }
  ];

  impresoras: ImpresoraConfig[] = [
    { id: 'printer-1', nombre: 'Epson TM-T20III', puerto: 'COM1', tipo: 'TERMICA_80mm', habilitada: true },
    { id: 'printer-2', nombre: 'Star Micronics TSP100', puerto: 'USB', tipo: 'TERMICA_80mm', habilitada: true }
  ];

  turnos = [
    { label: 'Turno Mañana (07:00 - 15:00)', value: 'MAÑANA' },
    { label: 'Turno Tarde (15:00 - 23:00)', value: 'TARDE' },
    { label: 'Turno Noche (23:00 - 07:00)', value: 'NOCHE' }
  ];

  ngOnInit(): void {
    this.initForm();
    this.form.get('impresoraId')?.valueChanges.subscribe(() => {
      this.impresoraValidada = false;
    });
  }

  private initForm(): void {
    this.form = this.fb.group({
      montoInicial: [null, [Validators.required, Validators.min(0)]],
      tiendaId: [null, Validators.required],
      impresoraId: [null, Validators.required],
      turno: [null, Validators.required],
      observaciones: ['']
    });
  }

  validarImpresora(): void {
    const impresoraId = this.form.get('impresoraId')?.value;
    if (!impresoraId) return;

    this.validandoImpresora = true;
    this.impresoraValidada = false;

    setTimeout(() => {
      this.validandoImpresora = false;
      this.impresoraValidada = true;
    }, 1500);
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    
    if (this.form.valid) {
      this.loading = true;
      const data: AperturaCajaRequest = this.form.value;
      
      const tiendaSeleccionada = this.tiendas.find(t => t.id === data.tiendaId);
      const impresoraSeleccionada = this.impresoras.find(i => i.id === data.impresoraId);
      
      setTimeout(() => {
        this.loading = false;
        this.dialogRef.close({
          ...data,
          tienda: tiendaSeleccionada,
          impresora: impresoraSeleccionada
        });
      }, 1000);
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
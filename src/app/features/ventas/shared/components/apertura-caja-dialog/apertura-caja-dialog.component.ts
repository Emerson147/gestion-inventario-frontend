import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { TooltipModule } from 'primeng/tooltip';
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
    <div class="flex flex-col h-full bg-white dark:bg-surface-950">
      
      <div class="flex items-center justify-between px-8 py-6 border-b border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 sticky top-0 z-50">
          <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
                  <i class="pi pi-lock-open text-xl"></i>
              </div>
              <div>
                  <h2 class="text-xl font-bold text-surface-900 dark:text-surface-0 m-0 leading-none">Apertura de Caja</h2>
                  <span class="text-sm text-surface-500 dark:text-surface-400 mt-1 block">Configuración de sesión inicial</span>
              </div>
          </div>
          <button (click)="onCancel()" class="w-8 h-8 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center text-surface-500 hover:text-surface-900 transition-colors">
              <i class="pi pi-times"></i>
          </button>
      </div>

      <div class="p-8 overflow-y-auto custom-scrollbar flex-1">
        <form [formGroup]="form" class="space-y-8">
            
            <div class="bg-surface-50 dark:bg-surface-800/50 rounded-3xl p-8 text-center border border-surface-200 dark:border-surface-700">
                <label class="block text-xs font-bold text-surface-400 uppercase tracking-widest mb-4">Efectivo Inicial en Caja</label>
                <div class="relative inline-block w-full max-w-xs mx-auto">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-surface-400">S/.</span>
                    <p-inputNumber 
                        formControlName="montoInicial" 
                        mode="decimal" 
                        [minFractionDigits]="2" 
                        [maxFractionDigits]="2"
                        placeholder="0.00"
                        styleClass="w-full text-center"
                        inputStyleClass="w-full text-5xl font-bold text-center bg-transparent border-none focus:ring-0 p-0 text-surface-900 dark:text-surface-0 placeholder:text-surface-300"
                    ></p-inputNumber>
                </div>
                <p class="text-sm text-surface-500 mt-2">Ingresa el monto físico contado</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div class="space-y-2">
                    <label class="text-sm font-bold text-surface-700 dark:text-surface-200">Sucursal de Operación</label>
                    <p-dropdown 
                        [options]="tiendas" 
                        formControlName="tiendaId" 
                        optionLabel="nombre" 
                        optionValue="id"
                        placeholder="Seleccionar Tienda"
                        styleClass="w-full border-none bg-surface-50 dark:bg-surface-800 rounded-xl h-12 flex items-center px-2"
                        panelStyleClass="border-none shadow-xl rounded-xl overflow-hidden"
                    >
                        <ng-template pTemplate="selectedItem" let-selected>
                            <div class="flex items-center gap-2" *ngIf="selected">
                                <i class="pi pi-building text-indigo-500"></i>
                                <span class="font-medium">{{ selected.nombre }}</span>
                            </div>
                        </ng-template>
                        <ng-template pTemplate="item" let-item>
                            <div class="flex items-center gap-2 p-2">
                                <i class="pi pi-building text-surface-400"></i>
                                <span>{{ item.nombre }}</span>
                            </div>
                        </ng-template>
                    </p-dropdown>
                </div>

                <div class="space-y-2">
                    <label class="text-sm font-bold text-surface-700 dark:text-surface-200">Turno Asignado</label>
                    <p-dropdown 
                        [options]="turnos" 
                        formControlName="turno" 
                        optionLabel="label" 
                        optionValue="value"
                        placeholder="Seleccionar Turno"
                        styleClass="w-full border-none bg-surface-50 dark:bg-surface-800 rounded-xl h-12 flex items-center px-2"
                    >
                         <ng-template pTemplate="selectedItem" let-selected>
                            <div class="flex items-center gap-2" *ngIf="selected">
                                <i class="pi pi-clock text-emerald-500"></i>
                                <span class="font-medium">{{ selected.label }}</span>
                            </div>
                        </ng-template>
                    </p-dropdown>
                </div>

                <div class="md:col-span-2 space-y-2">
                    <div class="flex justify-between items-center">
                        <label class="text-sm font-bold text-surface-700 dark:text-surface-200">Impresora de Tickets</label>
                        <span *ngIf="impresoraValidada" class="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-fade-in">
                            <i class="pi pi-check-circle"></i> Conectado
                        </span>
                    </div>
                    
                    <div class="flex gap-3">
                        <p-dropdown 
                            [options]="impresoras" 
                            formControlName="impresoraId" 
                            optionLabel="nombre" 
                            optionValue="id"
                            placeholder="Seleccionar Dispositivo"
                            styleClass="w-full border-none bg-surface-50 dark:bg-surface-800 rounded-xl h-12 flex items-center px-2"
                            class="flex-1"
                        >
                             <ng-template pTemplate="selectedItem" let-selected>
                                <div class="flex items-center gap-2" *ngIf="selected">
                                    <i class="pi pi-print text-purple-500"></i>
                                    <span class="font-medium">{{ selected.nombre }}</span>
                                </div>
                            </ng-template>
                        </p-dropdown>
                        
                        <button 
                            type="button" 
                            (click)="validarImpresora()"
                            [disabled]="!form.get('impresoraId')?.value || validandoImpresora"
                            class="w-12 h-12 rounded-xl bg-surface-900 dark:bg-surface-0 text-white dark:text-surface-900 flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100 shadow-md">
                            <i class="pi" [ngClass]="validandoImpresora ? 'pi-spin pi-spinner' : 'pi-bolt'"></i>
                        </button>
                    </div>
                </div>

                <div class="md:col-span-2 space-y-2">
                    <label class="text-sm font-bold text-surface-700 dark:text-surface-200">Observaciones (Opcional)</label>
                    <textarea 
                        pInputTextarea 
                        formControlName="observaciones" 
                        rows="3" 
                        class="w-full bg-surface-50 dark:bg-surface-800 border-none rounded-xl p-4 resize-none focus:ring-2 focus:ring-primary-500 transition-all"
                        placeholder="Ej. Billetes de alta denominación..."
                    ></textarea>
                </div>

            </div>
        </form>
      </div>

      <div class="p-8 border-t border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 sticky bottom-0 z-50">
          <button 
            (click)="onSubmit()"
            [disabled]="form.invalid || loading"
            class="w-full py-4 bg-surface-900 dark:bg-surface-0 hover:bg-black dark:hover:bg-surface-200 text-white dark:text-surface-900 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-2">
            <span *ngIf="!loading">Confirmar Apertura</span>
            <span *ngIf="loading">Procesando...</span>
            <i class="pi" [ngClass]="loading ? 'pi-spin pi-spinner' : 'pi-check-circle'"></i>
          </button>
      </div>

    </div>
  `,
  styles: [`
    :host ::ng-deep .p-inputnumber-input {
        text-align: center; 
        font-size: 3rem; 
        font-weight: 800;
        background: transparent;
        border: none;
        box-shadow: none !important;
    }
  `]
})
export class AperturaCajaDialogComponent implements OnInit {
  // ... (Tu lógica existente se mantiene igual)
  form!: FormGroup;
  loading = false;
  validandoImpresora = false;
  impresoraValidada = false;
  
  // Mock Data
  tiendas = [
    { id: 1, nombre: 'Tienda Principal' },
    { id: 2, nombre: 'Sucursal Norte' }
  ];
  
  impresoras = [
    { id: 'p1', nombre: 'Epson TM-T20III' },
    { id: 'p2', nombre: 'Star Micronics' }
  ];

  turnos = [
    { label: 'Mañana', value: 'M' },
    { label: 'Tarde', value: 'T' }
  ];

  constructor(private fb: FormBuilder, private dialogRef: DynamicDialogRef) {}

  ngOnInit() {
    this.form = this.fb.group({
      montoInicial: [null, [Validators.required, Validators.min(0)]],
      tiendaId: [null, Validators.required],
      impresoraId: [null, Validators.required],
      turno: [null, Validators.required],
      observaciones: ['']
    });

    this.form.get('impresoraId')?.valueChanges.subscribe(() => {
        this.impresoraValidada = false;
    });
  }

  validarImpresora() {
    this.validandoImpresora = true;
    setTimeout(() => {
        this.validandoImpresora = false;
        this.impresoraValidada = true;
    }, 1500);
  }

  onSubmit() {
    if (this.form.valid) {
        this.loading = true;
        setTimeout(() => {
            this.loading = false;
            this.dialogRef.close(this.form.value);
        }, 1000);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
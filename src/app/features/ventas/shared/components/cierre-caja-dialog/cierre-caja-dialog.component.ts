import { Component, OnInit, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext'; // Importante para la observación
import { EstadoCaja, CierreCajaResponse } from '../../models/caja.model';

@Component({
  selector: 'app-cierre-caja-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputNumberModule,
    InputTextModule
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="flex flex-col h-full bg-white dark:bg-surface-900 text-surface-700 dark:text-surface-200 font-sans">
      
      <div class="text-center mb-6 pt-2">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-100 dark:bg-surface-800 text-[10px] font-bold uppercase tracking-widest text-surface-500 mb-2">
          <i class="pi pi-building"></i> {{ estadoCaja.tienda?.nombre || 'Tienda Principal' }}
        </div>
        <h2 class="text-2xl font-black text-surface-900 dark:text-surface-0 tracking-tight leading-none">
          Cierre de Turno
        </h2>
        <p class="text-xs text-surface-400 font-medium mt-1">
          Abierto: {{ formatDate(estadoCaja.fechaApertura) }} &bull; por {{ estadoCaja.usuarioApertura }}
        </p>
      </div>

      <div class="grid grid-cols-3 gap-2 mb-8 text-center select-none px-4">
        
        <div class="p-3 rounded-2xl bg-surface-50 dark:bg-surface-800 border border-surface-100 dark:border-surface-700">
          <div class="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-1">Base Inicial</div>
          <div class="font-mono font-bold text-surface-600 dark:text-surface-300">
            {{ formatMoney(estadoCaja.montoInicial) }}
          </div>
        </div>

        <div class="p-3 rounded-2xl bg-surface-50 dark:bg-surface-800 border border-surface-100 dark:border-surface-700 relative">
          <div class="absolute -left-3 top-1/2 -translate-y-1/2 text-surface-300 z-10 font-bold">+</div>
          <div class="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-1">Ventas Efec.</div>
          <div class="font-mono font-bold text-emerald-600">
            {{ formatMoney(estadoCaja.totalVentasDelDia) }}
          </div>
        </div>

        <div class="p-3 rounded-2xl bg-surface-900 dark:bg-surface-0 text-white dark:text-surface-900 shadow-lg relative overflow-hidden">
          <div class="absolute -left-3 top-1/2 -translate-y-1/2 text-surface-300 z-10 font-bold">=</div>
          <div class="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-1">Debes Tener</div>
          <div class="font-mono font-black text-lg">
            {{ formatMoney(getEfectivoEsperado()) }}
          </div>
        </div>

      </div>

      <form [formGroup]="form" class="flex flex-col gap-6 px-4 pb-4">
        
        <div class="relative group">
          <div 
            class="absolute inset-0 bg-surface-50 dark:bg-surface-800 rounded-[2.5rem] border-2 transition-all duration-300"
            [ngClass]="getBorderClass()"
          ></div>
          
          <div class="relative p-8 text-center z-10">
            <label class="block text-[10px] font-bold uppercase tracking-[0.2em] text-surface-400 mb-4">
              Conteo Físico Real
            </label>
            
            <div class="relative flex items-baseline justify-center gap-2">
                <span class="text-4xl font-bold text-surface-400 dark:text-surface-500 transform -translate-y-2">S/.</span>
                
                <p-inputNumber 
                  formControlName="montoContado"
                  mode="decimal" 
                  [minFractionDigits]="2" 
                  [maxFractionDigits]="2"
                  locale="es-PE"
                  placeholder="0.00"
                  styleClass="zen-money-input"
                  inputStyleClass="zen-input-field"
                  (onInput)="calcularDiferencia()"
                ></p-inputNumber>
            </div>

            <div class="h-6 mt-4 flex items-center justify-center transition-all duration-300">
              @if (form.get('montoContado')?.value !== null) {
                @if (diferencia === 0) {
                  <span class="text-xs font-black text-emerald-600 flex items-center gap-1 animate-fade-in bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
                    <i class="pi pi-check-circle"></i> Cuadre Perfecto
                  </span>
                } @else if (diferencia < 0) {
                  <span class="text-xs font-black text-red-500 flex items-center gap-1 animate-shake bg-red-50 px-3 py-1 rounded-full uppercase tracking-wider">
                    <i class="pi pi-exclamation-triangle"></i> Faltante: {{ formatMoney(Math.abs(diferencia)) }}
                  </span>
                } @else {
                  <span class="text-xs font-black text-blue-500 flex items-center gap-1 animate-fade-in bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">
                    <i class="pi pi-info-circle"></i> Sobrante: {{ formatMoney(diferencia) }}
                  </span>
                }
              } @else {
                <span class="text-xs text-surface-400 italic font-medium">Ingresa el dinero contado</span>
              }
            </div>
          </div>
        </div>

        @if (showObservacion) {
          <div class="animate-slide-down">
             <label class="text-[10px] font-bold text-surface-500 uppercase tracking-widest mb-1.5 block pl-1">
               Justificación de Diferencia <span class="text-red-500">*</span>
             </label>
             <textarea 
               pInputTextarea 
               formControlName="observaciones"
               rows="2" 
               class="w-full bg-surface-50 dark:bg-surface-800 border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-surface-900 dark:focus:ring-surface-0 transition-all resize-none placeholder:text-surface-400"
               placeholder="Explique por qué no cuadra la caja..."
             ></textarea>
             @if (form.get('observaciones')?.dirty && form.get('observaciones')?.invalid) {
               <small class="text-red-500 text-xs mt-1 block pl-1 font-bold">La justificación es obligatoria.</small>
             }
          </div>
        }

        <div class="grid grid-cols-3 gap-3 pt-2">
          <button 
            type="button"
            class="col-span-1 py-4 rounded-xl font-bold text-surface-500 hover:text-surface-900 hover:bg-surface-100 dark:hover:text-surface-0 dark:hover:bg-surface-800 transition-colors text-xs uppercase tracking-wide"
            (click)="onCancel()"
          >
            Cancelar
          </button>
          
          <button 
            type="button"
            (click)="onSubmit()"
            [disabled]="form.invalid || loading"
            class="col-span-2 py-4 bg-surface-900 dark:bg-surface-0 hover:bg-black dark:hover:bg-surface-200 text-white dark:text-surface-900 rounded-xl font-black text-sm shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-2"
          >
            <i class="pi" [ngClass]="loading ? 'pi-spin pi-spinner' : 'pi-lock'"></i>
            <span>{{ loading ? 'CERRANDO...' : 'CONFIRMAR CIERRE' }}</span>
          </button>
        </div>

      </form>
    </div>
  `,
  styles: [`
    /* ========================================= */
    /* ESTILOS HEROICOS (Iguales a Apertura)     */
    /* ========================================= */

    :host ::ng-deep .zen-money-input .p-inputnumber-input {
        /* Tamaño Masivo */
        font-size: 5.5rem !important; 
        font-weight: 900 !important;
        letter-spacing: -3px !important;
        line-height: 1 !important;
        
        /* Layout */
        text-align: center;
        background: transparent;
        border: none;
        box-shadow: none !important;
        padding: 0;
        margin: 0;
        width: 100%;
        color: var(--surface-900);
    }
    
    :host ::ng-deep .dark .zen-money-input .p-inputnumber-input {
        color: #ffffff;
    }

    :host ::ng-deep .zen-money-input .p-inputnumber-input::placeholder {
        color: var(--surface-300);
        font-weight: 700;
        opacity: 0.3;
    }

    /* Contenedor fluido */
    :host ::ng-deep .zen-money-input {
        width: 100%;
        display: block;
    }

    /* Animaciones */
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    .animate-slide-down { animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); height: 0; } to { opacity: 1; transform: translateY(0); height: auto; } }
    @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }
  `]
})
export class CierreCajaDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(DynamicDialogRef);
  private config = inject(DynamicDialogConfig);

  form!: FormGroup;
  loading = false;
  estadoCaja!: EstadoCaja;
  diferencia = 0;
  Math = Math;
  showObservacion = false;

  ngOnInit(): void {
    // Mock Data para visualizar si no llega config
    this.estadoCaja = this.config.data?.estadoCaja || {
      montoInicial: 100.00,
      totalVentasDelDia: 450.50,
      cantidadVentas: 12,
      fechaApertura: new Date(),
      usuarioApertura: 'Admin'
    };
    
    this.initForm();
  }

  private initForm(): void {
    this.form = this.fb.group({
      montoContado: [null, [Validators.required, Validators.min(0)]],
      observaciones: ['']
    });
  }

  getEfectivoEsperado(): number {
    return (this.estadoCaja.montoInicial || 0) + (this.estadoCaja.totalVentasDelDia || 0);
  }

  calcularDiferencia(): void {
    const contado = this.form.get('montoContado')?.value;
    
    if (contado !== null) {
      const esperado = this.getEfectivoEsperado();
      this.diferencia = contado - esperado;
      
      const hayDiferenciaReal = Math.abs(this.diferencia) >= 0.1;
      this.showObservacion = hayDiferenciaReal;

      const obsControl = this.form.get('observaciones');
      if (hayDiferenciaReal) {
        obsControl?.setValidators([Validators.required, Validators.minLength(5)]);
      } else {
        obsControl?.clearValidators();
        obsControl?.setValue('');
      }
      obsControl?.updateValueAndValidity();
      
    } else {
      this.diferencia = 0;
      this.showObservacion = false;
    }
  }

  // Estilo dinámico del borde
  getBorderClass(): string {
    const val = this.form.get('montoContado')?.value;
    if (val === null) return 'border-surface-200 dark:border-surface-700'; // Neutro
    if (this.diferencia === 0) return 'border-emerald-500 bg-emerald-50/10 dark:bg-emerald-900/10'; // Perfecto
    if (this.diferencia < 0) return 'border-red-500 bg-red-50/10 dark:bg-red-900/10'; // Faltante
    return 'border-blue-500 bg-blue-50/10 dark:bg-blue-900/10'; // Sobrante
  }

  formatMoney(val: number | undefined): string {
    return (val || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.loading = true;
      
      const response: CierreCajaResponse = {
        montoFinal: this.form.get('montoContado')?.value,
        diferencia: this.diferencia,
        observaciones: this.form.get('observaciones')?.value, 
        ventasEfectivo: this.estadoCaja.totalVentasDelDia,
        ventasTarjeta: 0,
        totalVentas: this.estadoCaja.totalVentasDelDia,
        cantidadVentas: this.estadoCaja.cantidadVentas
      };

      setTimeout(() => {
        this.loading = false;
        this.dialogRef.close(response);
      }, 500);
    } else {
        this.form.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
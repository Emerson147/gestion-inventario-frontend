import { Component, OnInit, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
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
    InputTextModule,
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      class="flex flex-col h-full bg-white dark:bg-surface-900 text-surface-700 dark:text-surface-200 font-sans"
    >
      <div class="text-center mb-8 pt-4">
        <div
          class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-50 dark:bg-surface-800 text-[10px] font-bold uppercase tracking-widest text-surface-400 mb-3 border border-surface-100 dark:border-surface-700"
        >
          <i class="pi pi-building"></i>
          {{ estadoCaja.tienda?.nombre || 'Tienda Principal' }}
        </div>
        <h2
          class="text-3xl font-black text-surface-900 dark:text-surface-0 tracking-tight leading-none mb-1"
        >
          Cierre de Turno
        </h2>
        <p
          class="text-[10px] font-bold uppercase tracking-widest text-surface-400"
        >
          Abierto: {{ formatDate(estadoCaja.fechaApertura) }} &bull; por
          {{ estadoCaja.usuarioApertura }}
        </p>
      </div>

      <div class="grid grid-cols-3 gap-2 mb-8 text-center select-none px-4">
        <div
          class="p-4 rounded-2xl bg-surface-50 dark:bg-surface-800 border border-surface-100 dark:border-surface-700"
        >
          <div
            class="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-1"
          >
            Base Inicial
          </div>
          <div
            class="font-mono font-bold text-lg text-surface-600 dark:text-surface-300"
          >
            {{ formatMoney(estadoCaja.montoInicial) }}
          </div>
        </div>

        <div
          class="p-4 rounded-2xl bg-surface-50 dark:bg-surface-800 border border-surface-100 dark:border-surface-700 relative"
        >
          <div
            class="absolute -left-3 top-1/2 -translate-y-1/2 text-surface-300 z-10 font-bold bg-white dark:bg-surface-900 rounded-full w-5 h-5 flex items-center justify-center border border-surface-100 dark:border-surface-700 shadow-sm text-xs"
          >
            +
          </div>
          <div
            class="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-1"
          >
            Ventas Efec.
          </div>
          <div
            class="font-mono font-bold text-lg text-emerald-600 dark:text-emerald-400"
          >
            {{ formatMoney(estadoCaja.totalVentasDelDia) }}
          </div>
        </div>

        <div
          class="p-4 rounded-2xl bg-surface-900 dark:bg-surface-0 text-white dark:text-surface-900 shadow-lg relative overflow-hidden group"
        >
          <div
            class="absolute -left-3 top-1/2 -translate-y-1/2 text-surface-400 z-10 font-bold bg-white dark:bg-surface-800 rounded-full w-5 h-5 flex items-center justify-center border border-surface-200 dark:border-surface-600 shadow-sm text-xs"
          >
            =
          </div>
          <div
            class="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-1"
          >
            Debes Tener
          </div>
          <div class="font-mono font-black text-xl tracking-tight">
            {{ formatMoney(getEfectivoEsperado()) }}
          </div>
        </div>
      </div>

      <form [formGroup]="form" class="flex flex-col gap-6 px-4 pb-4">
        <div class="relative group">
          <div
            class="absolute inset-0 bg-surface-50 dark:bg-surface-800 rounded-[2.5rem] border transition-all duration-500"
            [ngClass]="getBorderClass()"
          ></div>

          <div class="relative p-8 text-center z-10">
            <label
              class="block text-[10px] font-bold uppercase tracking-widest text-surface-400 mb-4"
            >
              Conteo Físico Real
            </label>

            <div class="relative flex items-baseline justify-center gap-2">
              <span
                class="text-3xl font-bold text-surface-300 dark:text-surface-600 transform -translate-y-4"
                >S/.</span
              >

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

            <div
              class="h-8 mt-5 flex items-center justify-center transition-all duration-300"
            >
              @if (form.get('montoContado')?.value !== null) {
                @if (diferencia === 0) {
                  <span
                    class="text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-fade-in bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-xl uppercase tracking-widest border border-emerald-100 dark:border-emerald-900/30"
                  >
                    <i class="pi pi-check-circle text-sm"></i> Cuadre Perfecto
                  </span>
                } @else if (diferencia < 0) {
                  <span
                    class="text-[10px] font-black text-red-600 dark:text-red-400 flex items-center gap-1.5 animate-shake bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-xl uppercase tracking-widest border border-red-100 dark:border-red-900/30"
                  >
                    <i class="pi pi-exclamation-triangle text-sm"></i> Faltante:
                    {{ formatMoney(Math.abs(diferencia)) }}
                  </span>
                } @else {
                  <span
                    class="text-[10px] font-black text-blue-600 dark:text-blue-400 flex items-center gap-1.5 animate-fade-in bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-xl uppercase tracking-widest border border-blue-100 dark:border-blue-900/30"
                  >
                    <i class="pi pi-info-circle text-sm"></i> Sobrante:
                    {{ formatMoney(diferencia) }}
                  </span>
                }
              } @else {
                <span
                  class="text-[10px] text-surface-300 dark:text-surface-600 font-bold uppercase tracking-widest"
                  >Ingresa el dinero contado</span
                >
              }
            </div>
          </div>
        </div>

        @if (showObservacion) {
          <div class="animate-slide-down">
            <label
              class="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2 block pl-1"
            >
              Justificación de Diferencia <span class="text-red-500">*</span>
            </label>
            <textarea
              pInputTextarea
              formControlName="observaciones"
              rows="2"
              class="w-full bg-surface-50 dark:bg-surface-800 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-surface-200 dark:focus:ring-surface-700 focus:bg-white dark:focus:bg-surface-900 transition-all resize-none placeholder:text-surface-400"
              placeholder="Explique por qué no cuadra la caja..."
            ></textarea>
            @if (
              form.get('observaciones')?.dirty &&
              form.get('observaciones')?.invalid
            ) {
              <small
                class="text-red-500 text-[10px] font-bold uppercase tracking-wide mt-1 block pl-1"
                >La justificación es obligatoria.</small
              >
            }
          </div>
        }

        <div class="grid grid-cols-3 gap-3 pt-2">
          <button
            type="button"
            class="col-span-1 py-4 rounded-2xl font-bold text-surface-400 hover:text-surface-900 hover:bg-surface-50 dark:hover:text-surface-0 dark:hover:bg-surface-800 transition-all text-xs uppercase tracking-widest"
            (click)="onCancel()"
          >
            Cancelar
          </button>

          <button
            type="button"
            (click)="onSubmit()"
            [disabled]="form.invalid || loading"
            class="col-span-2 py-4 bg-surface-900 dark:bg-surface-0 hover:bg-black dark:hover:bg-surface-200 text-white dark:text-surface-900 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 active:scale-[0.98] flex items-center justify-center gap-3"
          >
            <i
              class="pi"
              [ngClass]="loading ? 'pi-spin pi-spinner' : 'pi-lock'"
            ></i>
            <span>{{ loading ? 'CERRANDO...' : 'CONFIRMAR CIERRE' }}</span>
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
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
      .animate-fade-in {
        animation: fadeIn 0.4s ease-out;
      }
      .animate-slide-down {
        animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .animate-shake {
        animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(5px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
          height: 0;
        }
        to {
          opacity: 1;
          transform: translateY(0);
          height: auto;
        }
      }
      @keyframes shake {
        10%,
        90% {
          transform: translate3d(-1px, 0, 0);
        }
        20%,
        80% {
          transform: translate3d(2px, 0, 0);
        }
        30%,
        50%,
        70% {
          transform: translate3d(-4px, 0, 0);
        }
        40%,
        60% {
          transform: translate3d(4px, 0, 0);
        }
      }
    `,
  ],
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
      montoInicial: 100.0,
      totalVentasDelDia: 450.5,
      cantidadVentas: 12,
      fechaApertura: new Date(),
      usuarioApertura: 'Admin',
    };

    this.initForm();
  }

  private initForm(): void {
    this.form = this.fb.group({
      montoContado: [null, [Validators.required, Validators.min(0)]],
      observaciones: [''],
    });
  }

  getEfectivoEsperado(): number {
    return (
      (this.estadoCaja.montoInicial || 0) +
      (this.estadoCaja.totalVentasDelDia || 0)
    );
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
        obsControl?.setValidators([
          Validators.required,
          Validators.minLength(5),
        ]);
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
    if (val === null) return 'border-surface-100 dark:border-surface-700'; // Neutro
    if (this.diferencia === 0)
      return 'border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-900/10 shadow-[0_0_30px_-10px_rgba(16,185,129,0.2)]'; // Perfecto
    if (this.diferencia < 0)
      return 'border-red-500/50 bg-red-50/20 dark:bg-red-900/10'; // Faltante
    return 'border-blue-500/50 bg-blue-50/20 dark:bg-blue-900/10'; // Sobrante
  }

  formatMoney(val: number | undefined): string {
    return (val || 0).toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('es-PE', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
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
        cantidadVentas: this.estadoCaja.cantidadVentas,
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

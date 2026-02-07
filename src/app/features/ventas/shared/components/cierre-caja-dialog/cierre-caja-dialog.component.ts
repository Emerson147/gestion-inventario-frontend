import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { EstadoCaja, CierreCajaResponse } from '../../models/caja.model';

@Component({
  selector: 'app-cierre-caja-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputNumberModule,
    DividerModule,
    TagModule
  ],
  template: `
    <div class="p-6">
      <!-- Header -->
      <div class="mb-6 text-center">
        <div class="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg">
          <i class="pi pi-lock text-white text-3xl"></i>
        </div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Cierre de Caja</h2>
        <p class="text-gray-600">Resumen financiero de la sesión</p>
      </div>

      <!-- Información de Sesión -->
      <div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 mb-6 border border-gray-200">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-xs text-gray-500 mb-1">Tienda</p>
            <p class="font-semibold text-gray-900">{{ estadoCaja.tienda?.nombre || 'N/A' }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 mb-1">Turno</p>
            <p-tag [value]="estadoCaja.turno || 'N/A'" [severity]="getTurnoSeverity(estadoCaja.turno || undefined)" />
          </div>
          <div>
            <p class="text-xs text-gray-500 mb-1">Apertura</p>
            <p class="text-sm text-gray-700">{{ formatDate(estadoCaja.fechaApertura || undefined) }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 mb-1">Usuario</p>
            <p class="text-sm text-gray-700">{{ estadoCaja.usuarioApertura }}</p>
          </div>
        </div>
      </div>

      <!-- Resumen Financiero -->
      <div class="space-y-4 mb-6">
        <!-- Monto Inicial -->
        <div class="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <i class="pi pi-wallet text-white"></i>
            </div>
            <div>
              <p class="text-xs text-blue-600 font-medium">Monto Inicial</p>
              <p class="text-lg font-bold text-blue-900">S/ {{ formatMoney(estadoCaja.montoInicial) }}</p>
            </div>
          </div>
        </div>

        <!-- Ventas del Día -->
        <div class="grid grid-cols-2 gap-3">
          <div class="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <div class="flex items-center gap-2 mb-2">
              <i class="pi pi-shopping-cart text-emerald-600"></i>
              <p class="text-xs text-emerald-600 font-medium">Total Ventas</p>
            </div>
            <p class="text-xl font-bold text-emerald-900">S/ {{ formatMoney(estadoCaja.totalVentasDelDia) }}</p>
            <p class="text-xs text-emerald-600 mt-1">{{ estadoCaja.cantidadVentas }} transacciones</p>
          </div>

          <div class="p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div class="flex items-center gap-2 mb-2">
              <i class="pi pi-calculator text-purple-600"></i>
              <p class="text-xs text-purple-600 font-medium">Efectivo Esperado</p>
            </div>
            <p class="text-xl font-bold text-purple-900">S/ {{ formatMoney(getEfectivoEsperado()) }}</p>
          </div>
        </div>

        <p-divider />

        <!-- Conteo de Efectivo -->
        <form [formGroup]="form">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              <i class="pi pi-money-bill text-emerald-600 mr-2"></i>
              Conteo de Efectivo Real *
            </label>
            <p-inputNumber
              formControlName="montoContado"
              mode="currency"
              currency="PEN"
              locale="es-PE"
              [min]="0"
              styleClass="w-full"
              placeholder="0.00"
              (onInput)="calcularDiferencia()"
            />
            <small class="text-gray-500 mt-1 block">
              Ingrese el efectivo físico contado en caja
            </small>
          </div>
        </form>

        <!-- Diferencia -->
        <div 
          class="p-4 rounded-lg border-2"
          [ngClass]="{
            'bg-emerald-50 border-emerald-400': diferencia === 0,
            'bg-amber-50 border-amber-400': diferencia !== 0 && Math.abs(diferencia) <= 10,
            'bg-rose-50 border-rose-400': Math.abs(diferencia) > 10
          }"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold" [ngClass]="{
                'text-emerald-700': diferencia === 0,
                'text-amber-700': diferencia !== 0 && Math.abs(diferencia) <= 10,
                'text-rose-700': Math.abs(diferencia) > 10
              }">
                <i class="pi mr-2" [ngClass]="{
                  'pi-check-circle': diferencia === 0,
                  'pi-exclamation-triangle': diferencia !== 0 && Math.abs(diferencia) <= 10,
                  'pi-times-circle': Math.abs(diferencia) > 10
                }"></i>
                {{ getDiferenciaLabel() }}
              </p>
              <p class="text-xs mt-1" [ngClass]="{
                'text-emerald-600': diferencia === 0,
                'text-amber-600': diferencia !== 0 && Math.abs(diferencia) <= 10,
                'text-rose-600': Math.abs(diferencia) > 10
              }">
                {{ getDiferenciaMessage() }}
              </p>
            </div>
            <div class="text-right">
              <p class="text-2xl font-bold" [ngClass]="{
                'text-emerald-700': diferencia === 0,
                'text-amber-700': diferencia !== 0 && Math.abs(diferencia) <= 10,
                'text-rose-700': Math.abs(diferencia) > 10
              }">
                {{ diferencia > 0 ? '+' : '' }}S/ {{ formatMoney(Math.abs(diferencia)) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Botones -->
      <div class="flex gap-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          pButton
          label="Cancelar"
          icon="pi pi-times"
          class="flex-1"
          [outlined]="true"
          severity="secondary"
          (click)="onCancel()"
        ></button>
        <button
          type="button"
          pButton
          label="Cerrar Caja"
          icon="pi pi-lock"
          class="flex-1"
          severity="danger"
          [disabled]="form.invalid || loading"
          [loading]="loading"
          (click)="onSubmit()"
        ></button>
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep {
      .p-inputnumber {
        width: 100%;
      }
      
      .p-inputnumber-input {
        width: 100%;
        font-size: 1.25rem;
        font-weight: 600;
        text-align: center;
      }
    }
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

  ngOnInit(): void {
    this.estadoCaja = this.config.data.estadoCaja;
    this.initForm();
  }

  private initForm(): void {
    this.form = this.fb.group({
      montoContado: [this.getEfectivoEsperado(), [Validators.required, Validators.min(0)]]
    });
  }

  getEfectivoEsperado(): number {
    return this.estadoCaja.montoInicial + this.estadoCaja.totalVentasDelDia;
  }

  calcularDiferencia(): void {
    const montoContado = this.form.get('montoContado')?.value || 0;
    const esperado = this.getEfectivoEsperado();
    this.diferencia = montoContado - esperado;
  }

  getDiferenciaLabel(): string {
    if (this.diferencia === 0) return 'Cuadre Perfecto';
    if (this.diferencia > 0) return 'Sobrante';
    return 'Faltante';
  }

  getDiferenciaMessage(): string {
    if (this.diferencia === 0) return 'El efectivo coincide exactamente';
    if (Math.abs(this.diferencia) <= 10) return 'Diferencia tolerable';
    return 'Diferencia significativa - requiere revisión';
  }

  getTurnoSeverity(turno: string | undefined): 'success' | 'info' | 'warning' | 'danger' {
    switch(turno) {
      case 'MAÑANA': return 'info';
      case 'TARDE': return 'warning';
      case 'NOCHE': return 'danger';
      default: return 'success';
    }
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatMoney(value: number): string {
    return value.toFixed(2);
  }

  onSubmit(): void {
    if (this.form.valid) {
      const montoContado = this.form.get('montoContado')?.value;
      
      const response: CierreCajaResponse = {
        montoFinal: montoContado,
        diferencia: this.diferencia,
        ventasEfectivo: this.estadoCaja.totalVentasDelDia, // En producción dividir por método de pago
        ventasTarjeta: 0,
        totalVentas: this.estadoCaja.totalVentasDelDia,
        cantidadVentas: this.estadoCaja.cantidadVentas
      };

      this.dialogRef.close(response);
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { TextareaModule } from 'primeng/textarea';
import { Tienda, ImpresoraConfig, AperturaCajaRequest } from '../../models/caja.model';

@Component({
  selector: 'app-apertura-caja-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    TextareaModule
  ],
  template: `
    <div class="p-6">
      <!-- Header -->
      <div class="mb-6 text-center">
        <div class="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
          <i class="pi pi-lock-open text-white text-3xl"></i>
        </div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Apertura de Caja</h2>
        <p class="text-gray-600">Complete la información para abrir la sesión</p>
      </div>

      <!-- Formulario -->
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="space-y-4">
          <!-- Monto Inicial -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              <i class="pi pi-dollar text-cyan-600 mr-2"></i>
              Monto Inicial *
            </label>
            <p-inputNumber
              formControlName="montoInicial"
              mode="currency"
              currency="PEN"
              locale="es-PE"
              [min]="0"
              styleClass="w-full"
              placeholder="0.00"
            />
            <small class="text-gray-500 mt-1 block">
              Efectivo disponible al inicio del turno
            </small>
          </div>

          <!-- Tienda -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              <i class="pi pi-building text-indigo-600 mr-2"></i>
              Tienda / Sucursal *
            </label>
            <p-dropdown
              formControlName="tiendaId"
              [options]="tiendas"
              optionLabel="nombre"
              optionValue="id"
              placeholder="Seleccione una tienda"
              styleClass="w-full"
              [showClear]="true"
            />
          </div>

          <!-- Impresora -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              <i class="pi pi-print text-purple-600 mr-2"></i>
              Impresora Térmica *
            </label>
            <p-dropdown
              formControlName="impresoraId"
              [options]="impresoras"
              optionLabel="nombre"
              optionValue="id"
              placeholder="Seleccione una impresora"
              styleClass="w-full"
              [showClear]="true"
            >
              <ng-template pTemplate="item" let-impresora>
                <div class="flex items-center gap-2">
                  <i class="pi pi-print text-gray-500"></i>
                  <div>
                    <div class="font-semibold">{{ impresora.nombre }}</div>
                    <small class="text-gray-500">{{ impresora.tipo }} - {{ impresora.puerto }}</small>
                  </div>
                </div>
              </ng-template>
            </p-dropdown>
          </div>

          <!-- Turno -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              <i class="pi pi-clock text-emerald-600 mr-2"></i>
              Turno *
            </label>
            <p-dropdown
              formControlName="turno"
              [options]="turnos"
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccione un turno"
              styleClass="w-full"
            />
          </div>

          <!-- Observaciones -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              <i class="pi pi-comment text-gray-600 mr-2"></i>
              Observaciones (opcional)
            </label>
            <textarea
              pTextarea
              formControlName="observaciones"
              rows="3"
              placeholder="Notas adicionales sobre la apertura..."
              class="w-full"
            ></textarea>
          </div>
        </div>

        <!-- Botones -->
        <div class="flex gap-3 mt-6 pt-6 border-t border-gray-200">
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
            type="submit"
            pButton
            label="Abrir Caja"
            icon="pi pi-check"
            class="flex-1"
            [disabled]="form.invalid || loading"
            [loading]="loading"
          ></button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    :host ::ng-deep {
      .p-dropdown,
      .p-inputnumber {
        width: 100%;
      }
      
      .p-inputnumber-input {
        width: 100%;
      }
    }
  `]
})
export class AperturaCajaDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(DynamicDialogRef);
  private config = inject(DynamicDialogConfig);

  form!: FormGroup;
  loading = false;

  // Datos de ejemplo (en producción vendrían del backend)
  tiendas: Tienda[] = [
    { id: 1, nombre: 'Tienda Principal', direccion: 'Av. Principal 123', telefono: '987654321', ruc: '20123456789' },
    { id: 2, nombre: 'Sucursal Norte', direccion: 'Jr. Norte 456', telefono: '987654322', ruc: '20123456790' },
    { id: 3, nombre: 'Sucursal Sur', direccion: 'Av. Sur 789', telefono: '987654323', ruc: '20123456791' }
  ];

  impresoras: ImpresoraConfig[] = [
    { id: 'printer-1', nombre: 'Impresora POS-001', puerto: 'COM1', tipo: 'TERMICA_80mm', habilitada: true },
    { id: 'printer-2', nombre: 'Impresora POS-002', puerto: 'COM2', tipo: 'TERMICA_58mm', habilitada: true },
    { id: 'printer-3', nombre: 'Impresora USB', puerto: 'USB001', tipo: 'TERMICA_80mm', habilitada: true }
  ];

  turnos = [
    { label: 'Turno Mañana (07:00 - 15:00)', value: 'MAÑANA' },
    { label: 'Turno Tarde (15:00 - 23:00)', value: 'TARDE' },
    { label: 'Turno Noche (23:00 - 07:00)', value: 'NOCHE' }
  ];

  ngOnInit(): void {
    this.initForm();
    
    // Pre-cargar datos si se pasan en la configuración
    if (this.config.data) {
      this.form.patchValue(this.config.data);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      montoInicial: [0, [Validators.required, Validators.min(0)]],
      tiendaId: [null, Validators.required],
      impresoraId: [null, Validators.required],
      turno: ['MAÑANA', Validators.required],
      observaciones: ['']
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      const data: AperturaCajaRequest = this.form.value;
      
      // Agregar información adicional
      const tiendaSeleccionada = this.tiendas.find(t => t.id === data.tiendaId);
      const impresoraSeleccionada = this.impresoras.find(i => i.id === data.impresoraId);
      
      this.dialogRef.close({
        ...data,
        tienda: tiendaSeleccionada,
        impresora: impresoraSeleccionada
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}

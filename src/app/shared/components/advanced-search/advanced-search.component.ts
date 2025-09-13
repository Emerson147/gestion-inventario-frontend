import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { CalendarModule } from 'primeng/calendar';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { AccordionModule } from 'primeng/accordion';
import { ChipModule } from 'primeng/chip';
import { EstadoInventario } from '../../../core/models/inventario.model';
import { Almacen } from '../../../core/models/almacen.model';
import { Color, Talla } from '../../../core/models/colors.model';

export interface FiltrosAvanzados {
  texto?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
  estados?: EstadoInventario[];
  cantidadMin?: number;
  cantidadMax?: number;
  almacenes?: string[];
  colores?: string[];
  tallas?: string[];
  soloStockCritico?: boolean;
  soloAgotados?: boolean;
  valorMin?: number;
  valorMax?: number;
}

@Component({
  selector: 'app-advanced-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    MultiSelectModule,
    CalendarModule,
    InputNumberModule,
    CheckboxModule,
    DialogModule,
    AccordionModule,
    ChipModule
  ],
  template: `
    <p-dialog 
      [(visible)]="visible" 
      [modal]="true" 
      [style]="{'width': '800px'}" 
      header="Búsqueda Avanzada"
      (onHide)="onHide()"
      [contentStyle]="{'padding': '0'}"
    >
      <ng-template pTemplate="content">
        <form [formGroup]="searchForm" class="p-6">
          <p-accordion [multiple]="true" [activeIndex]="[0]">
            
            <!-- Búsqueda General -->
            <p-accordionTab header="Búsqueda General">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block font-medium mb-2">Texto de búsqueda</label>
                  <input 
                    type="text" 
                    pInputText 
                    formControlName="texto"
                    placeholder="Buscar en nombre, código, serie..."
                    class="w-full"
                  />
                </div>
                
                <div>
                  <label class="block font-medium mb-2">Rango de fechas</label>
                  <div class="flex gap-2">
                    <p-calendar 
                      formControlName="fechaDesde"
                      placeholder="Desde"
                      [showIcon]="true"
                      dateFormat="dd/mm/yy"
                      class="flex-1"
                    />
                    <p-calendar 
                      formControlName="fechaHasta"
                      placeholder="Hasta"
                      [showIcon]="true"
                      dateFormat="dd/mm/yy"
                      class="flex-1"
                    />
                  </div>
                </div>
              </div>
            </p-accordionTab>

            <!-- Filtros de Estado y Stock -->
            <p-accordionTab header="Estado y Stock">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block font-medium mb-2">Estados</label>
                  <p-multiSelect
                    [options]="estadosOptions"
                    formControlName="estados"
                    placeholder="Seleccionar estados"
                    optionLabel="label"
                    optionValue="value"
                    class="w-full"
                    [showClear]="true"
                    display="chip"
                  />
                </div>

                <div>
                  <label class="block font-medium mb-2">Rango de cantidad</label>
                  <div class="flex gap-2 items-center">
                    <p-inputNumber
                      formControlName="cantidadMin"
                      placeholder="Mín"
                      [min]="0"
                      class="flex-1"
                    />
                    <span class="text-gray-500">-</span>
                    <p-inputNumber
                      formControlName="cantidadMax"
                      placeholder="Máx"
                      [min]="0"
                      class="flex-1"
                    />
                  </div>
                </div>

                <div class="md:col-span-2">
                  <div class="flex gap-4">
                    <p-checkbox
                      formControlName="soloStockCritico"
                      inputId="stockCritico"
                      [binary]="true"
                    />
                    <label for="stockCritico" class="font-medium">Solo stock crítico</label>
                  </div>
                  
                  <div class="flex gap-4 mt-2">
                    <p-checkbox
                      formControlName="soloAgotados"
                      inputId="agotados"
                      [binary]="true"
                    />
                    <label for="agotados" class="font-medium">Solo productos agotados</label>
                  </div>
                </div>
              </div>
            </p-accordionTab>

            <!-- Filtros de Ubicación y Características -->
            <p-accordionTab header="Ubicación y Características">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block font-medium mb-2">Almacenes</label>
                  <p-multiSelect
                    [options]="almacenes"
                    formControlName="almacenes"
                    placeholder="Seleccionar almacenes"
                    optionLabel="nombre"
                    optionValue="id"
                    class="w-full"
                    [showClear]="true"
                    display="chip"
                  />
                </div>

                <div>
                  <label class="block font-medium mb-2">Colores</label>
                  <p-multiSelect
                    [options]="colores"
                    formControlName="colores"
                    placeholder="Seleccionar colores"
                    optionLabel="nombre"
                    optionValue="id"
                    class="w-full"
                    [showClear]="true"
                    display="chip"
                  />
                </div>

                <div>
                  <label class="block font-medium mb-2">Tallas</label>
                  <p-multiSelect
                    [options]="tallas"
                    formControlName="tallas"
                    placeholder="Seleccionar tallas"
                    optionLabel="numero"
                    optionValue="id"
                    class="w-full"
                    [showClear]="true"
                    display="chip"
                  />
                </div>
              </div>
            </p-accordionTab>

            <!-- Filtros de Valor -->
            <p-accordionTab header="Filtros de Valor">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block font-medium mb-2">Rango de valor unitario</label>
                  <div class="flex gap-2 items-center">
                    <p-inputNumber
                      formControlName="valorMin"
                      placeholder="Valor mín"
                      mode="currency"
                      currency="PEN"
                      locale="es-PE"
                      class="flex-1"
                    />
                    <span class="text-gray-500">-</span>
                    <p-inputNumber
                      formControlName="valorMax"
                      placeholder="Valor máx"
                      mode="currency"
                      currency="PEN"
                      locale="es-PE"
                      class="flex-1"
                    />
                  </div>
                </div>
              </div>
            </p-accordionTab>

          </p-accordion>

          <!-- Filtros Activos -->
          <div class="mt-6" *ngIf="activeFiltros.length > 0">
            <h4 class="font-medium mb-3">Filtros Activos ({{activeFiltros.length}})</h4>
            <div class="flex flex-wrap gap-2">
              <p-chip 
                *ngFor="let filtro of activeFiltros; trackBy: trackByFiltro"
                [label]="filtro.label"
                [removable]="true"
                (onRemove)="removeFiltro(filtro.key)"
                styleClass="bg-blue-100 text-blue-800"
              />
            </div>
          </div>
        </form>
      </ng-template>

      <ng-template pTemplate="footer">
        <div class="flex justify-between items-center px-6 pb-4">
          <div class="flex gap-2">
            <p-button 
              label="Limpiar Todo" 
              icon="pi pi-times" 
              [outlined]="true"
              severity="secondary"
              (click)="limpiarTodo()"
            />
            <p-button 
              label="Restablecer" 
              icon="pi pi-refresh" 
              [outlined]="true"
              severity="secondary"
              (click)="restablecer()"
            />
          </div>
          
          <div class="flex gap-2">
            <p-button 
              label="Cancelar" 
              icon="pi pi-times" 
              [outlined]="true"
              (click)="onHide()"
            />
            <p-button 
              label="Buscar" 
              icon="pi pi-search" 
              (click)="onSearch()"
              [disabled]="!hasValidFilters()"
            />
          </div>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    :host ::ng-deep {
      .p-accordion-content {
        padding: 1rem !important;
      }
      
      .p-chip {
        margin: 0.125rem;
      }
      
      .p-inputnumber {
        width: 100%;
      }
      
      .p-calendar {
        width: 100%;
      }
      
      .p-multiselect {
        width: 100%;
      }
      
      .p-multiselect-panel {
        z-index: 1100;
      }
      
      .p-multiselect-token {
        background: #3b82f6;
        color: white;
        border-radius: 4px;
        padding: 0.25rem 0.5rem;
        margin: 0.125rem;
        font-size: 0.875rem;
      }
      
      .p-multiselect-token-icon {
        color: white;
        margin-left: 0.25rem;
      }
    }
  `]
})
export class AdvancedSearchComponent implements OnInit {
  @Input() visible = false;
  @Input() almacenes: Almacen[] = [];
  @Input() colores: Color[] = [];
  @Input() tallas: Talla[] = [];
  @Input() filtrosIniciales?: FiltrosAvanzados;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() search = new EventEmitter<FiltrosAvanzados>();
  @Output() clear = new EventEmitter<void>();

  private fb = inject(FormBuilder);

  searchForm!: FormGroup;
  activeFiltros: { key: string; label: string; value: any }[] = [];

  estadosOptions = [
    { label: 'Disponible', value: EstadoInventario.DISPONIBLE },
    { label: 'Agotado', value: EstadoInventario.AGOTADO },
    { label: 'Bajo Stock', value: EstadoInventario.BAJO_STOCK },
    { label: 'Reservado', value: EstadoInventario.RESERVADO }
  ];

  ngOnInit(): void {
    this.initForm();
    this.setupFormSubscription();

    if (this.filtrosIniciales) {
      this.loadFiltrosIniciales();
    }
  }

  private initForm(): void {
    this.searchForm = this.fb.group({
      texto: [''],
      fechaDesde: [null],
      fechaHasta: [null],
      estados: [[]],
      cantidadMin: [null],
      cantidadMax: [null],
      almacenes: [[]],
      colores: [[]],
      tallas: [[]],
      soloStockCritico: [false],
      soloAgotados: [false],
      valorMin: [null],
      valorMax: [null]
    });
  }

  private setupFormSubscription(): void {
    this.searchForm.valueChanges.subscribe(() => {
      this.updateActiveFiltros();
    });
  }

  private loadFiltrosIniciales(): void {
    if (this.filtrosIniciales) {
      this.searchForm.patchValue(this.filtrosIniciales);
    }
  }

  private updateActiveFiltros(): void {
    const formValue = this.searchForm.value;
    this.activeFiltros = [];

    // Texto
    if (formValue.texto?.trim()) {
      this.activeFiltros.push({
        key: 'texto',
        label: `Texto: "${formValue.texto}"`,
        value: formValue.texto
      });
    }

    // Fechas
    if (formValue.fechaDesde) {
      this.activeFiltros.push({
        key: 'fechaDesde',
        label: `Desde: ${formValue.fechaDesde.toLocaleDateString()}`,
        value: formValue.fechaDesde
      });
    }

    if (formValue.fechaHasta) {
      this.activeFiltros.push({
        key: 'fechaHasta',
        label: `Hasta: ${formValue.fechaHasta.toLocaleDateString()}`,
        value: formValue.fechaHasta
      });
    }

    // Estados
    if (formValue.estados?.length > 0) {
      const estadosLabels = formValue.estados.map((estado: EstadoInventario) =>
        this.estadosOptions.find(opt => opt.value === estado)?.label
      ).join(', ');

      this.activeFiltros.push({
        key: 'estados',
        label: `Estados: ${estadosLabels}`,
        value: formValue.estados
      });
    }

    // Cantidad
    if (formValue.cantidadMin !== null || formValue.cantidadMax !== null) {
      const min = formValue.cantidadMin ?? 'Sin límite';
      const max = formValue.cantidadMax ?? 'Sin límite';
      this.activeFiltros.push({
        key: 'cantidad',
        label: `Cantidad: ${min} - ${max}`,
        value: { min: formValue.cantidadMin, max: formValue.cantidadMax }
      });
    }

    // Almacenes
    if (formValue.almacenes?.length > 0) {
      const almacenesLabels = formValue.almacenes.map((id: string) =>
        this.almacenes.find(a => a.id?.toString() === id)?.nombre
      ).join(', ');

      this.activeFiltros.push({
        key: 'almacenes',
        label: `Almacenes: ${almacenesLabels}`,
        value: formValue.almacenes
      });
    }

    // Colores
    if (formValue.colores?.length > 0) {
      const coloresLabels = formValue.colores.map((id: string) =>
        this.colores.find(c => c.id?.toString() === id)?.nombre
      ).join(', ');

      this.activeFiltros.push({
        key: 'colores',
        label: `Colores: ${coloresLabels}`,
        value: formValue.colores
      });
    }

    // Tallas
    if (formValue.tallas?.length > 0) {
      const tallasLabels = formValue.tallas.map((id: string) =>
        this.tallas.find(t => t.id?.toString() === id)?.numero
      ).join(', ');

      this.activeFiltros.push({
        key: 'tallas',
        label: `Tallas: ${tallasLabels}`,
        value: formValue.tallas
      });
    }

    // Checkboxes especiales
    if (formValue.soloStockCritico) {
      this.activeFiltros.push({
        key: 'soloStockCritico',
        label: 'Solo stock crítico',
        value: true
      });
    }

    if (formValue.soloAgotados) {
      this.activeFiltros.push({
        key: 'soloAgotados',
        label: 'Solo agotados',
        value: true
      });
    }

    // Valor
    if (formValue.valorMin !== null || formValue.valorMax !== null) {
      const min = formValue.valorMin ? `S/ ${formValue.valorMin}` : 'Sin límite';
      const max = formValue.valorMax ? `S/ ${formValue.valorMax}` : 'Sin límite';
      this.activeFiltros.push({
        key: 'valor',
        label: `Valor: ${min} - ${max}`,
        value: { min: formValue.valorMin, max: formValue.valorMax }
      });
    }
  }

  onSearch(): void {
    if (this.hasValidFilters()) {
      const filtros: FiltrosAvanzados = this.searchForm.value;
      this.search.emit(filtros);
      this.onHide();
    }
  }

  onHide(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  limpiarTodo(): void {
    this.searchForm.reset();
    this.activeFiltros = [];
    this.clear.emit();
  }

  restablecer(): void {
    this.initForm();
    this.activeFiltros = [];
  }

  removeFiltro(key: string): void {
    const control = this.searchForm.get(key);
    if (control) {
      if (key === 'cantidad') {
        this.searchForm.patchValue({ cantidadMin: null, cantidadMax: null });
      } else if (key === 'valor') {
        this.searchForm.patchValue({ valorMin: null, valorMax: null });
      } else {
        control.reset();
      }
    }
  }

  hasValidFilters(): boolean {
    return this.activeFiltros.length > 0;
  }

  trackByFiltro(_index: number, filtro: any): string {
    return filtro.key;
  }
}
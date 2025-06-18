import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, TrackByFunction } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Cliente } from '../../../core/models/cliente.model';
import { ClienteService } from '../../../core/services/clientes.service';
import { MessageService, ConfirmationService, MenuItem } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { DatePickerModule } from 'primeng/datepicker';
import { MenuModule } from 'primeng/menu';
import { Menu } from 'primeng/menu';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { PanelModule } from 'primeng/panel';
import { TooltipModule } from 'primeng/tooltip';
import { PermissionService, PermissionType } from '../../../core/services/permission.service';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

interface ViewOption {
  label: string;
  value: string;
  icon: string;
}

interface EstadoOption {
  label: string;
  value: string;
  icon: string;
}

interface ClienteEstadisticas {
  total: number;
  activos: number;
  inactivos: number;
  nuevosEsteMes: number;
  porcentajeActivos: number;
  clientesConEmail: number;
  clientesConTelefono: number;
  clientesCompletos: number;
}

interface MetricasZapateria {
  total: number;
  activos: number;
  inactivos: number;
  conCompras: number;
  clientesVIP: number;
  promedioCompras: number;
  porcentajeActivos: number;
  ultimaActualizacion: Date;
}

interface AnalisisValorCliente {
  totalVentas: number;
  promedioGasto: number;
  clienteTop: Cliente | null;
  ticketPromedio: number;
}

@Component({
  selector: 'app-clientes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    ConfirmDialogModule,
    DialogModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    SelectButtonModule,
    TableModule,
    TagModule,
    ToastModule,
    ToolbarModule,
    DatePickerModule,
    MenuModule,
    CheckboxModule,
    DropdownModule,
    AutoCompleteModule,
    PanelModule,
    TooltipModule,
    HasPermissionDirective
  ],
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.scss'],
  providers: [MessageService, ConfirmationService]
})
export class ClientesComponent implements OnInit, OnDestroy {
  // 📅 Información del sistema actualizada
  private readonly currentDateTime = new Date('2025-06-18T14:31:14Z');
  private readonly currentUser = 'Emerson147';
  
  // Referencias a componentes del template
  @ViewChild('menuAcciones') menuAcciones!: Menu;
  @ViewChild('dt') dataTable: any;

  // Control de permisos
  permissionTypes = PermissionType;
  canCreate = false;
  canEdit = false;
  canDelete = false;
  
  // Para gestionar suscripciones
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();
  
  // Datos principales
  clientes: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  selectedClientes: Cliente[] = [];
  cliente: Cliente = this.initCliente();
  
  // Formulario reactivo
  clienteForm!: FormGroup;
  
  // Estados del componente
  visible = false;
  detalleDialog = false;
  estadisticasDialog = false;
  loading = false;
  editMode = false;
  submitted = false;
  
  // Estados de UI mejorados
  uiState = {
    isTableLoading: false,
    isFormSaving: false,
    isExporting: false,
    showAdvancedFilters: false,
    lastUpdate: new Date(),
    selectedRowsCount: 0,
    showKeyboardHints: false,
    autoRefreshEnabled: true
  };
  
  // Filtros y búsqueda
  filtroTexto: string = '';
  filtroEstado: string = 'todos';
  filtroCompletitud: string = 'todos';
  sugerenciasBusqueda: string[] = [];
  
  // Configuraciones de vista
  currentView: string = 'table';
  viewOptions: ViewOption[] = [
    { label: 'Tabla', value: 'table', icon: 'pi pi-table' },
    { label: 'Tarjetas', value: 'cards', icon: 'pi pi-th-large' }
  ];
  
  // Opciones de filtro
  estadoOptions: EstadoOption[] = [
    { label: 'Todos', value: 'todos', icon: 'pi pi-users' },
    { label: 'Activos', value: 'activos', icon: 'pi pi-check-circle' },
    { label: 'Inactivos', value: 'inactivos', icon: 'pi pi-ban' }
  ];
  
  completitudOptions: EstadoOption[] = [
    { label: 'Todos', value: 'todos', icon: 'pi pi-users' },
    { label: 'Completos', value: 'completos', icon: 'pi pi-check-square' },
    { label: 'Incompletos', value: 'incompletos', icon: 'pi pi-exclamation-triangle' }
  ];
  
  // Variables para formulario
  crearYAgregar = false;
  
  // Variables para menú contextual
  itemsMenuAcciones: MenuItem[] = [];
  clienteSeleccionado: Cliente | null = null;
  
  // Variables para detalles
  clienteDetalle: Cliente | null = null;
  
  // Optimizaciones de performance
  readonly DEFAULT_PAGE_SIZE = 10;
  readonly PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];
  readonly SEARCH_DEBOUNCE_TIME = 300;
  readonly AUTO_REFRESH_INTERVAL = 300000; // 5 minutos
  
  totalRecords = 0;
  private autoRefreshInterval?: any;
  
  // TrackBy para performance
  trackByClienteId: TrackByFunction<Cliente> = (index: number, cliente: Cliente) => {
    return cliente.id || index;
  };

  constructor(
    private clienteService: ClienteService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private permissionService: PermissionService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    this.cargarClientes();
    this.loadPermissions();
    this.inicializarFiltros();
    this.setupSearchOptimization();
    this.setupAutoRefresh();
    this.setupKeyboardShortcuts();
    this.uiState.lastUpdate = this.currentDateTime;
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
    
    document.removeEventListener('keydown', this.handleKeyboardShortcuts);
  }
  
  // ==================== INICIALIZACIÓN ====================
  
  private initializeForm(): void {
    this.clienteForm = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(2), this.noWhitespaceValidator]],
      apellidos: ['', [Validators.required, Validators.minLength(2), this.noWhitespaceValidator]],
      dni: ['', [this.dniValidator]],
      ruc: ['', [this.rucValidator]],
      telefono: ['', [this.telefonoValidator]],
      email: ['', [Validators.email]],
      direccion: [''],
      fechaNacimiento: ['', [this.fechaNacimientoValidator]],
      estado: [true]
    });
  }
  
  private inicializarFiltros(): void {
    this.clientesFiltrados = [...this.clientes];
  }
  
  private loadPermissions(): void {
    this.canCreate = this.permissionService.canCreate('clientes');
    this.canEdit = this.permissionService.canEdit('clientes');
    this.canDelete = this.permissionService.canDelete('clientes');
  }

  private initCliente(): Cliente {
    return {
      nombres: '',
      apellidos: '',
      dni: '',
      ruc: '',
      telefono: '',
      direccion: '',
      email: '',
      estado: true,
      fechaNacimiento: '',
      fechaCreacion: this.currentDateTime.toISOString(),
      fechaActualizacion: undefined,
      compras: 0,
      totalCompras: 0,
      ultimaCompra: undefined
    };
  }
  
  // ==================== OPTIMIZACIONES DE PERFORMANCE ====================
  
  private setupSearchOptimization(): void {
    this.searchSubject$.pipe(
      debounceTime(this.SEARCH_DEBOUNCE_TIME),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.filtroTexto = searchTerm;
      this.aplicarFiltros();
      this.updateSugerencias(searchTerm);
      this.cdr.markForCheck();
    });
  }
  
  onSearchChange = (event: Event) => {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject$.next(value);
  };
  
  private setupAutoRefresh(): void {
    if (this.uiState.autoRefreshEnabled) {
      this.autoRefreshInterval = setInterval(() => {
        if (!this.visible && !this.loading) {
          this.cargarClientesSilencioso();
        }
      }, this.AUTO_REFRESH_INTERVAL);
    }
  }
  
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
  }
  
  private handleKeyboardShortcuts(event: KeyboardEvent): void {
    // Ctrl + N = Nuevo cliente
    if (event.ctrlKey && event.key === 'n') {
      event.preventDefault();
      this.openNew();
    }
    
    // Ctrl + F = Enfocar búsqueda
    if (event.ctrlKey && event.key === 'f') {
      event.preventDefault();
      const searchInput = document.querySelector('input[placeholder*="Búsqueda"]') as HTMLInputElement;
      searchInput?.focus();
    }
    
    // Escape = Cerrar diálogos
    if (event.key === 'Escape') {
      this.hideAllDialogs();
    }
    
    // Ctrl + S = Guardar (si hay formulario abierto)
    if (event.ctrlKey && event.key === 's' && this.visible) {
      event.preventDefault();
      this.guardarCliente();
    }
    
    // F5 = Actualizar
    if (event.key === 'F5') {
      event.preventDefault();
      this.cargarClientes();
    }
  }
  
  private hideAllDialogs(): void {
    this.visible = false;
    this.detalleDialog = false;
    this.estadisticasDialog = false;
    this.cdr.markForCheck();
  }
  
  // ==================== VALIDADORES MEJORADOS ====================
  
  private noWhitespaceValidator(control: AbstractControl): {[key: string]: any} | null {
    if (control.value && control.value.trim().length === 0) {
      return { 'whitespace': true };
    }
    return null;
  }

  private dniValidator = (control: AbstractControl): {[key: string]: any} | null => {
    if (!control.value) return null;
    
    const dni = control.value.toString();
    if (!/^\d{8}$/.test(dni)) {
      return { 'dniInvalido': true };
    }
    
    return this.validarDigitoVerificadorDNI(dni) ? null : { 'dniInvalido': true };
  };

  private rucValidator = (control: AbstractControl): {[key: string]: any} | null => {
    if (!control.value) return null;
    
    const ruc = control.value.toString();
    if (!/^\d{11}$/.test(ruc)) {
      return { 'rucInvalido': true };
    }
    
    return this.validarDigitoVerificadorRUC(ruc) ? null : { 'rucInvalido': true };
  };

  private telefonoValidator = (control: AbstractControl): {[key: string]: any} | null => {
    if (!control.value) return null;
    
    const telefono = control.value.toString().replace(/\D/g, '');
    if (telefono.length < 9 || telefono.length > 15) {
      return { 'telefonoInvalido': true };
    }
    
    return null;
  };

  private fechaNacimientoValidator = (control: AbstractControl): {[key: string]: any} | null => {
    if (!control.value) return null;
    
    const fechaNac = new Date(control.value);
    const hoy = new Date();
    const edad = hoy.getFullYear() - fechaNac.getFullYear();
    
    if (edad < 0 || edad > 120) {
      return { 'fechaNacimientoInvalida': true };
    }
    
    return null;
  };
  
  // Validaciones específicas para Perú
  private validarDigitoVerificadorDNI(dni: string): boolean {
    const digitos = dni.split('').map(Number);
    const factores = [3, 2, 7, 6, 5, 4, 3, 2];
    
    let suma = 0;
    for (let i = 0; i < 7; i++) {
      suma += digitos[i] * factores[i];
    }
    
    const residuo = suma % 11;
    const digitoVerificador = residuo < 2 ? residuo : 11 - residuo;
    
    return digitoVerificador === digitos[7];
  }

  private validarDigitoVerificadorRUC(ruc: string): boolean {
    const digitos = ruc.split('').map(Number);
    const factores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    
    let suma = 0;
    for (let i = 0; i < 10; i++) {
      suma += digitos[i] * factores[i];
    }
    
    const residuo = suma % 11;
    const digitoVerificador = residuo < 2 ? residuo : 11 - residuo;
    
    return digitoVerificador === digitos[10];
  }
  
  // Getter para acceso fácil a los controles del formulario
  get f() { return this.clienteForm.controls; }
  
  // Validación en tiempo real
  getFieldError(fieldName: string): string | null {
    const field = this.clienteForm.get(fieldName);
    
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) return `${fieldName} es obligatorio`;
      if (field.errors['email']) return 'Email inválido';
      if (field.errors['dniInvalido']) return 'DNI inválido (8 dígitos)';
      if (field.errors['rucInvalido']) return 'RUC inválido (11 dígitos)';
      if (field.errors['telefonoInvalido']) return 'Teléfono inválido';
      if (field.errors['fechaNacimientoInvalida']) return 'Fecha de nacimiento inválida';
      if (field.errors['whitespace']) return 'No puede estar vacío';
      if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
    }
    
    return null;
  }

  // ==================== GESTIÓN DE DATOS ====================
  
  cargarClientes(): void {
    this.loading = true;
    this.uiState.isTableLoading = true;
    
    this.clienteService.listar()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.clientes = data;
          this.aplicarFiltros();
          this.loading = false;
          this.uiState.isTableLoading = false;
          this.uiState.lastUpdate = new Date();
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.mostrarError('Error al cargar clientes', error.message);
          this.loading = false;
          this.uiState.isTableLoading = false;
          this.cdr.markForCheck();
        }
      });
  }
  
  private cargarClientesSilencioso(): void {
    this.clienteService.listar()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const hasChanges = JSON.stringify(data) !== JSON.stringify(this.clientes);
          if (hasChanges) {
            this.clientes = data;
            this.aplicarFiltros();
            this.uiState.lastUpdate = new Date();
            this.mostrarInfo('Actualizado', 'Los datos se han actualizado automáticamente');
            this.cdr.markForCheck();
          }
        },
        error: () => {
          // Silencioso, no mostrar error en auto-refresh
        }
      });
  }

  buscar(): void {
    this.aplicarFiltros();
  }

  limpiarBusqueda(): void {
    this.filtroTexto = '';
    this.filtroEstado = 'todos';
    this.filtroCompletitud = 'todos';
    this.sugerenciasBusqueda = [];
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    let clientesFiltrados = [...this.clientes];

    // Filtro por texto
    if (this.filtroTexto?.trim()) {
      const filtro = this.filtroTexto.toLowerCase().trim();
      clientesFiltrados = clientesFiltrados.filter(cliente => 
        cliente.nombres?.toLowerCase().includes(filtro) ||
        cliente.apellidos?.toLowerCase().includes(filtro) ||
        cliente.dni?.toLowerCase().includes(filtro) ||
        cliente.ruc?.toLowerCase().includes(filtro) ||
        cliente.email?.toLowerCase().includes(filtro) ||
        cliente.telefono?.toLowerCase().includes(filtro)
      );
    }

    // Filtro por estado
    if (this.filtroEstado !== 'todos') {
      clientesFiltrados = clientesFiltrados.filter(cliente => 
        this.filtroEstado === 'activos' ? cliente.estado : !cliente.estado
      );
    }

    // Filtro por completitud
    if (this.filtroCompletitud !== 'todos') {
      clientesFiltrados = clientesFiltrados.filter(cliente => {
        const esCompleto = this.esClienteCompleto(cliente);
        return this.filtroCompletitud === 'completos' ? esCompleto : !esCompleto;
      });
    }

    this.clientesFiltrados = clientesFiltrados;
    this.uiState.selectedRowsCount = this.selectedClientes.length;
    this.cdr.markForCheck();
  }
  
  private updateSugerencias(termino: string): void {
    this.sugerenciasBusqueda = this.getSugerenciasBusqueda(termino);
  }
  
  getSugerenciasBusqueda(termino: string): string[] {
    if (!termino || termino.length < 2) return [];
    
    const sugerencias = new Set<string>();
    const terminoLower = termino.toLowerCase();
    
    this.clientes.forEach(cliente => {
      if (cliente.nombres?.toLowerCase().includes(terminoLower)) {
        sugerencias.add(cliente.nombres);
      }
      
      if (cliente.apellidos?.toLowerCase().includes(terminoLower)) {
        sugerencias.add(cliente.apellidos);
      }
      
      if (cliente.email?.toLowerCase().includes(terminoLower)) {
        sugerencias.add(cliente.email);
      }
    });
    
    return Array.from(sugerencias).slice(0, 5);
  }

  // ==================== CRUD OPERATIONS ====================
  
  openNew(): void {
    if (!this.canCreate) {
      this.mostrarError('Sin permisos', 'No tiene permisos para crear clientes');
      return;
    }
    
    this.editMode = false;
    this.submitted = false;
    this.cliente = this.initCliente();
    this.clienteForm.reset();
    this.clienteForm.patchValue(this.cliente);
    this.visible = true;
    this.cdr.markForCheck();
  }

  editCliente(cliente: Cliente): void {
    if (!this.canEdit) {
      this.mostrarError('Sin permisos', 'No tiene permisos para editar clientes');
      return;
    }
    
    this.editMode = true;
    this.submitted = false;
    this.cliente = { ...cliente };
    this.clienteForm.patchValue(this.cliente);
    this.visible = true;
    this.cdr.markForCheck();
  }

  guardarCliente(): void {
    this.submitted = true;
    
    if (this.clienteForm.invalid) {
      this.markFormGroupTouched(this.clienteForm);
      this.mostrarError('Formulario inválido', 'Por favor, corrija los errores en el formulario');
      return;
    }

    // Verificar permisos
    if (this.editMode && !this.canEdit) {
      this.mostrarError('Sin permisos', 'No tiene permisos para editar clientes');
      return;
    } else if (!this.editMode && !this.canCreate) {
      this.mostrarError('Sin permisos', 'No tiene permisos para crear clientes');
      return;
    }
    
    this.loading = true;
    this.uiState.isFormSaving = true;
    
    // Actualizar datos del cliente con el formulario
    this.cliente = { ...this.cliente, ...this.clienteForm.value };
    this.cliente.fechaActualizacion = this.currentDateTime.toISOString();
    
    const operacion = this.editMode && this.cliente.id
      ? this.clienteService.actualizar(this.cliente.id, this.cliente)
      : this.clienteService.crear(this.cliente);

    operacion.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        const mensaje = this.editMode ? 'Cliente actualizado correctamente' : 'Cliente creado correctamente';
        this.mostrarExito(this.editMode ? 'Actualizado' : 'Creado', mensaje);
        
        if (!this.editMode && this.crearYAgregar) {
          this.cliente = this.initCliente();
          this.clienteForm.reset();
          this.clienteForm.patchValue(this.cliente);
          this.submitted = false;
        } else {
          this.hideDialog();
        }
        
        this.cargarClientes();
      },
      error: (error) => {
        this.mostrarError('Error al guardar', error.message);
      },
      complete: () => {
        this.loading = false;
        this.uiState.isFormSaving = false;
        this.cdr.markForCheck();
      }
    });
  }
  
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  desactivar(cliente: Cliente): void {
    if (!this.canEdit) {
      this.mostrarError('Sin permisos', 'No tiene permisos para desactivar clientes');
      return;
    }
    
    this.confirmationService.confirm({
      header: 'Confirmar desactivación',
      message: `¿Está seguro que desea desactivar al cliente ${cliente.nombres} ${cliente.apellidos}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, desactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () => {
        this.clienteService.desactivar(cliente.id!)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.mostrarExito('Desactivado', 'Cliente desactivado correctamente');
              this.cargarClientes();
            },
            error: (error) => this.mostrarError('Error al desactivar', error.message)
          });
      }
    });
  }

  reactivar(cliente: Cliente): void {
    if (!this.canEdit) {
      this.mostrarError('Sin permisos', 'No tiene permisos para reactivar clientes');
      return;
    }
    
    this.confirmationService.confirm({
      header: 'Confirmar reactivación',
      message: `¿Está seguro que desea reactivar al cliente ${cliente.nombres} ${cliente.apellidos}?`,
      icon: 'pi pi-question-circle',
      acceptLabel: 'Sí, reactivar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-success',
      accept: () => {
        this.clienteService.reactivar(cliente.id!)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.mostrarExito('Reactivado', 'Cliente reactivado correctamente');
              this.cargarClientes();
            },
            error: (error) => this.mostrarError('Error al reactivar', error.message)
          });
      }
    });
  }

  confirmarEliminacion(cliente: Cliente): void {
    if (!this.canDelete) {
      this.mostrarError('Sin permisos', 'No tiene permisos para eliminar clientes');
      return;
    }
    
    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: `¿Está seguro que desea eliminar permanentemente al cliente ${cliente.nombres} ${cliente.apellidos}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.eliminar(cliente)
    });
  }

  private eliminar(cliente: Cliente): void {
    this.loading = true;
    this.clienteService.eliminar(cliente.id!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.mostrarExito('Eliminado', 'Cliente eliminado correctamente');
          this.cargarClientes();
        },
        error: (error) => {
          this.mostrarError('Error al eliminar', error.message);
        },
        complete: () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  eliminarSeleccionados(): void {
    if (!this.canDelete) {
      this.mostrarError('Sin permisos', 'No tiene permisos para eliminar clientes');
      return;
    }
    
    if (!this.selectedClientes.length) return;
    
    this.confirmationService.confirm({
      header: 'Confirmar eliminación múltiple',
      message: `¿Está seguro que desea eliminar ${this.selectedClientes.length} cliente(s) seleccionado(s)?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar todos',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.selectedClientes.forEach(cliente => {
          if (cliente.id) this.eliminar(cliente);
        });
        this.selectedClientes = [];
      }
    });
  }

  // ==================== FUNCIONES DE VISTA ====================
  
  verDetallesCliente(cliente: Cliente): void {
    this.clienteDetalle = { ...cliente };
    this.detalleDialog = true;
    this.cdr.markForCheck();
  }

  mostrarEstadisticas(): void {
    this.estadisticasDialog = true;
    this.cdr.markForCheck();
  }

  mostrarMenuAcciones(event: Event, cliente: Cliente): void {
    this.clienteSeleccionado = cliente;
    this.itemsMenuAcciones = this.construirMenuAcciones(cliente);
    this.menuAcciones.toggle(event);
  }
  
  mostrarMenuAccionesMobile(event: Event, cliente: Cliente): void {
    event.stopPropagation();
    this.mostrarMenuAcciones(event, cliente);
  }
  
  toggleClienteSelection(cliente: Cliente): void {
    const index = this.selectedClientes.findIndex(c => c.id === cliente.id);
    if (index > -1) {
      this.selectedClientes.splice(index, 1);
    } else {
      this.selectedClientes.push(cliente);
    }
    this.uiState.selectedRowsCount = this.selectedClientes.length;
    this.cdr.markForCheck();
  }

  private construirMenuAcciones(cliente: Cliente): MenuItem[] {
    return [
      {
        label: 'Ver Detalles',
        icon: 'pi pi-eye',
        command: () => this.verDetallesCliente(cliente)
      },
      {
        label: 'Editar Cliente',
        icon: 'pi pi-pencil',
        command: () => this.editCliente(cliente),
        visible: this.canEdit
      },
      {
        label: 'Duplicar Cliente',
        icon: 'pi pi-copy',
        command: () => this.duplicarCliente(cliente),
        visible: this.canCreate
      },
      { separator: true },
      {
        label: cliente.estado ? 'Desactivar Cliente' : 'Activar Cliente',
        icon: cliente.estado ? 'pi pi-ban' : 'pi pi-check',
        command: () => cliente.estado ? this.desactivar(cliente) : this.reactivar(cliente),
        visible: this.canEdit
      },
      {
        label: 'Eliminar Cliente',
        icon: 'pi pi-trash',
        command: () => this.confirmarEliminacion(cliente),
        visible: this.canDelete
      }
    ];
  }

  // ==================== FUNCIONES DE UTILIDAD ====================
  
  private validarCliente(): boolean {
    if (!this.cliente.nombres?.trim()) {
      this.mostrarError('Error de validación', 'El nombre es obligatorio');
      return false;
    }
    
    if (!this.cliente.apellidos?.trim()) {
      this.mostrarError('Error de validación', 'Los apellidos son obligatorios');
      return false;
    }
    
    if (this.cliente.email && !this.validarEmail(this.cliente.email)) {
      this.mostrarError('Error de validación', 'El formato del email no es válido');
      return false;
    }
    
    if (this.cliente.dni && !this.validarDNI(this.cliente.dni)) {
      this.mostrarError('Error de validación', 'El DNI debe tener 8 dígitos');
      return false;
    }
    
    if (this.cliente.ruc && !this.validarRUC(this.cliente.ruc)) {
      this.mostrarError('Error de validación', 'El RUC debe tener 11 dígitos');
      return false;
    }

    return true;
  }

  public validarEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  public validarDNI(dni: string): boolean {
    return /^\d{8}$/.test(dni);
  }

  public validarRUC(ruc: string): boolean {
    return /^\d{11}$/.test(ruc);
  }

  private esClienteCompleto(cliente: Cliente): boolean {
    return !!(
      cliente.nombres?.trim() &&
      cliente.apellidos?.trim() &&
      cliente.telefono?.trim() &&
      cliente.email?.trim() &&
      cliente.direccion?.trim() &&
      (cliente.dni?.trim() || cliente.ruc?.trim())
    );
  }

  duplicarCliente(cliente: Cliente): void {
    if (!this.canCreate) {
      this.mostrarError('Sin permisos', 'No tiene permisos para crear clientes');
      return;
    }
    
    this.editMode = false;
    this.submitted = false;
    this.cliente = {
      ...cliente,
      id: undefined,
      nombres: cliente.nombres + ' (Copia)',
      dni: '',
      ruc: '',
      email: '',
      fechaCreacion: this.currentDateTime.toISOString(),
      fechaActualizacion: undefined
    };
    this.clienteForm.patchValue(this.cliente);
    this.visible = true;
    this.cdr.markForCheck();
  }

  public getCompletion(cliente: Cliente): number {
    let completed = 0;
    const totalFields = 7;
    
    if (cliente.nombres?.trim()) completed++;
    if (cliente.apellidos?.trim()) completed++;
    if (cliente.telefono?.trim()) completed++;
    if (cliente.email?.trim()) completed++;
    if (cliente.direccion?.trim()) completed++;
    if (cliente.dni?.trim() || cliente.ruc?.trim()) completed++;
    if (cliente.fechaNacimiento) completed++;
    
    return Math.round((completed / totalFields) * 100);
  }

  public exportarFichaCliente(cliente: Cliente): void {
    this.uiState.isExporting = true;
    this.mostrarInfo('Exportando', 'Generando ficha del cliente...');
    
    // Simular exportación
    setTimeout(() => {
      this.uiState.isExporting = false;
      this.mostrarExito('Exportado', 'Ficha del cliente generada correctamente');
      this.cdr.markForCheck();
    }, 2000);
  }

  // ==================== MÉTRICAS Y ESTADÍSTICAS ====================
  
  // Información del sistema
  getCurrentDateTime(): string {
    return this.currentDateTime.toLocaleString('es-PE', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  getCurrentUser(): string {
    return this.currentUser;
  }

  getCurrentDate(): Date {
    return this.currentDateTime;
  }

  getCurrentTime(): string {
    return this.currentDateTime.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'UTC'
    });
  }

  getSaludoPersonalizado(): string {
    const hora = this.currentDateTime.getUTCHours(); // 14 = 2 PM
    
    if (hora >= 5 && hora < 12) {
      return `¡Buenos días, ${this.currentUser}!`;
    } else if (hora >= 12 && hora < 18) {
      return `¡Buenas tardes, ${this.currentUser}!`;
    } else {
      return `¡Buenas noches, ${this.currentUser}!`;
    }
  }

  getFechaFormateada(): string {
    return this.currentDateTime.toLocaleDateString('es-PE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    });
  }
  
  // Métricas específicas para zapatería
  getMetricasZapateria(): MetricasZapateria {
    const total = this.clientes.length;
    const activos = this.getClientesActivos();
    const conCompras = this.clientes.filter(c => c.compras && c.compras > 0).length;
    const clientesVIP = this.clientes.filter(c => (c.compras || 0) >= 10).length;
    const promedioCompras = total > 0 ? 
      this.clientes.reduce((sum, c) => sum + (c.compras || 0), 0) / total : 0;

    return {
      total,
      activos,
      inactivos: total - activos,
      conCompras,
      clientesVIP,
      promedioCompras: Math.round(promedioCompras * 100) / 100,
      porcentajeActivos: total > 0 ? Math.round((activos / total) * 100) : 0,
      ultimaActualizacion: this.uiState.lastUpdate
    };
  }
  
  getAnalisisValorCliente(): AnalisisValorCliente {
    const clientesConVentas = this.clientes.filter(c => c.totalCompras && c.totalCompras > 0);
    
    if (clientesConVentas.length === 0) {
      return {
        totalVentas: 0,
        promedioGasto: 0,
        clienteTop: null,
        ticketPromedio: 0
      };
    }

    const totalVentas = clientesConVentas.reduce((sum, c) => sum + (c.totalCompras || 0), 0);
    const promedioGasto = totalVentas / clientesConVentas.length;
    const totalTransacciones = clientesConVentas.reduce((sum, c) => sum + (c.compras || 0), 0);
    const ticketPromedio = totalTransacciones > 0 ? totalVentas / totalTransacciones : 0;
    
    const clienteTop = clientesConVentas.reduce((prev, current) => 
      (current.totalCompras || 0) > (prev.totalCompras || 0) ? current : prev
    );

    return {
      totalVentas,
      promedioGasto: Math.round(promedioGasto * 100) / 100,
      clienteTop,
      ticketPromedio: Math.round(ticketPromedio * 100) / 100
    };
  }
  
  getEstadisticas(): ClienteEstadisticas {
    const total = this.clientes.length;
    const activos = this.clientes.filter(c => c.estado).length;
    const inactivos = total - activos;
    const clientesConEmail = this.clientes.filter(c => c.email?.trim()).length;
    const clientesConTelefono = this.clientes.filter(c => c.telefono?.trim()).length;
    const clientesCompletos = this.clientes.filter(c => this.esClienteCompleto(c)).length;
    
    const fechaInicioMes = new Date();
    fechaInicioMes.setDate(1);
    fechaInicioMes.setHours(0, 0, 0, 0);
    
    const nuevosEsteMes = this.clientes.filter(c => 
      c.fechaCreacion && new Date(c.fechaCreacion) >= fechaInicioMes
    ).length;

    return {
      total,
      activos,
      inactivos,
      nuevosEsteMes,
      porcentajeActivos: total > 0 ? (activos / total) * 100 : 0,
      clientesConEmail,
      clientesConTelefono,
      clientesCompletos
    };
  }

  getClientesActivos(): number {
    return this.clientes.filter(c => c.estado).length;
  }

  getClientesInactivos(): number {
    return this.clientes.filter(c => !c.estado).length;
  }

  // ==================== FUNCIONES DE DIÁLOGO ====================
  
  hideDialog(): void {
    this.visible = false;
    this.submitted = false;
    this.crearYAgregar = false;
    this.cliente = this.initCliente();
    this.clienteForm.reset();
    this.cdr.markForCheck();
  }

  hideDetalleDialog(): void {
    this.detalleDialog = false;
    this.clienteDetalle = null;
    this.cdr.markForCheck();
  }

  hideEstadisticasDialog(): void {
    this.estadisticasDialog = false;
    this.cdr.markForCheck();
  }

  // ==================== FUNCIONES DE MENSAJES ====================
  
  private mostrarExito(summary: string, detail: string): void {
    this.messageService.add({ 
      severity: 'success', 
      summary, 
      detail,
      life: 3000
    });
  }

  private mostrarError(summary: string, detail: string): void {
    this.messageService.add({ 
      severity: 'error', 
      summary, 
      detail,
      life: 5000
    });
  }

  private mostrarInfo(summary: string, detail: string): void {
    this.messageService.add({ 
      severity: 'info', 
      summary, 
      detail,
      life: 4000
    });
  }

  // ==================== FUNCIONES DE EXPORTACIÓN ====================
  
  exportarExcel(): void {
    this.uiState.isExporting = true;
    this.mostrarInfo('Exportando', 'Generando archivo Excel...');
    
    // Simular exportación
    setTimeout(() => {
      this.uiState.isExporting = false;
      this.mostrarExito('Exportado', 'Archivo Excel generado correctamente');
      this.cdr.markForCheck();
    }, 3000);
  }

  exportarPDF(): void {
    this.uiState.isExporting = true;
    this.mostrarInfo('Exportando', 'Generando archivo PDF...');
    
    // Simular exportación
    setTimeout(() => {
      this.uiState.isExporting = false;
      this.mostrarExito('Exportado', 'Archivo PDF generado correctamente');
      this.cdr.markForCheck();
    }, 3000);
  }

  // ==================== FUNCIONES DE TABLA ====================
  
  onGlobalFilter(table: any, event: Event): void {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  trackByCliente(index: number, cliente: Cliente): any {
    return cliente ? cliente.id : null;
  }
}
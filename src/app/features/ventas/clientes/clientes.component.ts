import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Cliente } from '../../../core/models/cliente.model';
import { ClienteService } from '../../../core/services/clientes.service';
import { MessageService, ConfirmationService, MenuItem } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { TooltipModule } from 'primeng/tooltip'; // ⭐ Añadir este import
import { PermissionService, PermissionType } from '../../../core/services/permission.service';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
  
  // Datos principales
  clientes: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  selectedClientes: Cliente[] = [];
  cliente: Cliente = this.initCliente();
  
  // Estados del componente
  visible = false;
  detalleDialog = false;
  estadisticasDialog = false;
  loading = false;
  editMode = false;
  submitted = false;
  
  // Filtros y búsqueda
  filtroTexto: string = '';
  filtroEstado: string = 'todos';
  filtroCompletitud: string = 'todos';
  
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

  constructor(
    private clienteService: ClienteService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private permissionService: PermissionService
  ) {}

  ngOnInit() {
    this.cargarClientes();
    this.loadPermissions();
    this.inicializarFiltros();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // ==================== INICIALIZACIÓN ====================
  
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
      fechaNacimiento: ''
    };
  }

  // ==================== GESTIÓN DE DATOS ====================
  
  cargarClientes(): void {
    this.loading = true;
    this.clienteService.listar()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.clientes = data;
          this.aplicarFiltros();
          this.loading = false;
        },
        error: (error) => {
          this.mostrarError('Error al cargar clientes', error.message);
          this.loading = false;
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
    this.visible = true;
  }

  editCliente(cliente: Cliente): void {
    if (!this.canEdit) {
      this.mostrarError('Sin permisos', 'No tiene permisos para editar clientes');
      return;
    }
    
    this.editMode = true;
    this.submitted = false;
    this.cliente = { ...cliente };
    this.visible = true;
  }

  guardarCliente(): void {
    this.submitted = true;
    
    // Validaciones
    if (!this.validarCliente()) {
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
    
    const operacion = this.editMode && this.cliente.id
      ? this.clienteService.actualizar(this.cliente.id, this.cliente)
      : this.clienteService.crear(this.cliente);

    operacion.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        const mensaje = this.editMode ? 'Cliente actualizado correctamente' : 'Cliente creado correctamente';
        this.mostrarExito(this.editMode ? 'Actualizado' : 'Creado', mensaje);
        
        if (!this.editMode && this.crearYAgregar) {
          this.cliente = this.initCliente();
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
      }
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
  }

  mostrarEstadisticas(): void {
    this.estadisticasDialog = true;
  }

  mostrarMenuAcciones(event: Event, cliente: Cliente): void {
    this.clienteSeleccionado = cliente;
    this.itemsMenuAcciones = this.construirMenuAcciones(cliente);
    this.menuAcciones.toggle(event);
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

  // Cambiar estas funciones de private a public para el template
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
      email: ''
    };
    this.visible = true;
  }

  // Añadir función getCompletion
  public getCompletion(cliente: Cliente): number {
    let completed = 0;
    const totalFields = 7; // Número total de campos importantes
    
    if (cliente.nombres?.trim()) completed++;
    if (cliente.apellidos?.trim()) completed++;
    if (cliente.telefono?.trim()) completed++;
    if (cliente.email?.trim()) completed++;
    if (cliente.direccion?.trim()) completed++;
    if (cliente.dni?.trim() || cliente.ruc?.trim()) completed++;
    if (cliente.fechaNacimiento) completed++;
    
    return Math.round((completed / totalFields) * 100);
  }

  // Añadir función exportarFichaCliente
  public exportarFichaCliente(cliente: Cliente): void {
    this.mostrarInfo('Exportando', 'Generando ficha del cliente...');
    // Implementar lógica de exportación
  }

  // ==================== FUNCIONES DE ESTADÍSTICAS ====================
  
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
  }

  hideDetalleDialog(): void {
    this.detalleDialog = false;
    this.clienteDetalle = null;
  }

  hideEstadisticasDialog(): void {
    this.estadisticasDialog = false;
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
    // Implementar exportación a Excel
    this.mostrarInfo('Exportando', 'Generando archivo Excel...');
  }

  exportarPDF(): void {
    // Implementar exportación a PDF
    this.mostrarInfo('Exportando', 'Generando archivo PDF...');
  }

  // ==================== FUNCIONES DE TABLA ====================
  
  onGlobalFilter(table: any, event: Event): void {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  getCurrentDate(): Date {
    return new Date();
  }

  trackByCliente(index: number, cliente: Cliente): any {
    return cliente ? cliente.id : null;
  }
}
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Cliente } from '../../../core/models/cliente.model';
import { ClienteService } from '../../../core/services/clientes.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { DatePickerModule } from 'primeng/datepicker';
import { PermissionService, PermissionType } from '../../../core/services/permission.service';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-clientes',
  imports: [
    CommonModule,
    IconFieldModule,
    InputIconModule,
    ToolbarModule,
    TableModule,
    ButtonModule,
    DialogModule,
    ToastModule,
    ConfirmDialogModule,
    FormsModule,
    InputTextModule,
    CardModule,
    TextareaModule,
    PasswordModule,
    SelectButtonModule,
    DatePickerModule,
    TagModule,
    HasPermissionDirective,
  ],
  templateUrl: './clientes.component.html',
  providers: [MessageService, ConfirmationService]
})
export class ClientesComponent implements OnInit, OnDestroy {
  // Control de permisos
  permissionTypes = PermissionType;
  canCreate = false;
  canEdit = false;
  canDelete = false;
  
  // Para gestionar suscripciones
  private destroy$ = new Subject<void>();
  
  clientes: Cliente[] = [];
  selectedClientes: Cliente[] = [];
  cliente: Cliente = this.initCliente();
  visible = false;
  loading = false;
  editMode = false;
  filtro: string = '';

  constructor(
    private clienteService: ClienteService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private permissionService: PermissionService
  ) {}

  ngOnInit() {
    this.cargarClientes();
    this.loadPermissions();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // Carga los permisos del usuario actual
  loadPermissions(): void {
    this.canCreate = this.permissionService.canCreate('clientes');
    this.canEdit = this.permissionService.canEdit('clientes');
    this.canDelete = this.permissionService.canDelete('clientes');
  }

  cargarClientes() {
    this.loading = true;
    this.clienteService.listar().subscribe({
      next: data => { this.clientes = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  buscar() {
    if (this.filtro && this.filtro.trim().length > 0) {
      this.loading = true;
      this.clienteService.buscar(this.filtro.trim()).subscribe({
        next: data => { this.clientes = data; this.loading = false; },
        error: () => { this.loading = false; }
      });
    } else {
      this.cargarClientes();
    }
  }

  limpiarBusqueda() {
    this.filtro = '';
    this.cargarClientes();
  }

  openNew() {
    if (!this.permissionService.canCreate('clientes')) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error de permisos',
        detail: 'No tiene permisos para crear un nuevo cliente'
      });
      return;
    }
    
    this.editMode = false;
    this.cliente = this.initCliente();
    this.visible = true;
  }

  editCliente(cliente: Cliente) {
    if (!this.permissionService.canEdit('clientes')) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error de permisos',
        detail: 'No tiene permisos para editar clientes'
      });
      return;
    }
    
    this.editMode = true;
    this.cliente = { ...cliente };
    this.visible = true;
  }

  guardarCliente() {
    // Verificar permisos según la operación
    if (this.editMode && !this.permissionService.canEdit('clientes')) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error de permisos',
        detail: 'No tiene permisos para editar clientes'
      });
      return;
    } else if (!this.editMode && !this.permissionService.canCreate('clientes')) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error de permisos',
        detail: 'No tiene permisos para crear clientes'
      });
      return;
    }
    
    this.loading = true;
    if (this.editMode && this.cliente.id) {
      this.clienteService.actualizar(this.cliente.id, this.cliente).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: 'Cliente actualizado correctamente' });
          this.visible = false;
          this.cargarClientes();
        },
        error: () => this.loading = false,
        complete: () => this.loading = false
      });
    } else {
      this.clienteService.crear(this.cliente).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Creado', detail: 'Cliente creado correctamente' });
          this.visible = false;
          this.cargarClientes();
        },
        error: () => this.loading = false,
        complete: () => this.loading = false
      });
    }
  }

  desactivar(cliente: Cliente) {
    if (!this.permissionService.canEdit('clientes')) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error de permisos',
        detail: 'No tiene permisos para desactivar clientes'
      });
      return;
    }
    
    this.confirmationService.confirm({
      message: '¿Desactivar este cliente?',
      accept: () => {
        this.clienteService.desactivar(cliente.id!).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Desactivado', detail: 'Cliente desactivado' });
            this.cargarClientes();
          }
        });
      }
    });
  }

  reactivar(cliente: Cliente) {
    if (!this.permissionService.canEdit('clientes')) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error de permisos',
        detail: 'No tiene permisos para reactivar clientes'
      });
      return;
    }
    
    this.confirmationService.confirm({
      message: '¿Reactivar este cliente?',
      accept: () => {
        this.clienteService.reactivar(cliente.id!).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Reactivado', detail: 'Cliente reactivado' });
            this.cargarClientes();
          }
        });
      }
    });
  }

  confirmarEliminacion(cliente: Cliente) {
    if (!this.permissionService.canDelete('clientes')) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error de permisos',
        detail: 'No tiene permisos para eliminar clientes'
      });
      return;
    }
    
    this.confirmationService.confirm({
      message: `¿Eliminar a ${cliente.nombres} ${cliente.apellidos}?`,
      accept: () => this.eliminar(cliente)
    });
  }

  eliminar(cliente: Cliente) {
    this.loading = true;
    this.clienteService.eliminar(cliente.id!).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Eliminado', detail: 'Cliente eliminado' });
        this.cargarClientes();
      },
      complete: () => this.loading = false
    });
  }

  eliminarSeleccionados() {
    if (!this.permissionService.canDelete('clientes')) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error de permisos',
        detail: 'No tiene permisos para eliminar clientes'
      });
      return;
    }
    
    if (!this.selectedClientes.length) return;
    this.confirmationService.confirm({
      message: `¿Eliminar ${this.selectedClientes.length} clientes seleccionados?`,
      accept: () => {
        this.selectedClientes.forEach(cliente => {
          if (cliente.id) this.eliminar(cliente);
        });
        this.selectedClientes = [];
      }
    });
  }

  hideDialog() {
    this.visible = false;
    this.cliente = this.initCliente();
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
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';

import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { Almacen } from '../../../core/models/almacen.model';
import { AlmacenService } from '../../../core/services/almacen.service';
import { PermissionService, PermissionType } from '../../../core/services/permission.service';
import { finalize, forkJoin, catchError, of, firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-almacenes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    ConfirmDialogModule,
    DialogModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    TableModule,
    TextareaModule,
    ToastModule,
    ToolbarModule,
    HasPermissionDirective
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './almacenes.component.html'
})
export class AlmacenesComponent implements OnInit {

  // ========== DATOS Y ESTADO ==========
  almacenes: Almacen[] = [];
  selectedAlmacenes: Almacen[] = [];
  almacen: Almacen = this.initAlmacen();

  // ========== ESTADO UI ==========
  almacenDialog = false;
  editMode = false;
  loading = false;
  submitted = false;

  // ========== PERMISOS ==========
  permissionTypes = PermissionType;

  constructor(
    private readonly almacenService: AlmacenService,
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService,
    private readonly permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.loadAlmacenes();
  }

  // ========== MÉTODOS DE CARGA ==========

  loadAlmacenes(): void {
    this.loading = true;
    
    this.almacenService.getAlmacenes().subscribe({
      next: (response) => {
        this.almacenes = response || [];
      },
      error: (error) => {
        this.handleError(error, 'No se pudo cargar los almacenes');
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  // ========== CRUD ==========

  openNew(): void {
    if (!this.permissionService.canCreate('almacenes')) {
      this.showError('No tiene permisos para crear almacenes');
      return;
    }
    
    this.editMode = false;
    this.almacen = this.initAlmacen();
    this.submitted = false;
    this.almacenDialog = true;
  }

  editAlmacen(almacen: Almacen): void {
    if (!this.permissionService.canEdit('almacenes')) {
      this.showError('No tiene permisos para editar almacenes');
      return;
    }
    
    this.editMode = true;
    this.almacen = { ...almacen };
    this.submitted = false;
    this.almacenDialog = true;
  }

  saveAlmacen(): void {
    this.submitted = true;
    
    if (!this.isValidAlmacen()) {
      return;
    }
    
    this.loading = true;

    if (this.editMode && this.almacen.id) {
      this.almacenService.updateAlmacenes(this.almacen.id, this.almacen)
        .pipe(finalize(() => this.loading = false))
        .subscribe({
          next: () => {
            this.showSuccess('Almacén actualizado correctamente');
            this.hideDialog();
            this.loadAlmacenes();
          },
          error: (error) => this.handleError(error, 'No se pudo actualizar el almacén')
        });
    } else {
      this.almacenService.createAlmacenes(this.almacen)
        .pipe(finalize(() => this.loading = false))
        .subscribe({
          next: () => {
            this.showSuccess('Almacén creado correctamente');
            this.hideDialog();
            this.loadAlmacenes();
          },
          error: (error) => this.handleError(error, 'No se pudo crear el almacén')
        });
    }
  }

  deleteAlmacen(almacen: Almacen): void {
    if (!this.permissionService.canDelete('almacenes')) {
      this.showError('No tiene permisos para eliminar almacenes');
      return;
    }
    
    if (!almacen.id) return;
    
    this.confirmationService.confirm({
      message: `¿Está seguro que desea eliminar el almacén "${almacen.nombre}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.loading = true;
        this.almacenService.deleteAlmacenes(almacen.id!)
          .pipe(finalize(() => this.loading = false))
          .subscribe({
            next: () => {
              this.showSuccess('Almacén eliminado correctamente');
              this.loadAlmacenes();
              this.selectedAlmacenes = [];
            },
            error: (error) => this.handleError(error, 'No se pudo eliminar el almacén')
          });
      }
    });
  }

  deleteSelectedAlmacenes(): void {
    if (!this.permissionService.canDelete('almacenes')) {
      this.showError('No tiene permisos para eliminar almacenes');
      return;
    }

    if (!this.selectedAlmacenes.length) return;
    
    this.confirmationService.confirm({
      message: `¿Está seguro que desea eliminar los ${this.selectedAlmacenes.length} almacenes seleccionados?`,
      header: 'Confirmar eliminación múltiple',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.processMultipleDelete()
    });
  }

  // ========== VALIDACIONES ==========

  private isValidAlmacen(): boolean {
    if (!this.almacen.nombre?.trim()) {
      this.showError('El nombre del almacén es obligatorio');
      return false;
    }

    if (!this.almacen.ubicacion?.trim()) {
      this.showError('La ubicación del almacén es obligatoria');
      return false;
    }

    if (this.almacen.nombre.length < 2) {
      this.showError('El nombre debe tener al menos 2 caracteres');
      return false;
    }

    if (this.almacen.ubicacion.length < 3) {
      this.showError('La ubicación debe tener al menos 3 caracteres');
      return false;
    }

    return true;
  }

  private async processMultipleDelete(): Promise<void> {
    this.loading = true;
    
    try {
      const deleteOperations = this.selectedAlmacenes
        .filter(almacen => almacen.id)
        .map(almacen => 
          this.almacenService.deleteAlmacenes(almacen.id!)
            .pipe(catchError(() => of(false)))
        );
        
      if (deleteOperations.length === 0) {
        this.loading = false;
        return;
      }

      const results = await firstValueFrom(forkJoin(deleteOperations));
      const successful = results.filter(result => result !== false).length;
      const failed = results.length - successful;

      this.showDeleteResults(successful, failed);
      this.loadAlmacenes();
      this.selectedAlmacenes = [];
    } catch (error) {
      this.handleError(error, 'No se pudieron eliminar algunos almacenes');
    } finally {
      this.loading = false;
    }
  }

  private showDeleteResults(successful: number, failed: number): void {
    if (successful > 0) {
      this.showSuccess(`${successful} almacenes eliminados correctamente`);
    }
    
    if (failed > 0) {
      this.showWarning(`${failed} almacenes no pudieron ser eliminados`);
    }
  }

  // ========== UTILIDADES ==========

  hideDialog(): void {
    this.almacenDialog = false;
    this.submitted = false;
    this.almacen = this.initAlmacen();
  }

  onGlobalFilter(dt: any, event: Event): void {
    const element = event.target as HTMLInputElement;
    dt.filterGlobal(element.value, 'contains');
  }

  // ========== EXPORTACIÓN ==========

  exportarExcel(): void {
    if (!this.almacenes?.length) {
      this.showWarning('No hay datos para exportar');
      return;
    }

    import('xlsx').then(xlsx => {
      const dataToExport = this.almacenes.map(almacen => ({
        'ID': almacen.id || '',
        'Nombre': almacen.nombre || '',
        'Ubicación': almacen.ubicacion || '',
        'Descripción': almacen.descripcion || '',
        'Fecha Creación': almacen.fechaCreacion ? new Date(almacen.fechaCreacion).toLocaleString() : 'N/A'
      }));
      
      const worksheet = xlsx.utils.json_to_sheet(dataToExport);
      const workbook = { Sheets: { 'Almacenes': worksheet }, SheetNames: ['Almacenes'] };
      const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
      this.guardarArchivo(excelBuffer, 'almacenes');
    }).catch(() => {
      this.showError('Error al cargar la biblioteca de exportación');
    });
  }

  private guardarArchivo(buffer: any, fileName: string): void {
    const data = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(data);
    link.download = `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    link.click();
  }

  // ========== INICIALIZACIÓN ==========

  private initAlmacen(): Almacen {
    return {
      id: undefined,
      nombre: '',
      ubicacion: '',
      descripcion: '',
      fechaCreacion: undefined,
      fechaActualizacion: undefined
    };
  }

  // ========== MENSAJES ==========

  private showSuccess(message: string): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: message,
      life: 3000
    });
  }

  private showWarning(message: string): void {
    this.messageService.add({
      severity: 'warn',
      summary: 'Advertencia',
      detail: message,
      life: 3000
    });
  }

  private showError(message: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      life: 5000
    });
  }

  private handleError(error: any, defaultMessage: string): void {
    console.error('Error:', error);
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: error.error?.message || defaultMessage,
      life: 5000
    });
  }
}
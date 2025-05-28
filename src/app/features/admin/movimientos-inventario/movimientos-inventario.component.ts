import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { AuthService } from '../../../core/services/auth.service';
import { jwtDecode } from 'jwt-decode';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';
import { DialogModule } from 'primeng/dialog';
import { SelectButtonModule } from 'primeng/selectbutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

import { MovimientoInventario, PagedResponse, TipoMovimiento } from '../../../core/models/movimientos-inventario.model';
import { MovimientoInventarioService } from '../../../core/services/movimiento-inventario.service';
import { InventarioService } from '../../../core/services/inventario.service';
import { Inventario } from '../../../core/models/inventario.model';
import { PermissionService, PermissionType } from '../../../core/services/permission.service';
import { catchError, finalize, firstValueFrom, forkJoin, of } from 'rxjs';

interface TipoMovimientoOption {
  label: string;
  value: TipoMovimiento;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-movimientos-inventario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    ToolbarModule,
    DialogModule,
    SelectButtonModule,
    InputNumberModule,
    ToastModule,
    ConfirmDialogModule,
    TagModule,
    SelectModule,
    ProgressSpinnerModule,
    IconFieldModule,
    InputIconModule,
    HasPermissionDirective
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './movimientos-inventario.component.html'
})
export class MovimientosInventarioComponent implements OnInit {

  // Estado de datos
  movimientos: MovimientoInventario[] = [];
  movimientosFiltrados: MovimientoInventario[] = [];
  inventarios: Inventario[] = [];
  selectedMovimientos: MovimientoInventario[] = [];
  inventarioSeleccionado: Inventario | null = null;
  inventarioDestinoSeleccionado: Inventario | null = null;

  // Estado de filtros
  inventarioSeleccionadoFiltro: Inventario | null = null;
  tipoMovimientoFiltro: TipoMovimiento | null = null;

  // Estado del formulario
  movimiento: MovimientoInventario = this.createEmptyMovimiento();
  
  // Estado de UI
  movimientoDialog = false;
  loading = false;
  submitted = false;
  editMode = false;

  // Permisos
  permissionTypes = PermissionType;

  // Configuración
  tiposMovimiento: TipoMovimientoOption[] = [
    { 
      label: 'ENTRADA', 
      value: TipoMovimiento.ENTRADA,
      description: 'Ingreso de productos al inventario',
      icon: 'pi pi-plus-circle'
    },
    { 
      label: 'SALIDA', 
      value: TipoMovimiento.SALIDA,
      description: 'Salida de productos del inventario',
      icon: 'pi pi-minus-circle'
    },
    { 
      label: 'AJUSTE', 
      value: TipoMovimiento.AJUSTE,
      description: 'Ajuste de cantidades en inventario',
      icon: 'pi pi-cog'
    },
    { 
      label: 'TRASLADO', 
      value: TipoMovimiento.TRASLADO,
      description: 'Traslado entre inventarios',
      icon: 'pi pi-arrow-right-arrow-left'
    }
  ];

  constructor(
    private readonly movimientoService: MovimientoInventarioService,
    private readonly inventarioService: InventarioService,
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService,
    private readonly permissionService: PermissionService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadInventarios();
  }

  // ========== MÉTODOS DE CARGA ==========
  
  loadInventarios(): void {
    this.inventarioService.obtenerInventarios(0, 1000).subscribe({
      next: (response) => {
        this.inventarios = response.contenido || [];
      },
      error: (error) => {
        this.handleError(error, 'No se pudo cargar los inventarios');
      }
    });
  }
  
  filtrarMovimientosPorInventario(): void {
    this.selectedMovimientos = [];
    
    if (this.inventarioSeleccionadoFiltro) {
      this.loading = true;
      
      this.movimientoService.obtenerMovimientosPorInventario(this.inventarioSeleccionadoFiltro.id!).subscribe({
        next: (response: PagedResponse<MovimientoInventario>) => {
          this.movimientosFiltrados = response.contenido;
          this.loading = false;
        },
        error: (error) => {
          this.handleError(error, 'No se pudo cargar los movimientos de este inventario');
          this.movimientosFiltrados = [];
          this.loading = false;
        }
      });
    } else {
      this.movimientosFiltrados = [];
    }
  }

  // ========== MÉTODOS DE CRUD ==========
  
  openNew(): void {
    if (!this.permissionService.canCreate('movimientosInventario')) {
      this.showError('No tiene permisos para crear movimientos');
      return;
    }
    
    this.editMode = false;
    this.inventarioSeleccionado = this.inventarioSeleccionadoFiltro;
    this.movimiento = this.createEmptyMovimiento();
    this.inventarioDestinoSeleccionado = null;
    this.submitted = false;
    this.movimientoDialog = true;
  }

  editMovimiento(movimiento: MovimientoInventario): void {
    if (!this.permissionService.canEdit('movimientosInventario')) {
      this.showError('No tienes permiso para editar movimientos');
      return;
    }
    
    this.editMode = true;
    this.movimiento = { ...movimiento };
    this.inventarioSeleccionado = movimiento.inventario;
    this.inventarioDestinoSeleccionado = movimiento.inventarioDestino;
    this.submitted = false;
    this.movimientoDialog = true;
  }

  guardarMovimiento(): void {
    this.submitted = true;
  
    if (!this.isValidMovimiento()) {
      return;
    }
  
    this.loading = true;
    const username = this.getCurrentUsername();
  
    const movimientoData = {
      inventarioId: this.inventarioSeleccionado?.id,
      tipo: this.movimiento.tipo,
      cantidad: this.movimiento.cantidad,
      descripcion: this.movimiento.descripcion,
      referencia: this.movimiento.referencia,
      usuario: username,
      ...(this.movimiento.tipo === 'TRASLADO' && this.inventarioDestinoSeleccionado && {
        inventarioDestinoId: this.inventarioDestinoSeleccionado.id
      })
    };
  
    if (this.editMode && this.movimiento.id) {
      this.showWarning('Funcionalidad de actualización en desarrollo');
      this.loading = false;
      this.hideDialog();
    } else {
      this.movimientoService.createMovimiento(movimientoData)
        .pipe(finalize(() => this.loading = false))
        .subscribe({
          next: (result) => {
            this.movimientos.unshift(result);
            this.filtrarMovimientosPorInventario(); // Actualizar la lista filtrada
            this.showSuccess('Movimiento creado exitosamente');
            this.hideDialog();
          },
          error: (error) => {
            this.handleError(error, 'Error creando movimiento');
          }
        });
    }
  }

  deleteMovimiento(movimiento: MovimientoInventario): void {
    if (!this.permissionService.canDelete('movimientosInventario')) {
      this.showError('No tiene permisos para eliminar movimientos');
      return;
    }

    if (!movimiento.id) return;
    
    this.confirmationService.confirm({
      message: `¿Está seguro que desea eliminar el movimiento ${movimiento.id}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.loading = true;
        this.movimientoService.eliminarMovimiento(movimiento.id!).subscribe({
          next: () => {
            this.showSuccess('Movimiento eliminado correctamente');
            this.filtrarMovimientosPorInventario();
            this.selectedMovimientos = [];
          },
          error: (error) => this.handleError(error, 'No se pudo eliminar el movimiento'),
          complete: () => this.loading = false
        });
      }
    });
  }

  deleteSelectedMovimientos(): void {
    if (!this.permissionService.canDelete('movimientosInventario')) {
      this.showError('No tiene permisos para eliminar movimientos');
      return;
    }
 
    this.confirmationService.confirm({
      message: `¿Está seguro que desea eliminar ${this.selectedMovimientos.length} movimientos?`,
      header: 'Confirmar Eliminación Múltiple',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.processMultipleDelete()
    });
  }

  // ========== VALIDACIONES ==========
  
  isValidMovimiento(): boolean {
    if (!this.inventarioSeleccionado) {
      this.showError('Debe seleccionar un inventario');
      return false;
    }

    if (!this.movimiento.tipo) {
      this.showError('Debe seleccionar un tipo de movimiento');
      return false;
    }

    if (!this.movimiento.cantidad || this.movimiento.cantidad <= 0) {
      this.showError('La cantidad debe ser mayor a 0');
      return false;
    }

    if (!this.movimiento.descripcion?.trim()) {
      this.showError('La descripción es obligatoria');
      return false;
    }

    if (!this.movimiento.referencia?.trim()) {
      this.showError('La referencia es obligatoria');
      return false;
    }

    // Validar stock suficiente para salidas
    if (this.movimiento.tipo === 'SALIDA') {
      const stockDisponible = this.inventarioSeleccionado.cantidad;
      if (this.movimiento.cantidad > stockDisponible) {
        this.showError(`Stock insuficiente. Disponible: ${stockDisponible}`);
        return false;
      }
    }

    // Validar inventario destino para traslados
    if (this.movimiento.tipo === 'TRASLADO') {
      if (!this.inventarioDestinoSeleccionado) {
        this.showError('Debe seleccionar un inventario de destino para el traslado');
        return false;
      }
      
      if (this.inventarioDestinoSeleccionado.id === this.inventarioSeleccionado.id) {
        this.showError('El inventario de destino no puede ser el mismo que el de origen');
        return false;
      }
    }

    return true;
  }

  // ========== UTILIDADES ==========
  
  hideDialog(): void {
    this.movimientoDialog = false;
    this.submitted = false;
    this.movimiento = this.createEmptyMovimiento();
    this.inventarioSeleccionado = null;
    this.inventarioDestinoSeleccionado = null;
  }

  private createEmptyMovimiento(): MovimientoInventario {
    return {
      id: undefined,
      inventario: null,
      inventarioDestino: null,
      cantidad: 1, // ← CORREGIDO: Cambié de 0 a 1
      tipo: TipoMovimiento.ENTRADA,
      descripcion: '',
      referencia: '',
      fechaMovimiento: new Date(),
      usuario: ''
    };
  }

  private getCurrentUsername(): string {
    const token = this.authService.getToken();
    if (!token) return 'sistema';
    
    try {
      const decodedToken = jwtDecode<{ sub: string }>(token);
      return decodedToken.sub;
    } catch (error) {
      console.error('Error al decodificar el token:', error);
      return 'sistema';
    }
  }

  private async processMultipleDelete(): Promise<void> {
    this.loading = true;
    
    try {
      const deleteOperations = this.selectedMovimientos
        .filter(movimiento => movimiento.id)
        .map(movimiento => 
          this.movimientoService.eliminarMovimiento(movimiento.id!)
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
      this.filtrarMovimientosPorInventario();
      this.selectedMovimientos = [];
    } catch (error) {
      this.handleError(error, 'No se pudo eliminar los movimientos');
    } finally {
      this.loading = false;
    }
  }

  private showDeleteResults(successful: number, failed: number): void {
    if (successful > 0) {
      this.showSuccess(`${successful} movimientos eliminados correctamente`);
    }
    
    if (failed > 0) {
      this.showWarning(`${failed} movimientos no pudieron ser eliminados`);
    }
  }

  // ========== EVENTOS Y FILTROS ==========
  
  onGlobalFilter(dt: any, event: Event): void {
    const element = event.target as HTMLInputElement;
    dt.filterGlobal(element.value, 'contains');
  }

  limpiarFiltros(): void {
    this.inventarioSeleccionadoFiltro = null;
    this.tipoMovimientoFiltro = null;
    this.selectedMovimientos = [];
    this.movimientosFiltrados = [];
  }

  // ========== UTILIDADES DE UI ==========
  
  getTipoSeverity(tipo: TipoMovimiento): 'success' | 'danger' | 'warning' | 'info' | 'secondary' {
    const severityMap = {
      [TipoMovimiento.ENTRADA]: 'success' as const,
      [TipoMovimiento.SALIDA]: 'danger' as const,
      [TipoMovimiento.AJUSTE]: 'warning' as const,
      [TipoMovimiento.TRASLADO]: 'info' as const
    };
    
    return severityMap[tipo] || 'secondary';
  }

  getTipoIcon(tipo: TipoMovimiento): string {
    const iconMap = {
      [TipoMovimiento.ENTRADA]: 'pi pi-plus-circle',
      [TipoMovimiento.SALIDA]: 'pi pi-minus-circle',
      [TipoMovimiento.AJUSTE]: 'pi pi-cog',
      [TipoMovimiento.TRASLADO]: 'pi pi-arrow-right-arrow-left'
    };
    
    return iconMap[tipo] || 'pi pi-circle';
  }

  // ========== EXPORTACIÓN ==========
  
  exportarExcel(): void {
    if (this.movimientosFiltrados.length === 0) {
      this.showWarning('No hay datos para exportar');
      return;
    }

    import('xlsx').then(xlsx => {
      const dataToExport = this.movimientosFiltrados.map(m => ({
        'ID': m.id || '',
        'Fecha': m.fechaMovimiento ? new Date(m.fechaMovimiento).toLocaleDateString() : 'N/A',
        'Tipo': m.tipo || '',
        'Cantidad': m.cantidad || 0,
        'Inventario Origen': m.inventario?.serie || 'N/A',
        'Inventario Destino': m.inventarioDestino?.serie || 'No aplica',
        'Descripción': m.descripcion || '',
        'Referencia': m.referencia || ''
      }));

      const worksheet = xlsx.utils.json_to_sheet(dataToExport);
      const workbook = { Sheets: { 'Movimientos': worksheet }, SheetNames: ['Movimientos'] };
      const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
      this.guardarArchivo(excelBuffer, 'movimientos_inventario');
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
      detail: error.error?.message || defaultMessage
    });
    this.loading = false;
  }
}
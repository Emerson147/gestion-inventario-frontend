import { Component, OnInit, inject } from '@angular/core';
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
  templateUrl: './movimientos-inventario.component.html',
  styleUrls: ['./movimientos-inventario.component.scss']
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
  filtroTipo: string | null = null;
  fechaMovimientoFiltro: Date | null = null;
  productoFiltro: { id?: number; nombre?: string; } | null = null;
  tipoMovimientoSeleccionado: TipoMovimiento | null = null;

  // Estado del formulario
  movimiento: MovimientoInventario = this.createEmptyMovimiento();
  
  // Estado de UI
  movimientoDialog = false;
  loading = false;
  isLoading = false;
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

  private readonly movimientoService: MovimientoInventarioService = inject(MovimientoInventarioService);
  private readonly inventarioService: InventarioService = inject(InventarioService);
  private readonly messageService: MessageService = inject(MessageService);
  private readonly confirmationService: ConfirmationService = inject(ConfirmationService);
  private readonly permissionService: PermissionService = inject(PermissionService);
  private readonly authService: AuthService = inject(AuthService);

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

  guardarMovimiento(): void {
    this.submitted = true;
  
    if (!this.isValidMovimiento()) {
      return;
    }
  
    this.loading = true;
  
    const movimientoData: Omit<MovimientoInventario, 'id' | 'fechaMovimiento' | 'usuario'> = {
      inventario: this.inventarioSeleccionado,
      inventarioDestino: this.movimiento.tipo === 'TRASLADO' ? this.inventarioDestinoSeleccionado : null,
      tipo: this.movimiento.tipo,
      cantidad: this.movimiento.cantidad,
      descripcion: this.movimiento.descripcion,
      referencia: this.movimiento.referencia,
      // El usuario se maneja en el backend basado en el token de autenticación
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
          error: (error: unknown) => {
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
  
  onGlobalFilter(dt: { filterGlobal: (value: string, matchMode: string) => void }, event: Event): void {
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

  private guardarArchivo(buffer: ArrayBuffer, fileName: string): void {
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

  private handleError(error: unknown, defaultMessage: string): void {
    console.error('Error:', error);
    let errorMessage = defaultMessage;
    
    if (error && typeof error === 'object' && 'error' in error) {
      const errorObj = (error as { error?: unknown }).error;
      if (errorObj && typeof errorObj === 'object' && 'message' in errorObj) {
        errorMessage = String((errorObj as { message: unknown }).message);
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage
    });
    this.loading = false;
  }

   // 📅 Variables para fechas y usuario
   private readonly currentDateTime = new Date('2025-06-18T20:40:18Z');
   private readonly currentUser = 'Emerson147';

  /**
   * 🕒 Obtiene la hora actual formateada
   */
  getCurrentTime(): string {
    return this.currentDateTime.toLocaleTimeString('es-PE', {
      timeZone: 'UTC',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
  
  /**
   * 👤 Obtiene el usuario actual
   */
  getCurrentUser(): string {
    return this.currentUser;
  }
  
  /**
   * 📅 Obtiene la fecha y hora actual
   */
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
  
  // ==================== MÉTODOS DE MÉTRICAS ====================
  
  /**
   * Obtiene el número de entradas del día actual
   */
  getEntradasHoy(): number {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    return this.movimientos.filter(m => {
      const fechaMovimiento = new Date(m.fechaMovimiento || '');
      fechaMovimiento.setHours(0, 0, 0, 0);
      return fechaMovimiento.getTime() === hoy.getTime() && m.tipo === 'ENTRADA';
    }).length;
  }

  /**
   * Obtiene el número de salidas del día actual
   */
  getSalidasHoy(): number {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    return this.movimientos.filter(m => {
      const fechaMovimiento = new Date(m.fechaMovimiento || '');
      fechaMovimiento.setHours(0, 0, 0, 0);
      return fechaMovimiento.getTime() === hoy.getTime() && m.tipo === 'SALIDA';
    }).length;
  }

  /**
   * Calcula el valor total de los movimientos del mes actual
   */
  getValorTotalMovimientos(): number {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    return this.movimientos
      .filter(m => new Date(m.fechaMovimiento || '') >= inicioMes)
      .reduce((total, m) => total + (m.cantidad * (m.inventario?.producto?.precioVenta || 0)), 0);
  }

  /**
   * Obtiene el número de productos con stock crítico
   */
  getProductosStockCritico(): number {
    // Esto requeriría acceso a los productos o un endpoint específico
    // Por ahora retornamos un valor calculado
    return this.movimientos
      .map(m => m.inventario)
      .filter((producto, index, array) => 
        producto && array.findIndex(p => p?.id === producto.id) === index
      )
      .filter(producto => (producto?.cantidad || 0) < 5) // Asumiendo stock crítico < 5
      .length;
  }

  /**
   * Calcula la eficiencia de los movimientos
   */
  getEficienciaMovimientos(): number {
    const totalMovimientos = this.movimientos.length;
    const movimientosExitosos = this.movimientos.filter(m => m.tipo === 'ENTRADA').length;
    
    return totalMovimientos > 0 ? (movimientosExitosos / totalMovimientos) * 100 : 100;
  }

  // ==================== MÉTODOS DE LA TOOLBAR ====================
  
  /**
   * Cuenta el número de filtros activos
   */
  getActiveFiltrosCount(): number {
    let count = 0;
    if (this.tipoMovimientoFiltro) count++;
    if (this.fechaMovimientoFiltro) count++;
    if (this.productoFiltro) count++;
    return count;
  }
  
  /**
   * Verifica si hay filtros activos
   */
  hasActiveFilters(): boolean {
    return !!(this.inventarioSeleccionadoFiltro || this.filtroTipo || this.fechaMovimientoFiltro || this.productoFiltro);
  }
  
  /**
   * Elimina un filtro específico
   */
  removeFilter(filterType: string): void {
    switch (filterType) {
      case 'tipo':
        this.filtroTipo = null;
        this.tipoMovimientoFiltro = null;
        break;
      // Add other filter types as needed
    }
    // Optionally, re-apply filters or reset the view
    this.filtrarMovimientosPorInventario();
  }
  
  /**
   * Aplica los filtros a la lista de movimientos
   */
  aplicarFiltros(): void {
    this.movimientosFiltrados = [...this.movimientos];
    
    if (this.tipoMovimientoFiltro) {
      this.movimientosFiltrados = this.movimientosFiltrados.filter(m => 
        m.tipo === this.tipoMovimientoFiltro
      );
    }
    
    if (this.fechaMovimientoFiltro) {
      const fechaFiltro = new Date(this.fechaMovimientoFiltro);
      this.movimientosFiltrados = this.movimientosFiltrados.filter(m => {
        const fechaMovimiento = new Date(m.fechaMovimiento || '');
        return fechaMovimiento.toDateString() === fechaFiltro.toDateString();
      });
    }
    
    if (this.productoFiltro) {
      this.movimientosFiltrados = this.movimientosFiltrados.filter(m => 
        m.inventario?.producto?.nombre?.toLowerCase().includes(this.productoFiltro?.nombre?.toLowerCase() || '')
      );
    }
  }
  
  // ==================== MÉTODOS DE ACCIÓN RÁPIDA ====================
  

  
  /**
   * Abre el diálogo para nueva entrada rápida
   */
  entradaRapida(): void {
    this.tipoMovimientoSeleccionado = TipoMovimiento.ENTRADA;
    this.openNew();
  }

  /**
   * Abre el diálogo para nueva salida rápida
   */
  salidaRapida(): void {
    this.tipoMovimientoSeleccionado = TipoMovimiento.SALIDA;
    this.openNew();
  }

  /**
   * Abre el diálogo para ajuste de inventario
   */
  ajusteInventario(): void {
    this.tipoMovimientoSeleccionado = TipoMovimiento.AJUSTE;
    this.openNew();
  }

  /**
   * Actualiza la lista de movimientos
   */
  refresh(): void {
    this.loading = true;
    this.isLoading = true;
    // Implementar lógica para cargar movimientos
    this.loading = false;
    this.isLoading = false;
  }
}
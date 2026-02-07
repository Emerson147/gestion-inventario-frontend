import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService, MenuItem } from 'primeng/api';
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
import { CalendarModule } from 'primeng/calendar';
import { SidebarModule } from 'primeng/sidebar';
import { ChartModule } from 'primeng/chart';
import { SplitButtonModule } from 'primeng/splitbutton';
import * as XLSX from 'xlsx';

import { MovimientoRequest, MovimientoResponse, PagedResponse, TipoMovimiento } from '../../../core/models/movimientos-inventario.model';
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
    HasPermissionDirective,
    CalendarModule,
    SidebarModule,
    ChartModule,
    SplitButtonModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './movimientos-inventario.component.html',
  styleUrls: ['./movimientos-inventario.component.scss']
})
export class MovimientosInventarioComponent implements OnInit {
  // Estado de datos
  movimientos: MovimientoResponse[] = [];
  movimientosFiltrados: MovimientoResponse[] = [];
  inventarios: Inventario[] = [];
  selectedMovimientos: MovimientoResponse[] = [];
  inventarioSeleccionado: Inventario | null = null;
  inventarioDestinoSeleccionado: Inventario | null = null;

  // Estado de filtros
  inventarioSeleccionadoFiltro: Inventario | null = null;
  tipoMovimientoFiltro: TipoMovimiento | null = null;
  filtroTipo: string | null = null;
  fechaMovimientoFiltro: Date | null = null;
  productoFiltro: { id?: number; nombre?: string; } | null = null;
  tipoMovimientoSeleccionado: TipoMovimiento | null = null;
  
  // Nuevos filtros de fecha
  fechaDesde: Date | null = null;
  fechaHasta: Date | null = null;
  rangoFechaPreset: string | null = null;

  // Estado del formulario
  movimiento!: MovimientoResponse;
  
  // Estado de UI
  movimientoDialog = false;
  loading = false;
  isLoading = false;
  submitted = false;
  editMode = false;
  
  // Nuevos estados para funcionalidades
  detallesSidebarVisible = false;
  movimientoDetalle: MovimientoResponse | null = null;
  graficosDialogVisible = false;
  chartData: any;
  chartOptions: any;
  
  // Estados de movimiento
  estadosMovimiento = [
    { label: 'Completado', value: 'COMPLETADO', severity: 'success', icon: 'pi pi-check-circle' },
    { label: 'Pendiente', value: 'PENDIENTE', severity: 'warning', icon: 'pi pi-clock' },
    { label: 'Revertido', value: 'REVERTIDO', severity: 'secondary', icon: 'pi pi-replay' },
    { label: 'Anulado', value: 'ANULADO', severity: 'danger', icon: 'pi pi-times-circle' }
  ];
  estadoFiltro: string | null = null;

  // Opciones de exportación
  opcionesExportacion: MenuItem[] = [];

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
      label: 'AJUSTE', 
      value: TipoMovimiento.AJUSTE,
      description: 'Ajuste manual de stock (aumentar o reducir)',
      icon: 'pi pi-sliders-h'
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
    this.movimiento = this.createEmptyMovimiento();
    this.loadInventarios();
    this.loadTodosLosMovimientos(); // Cargar todos los movimientos para el dashboard
    this.inicializarOpcionesExportacion();
  }

  // ========== INICIALIZACIÓN ==========
  
  inicializarOpcionesExportacion(): void {
    this.opcionesExportacion = [
      {
        label: 'Exportar como Excel',
        icon: 'pi pi-file-excel',
        command: () => this.exportarExcelMejorado(),
        styleClass: 'text-green-700'
      },
      {
        label: 'Exportar como PDF',
        icon: 'pi pi-file-pdf',
        command: () => this.exportarPDF(),
        styleClass: 'text-red-700'
      }
    ];
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

  /**
   * Carga todos los movimientos del sistema para mostrar estadísticas generales
   */
  loadTodosLosMovimientos(): void {
    this.loading = true;
    
    // Obtener todos los movimientos usando el método correcto del servicio
    this.movimientoService.getMovimientos(0, 500, 'fechaMovimiento', 'desc').subscribe({
      next: (response: PagedResponse<MovimientoResponse>) => {
        this.movimientos = response.contenido || [];
        this.loading = false;
        
        console.log('✅ Movimientos cargados:', this.movimientos.length);
        console.log('📊 Entradas hoy:', this.getEntradasHoy());
        console.log('📤 Salidas hoy:', this.getSalidasHoy());
        console.log('💰 Valor total:', this.getValorTotalMovimientos());
        console.log('⚠️ Stock crítico:', this.getProductosStockCritico());
        console.log('📈 Eficiencia:', this.getEficienciaMovimientos());
      },
      error: (error) => {
        console.error('❌ Error al cargar movimientos:', error);
        this.handleError(error, 'No se pudo cargar los movimientos para el dashboard');
        this.movimientos = [];
        this.loading = false;
      }
    });
  }

  /**
   * Método alternativo: carga movimientos de todos los inventarios conocidos
   */
  private loadMovimientosDeTodosLosInventarios(): void {
    const requests = this.inventarios.slice(0, 10).map(inv => 
      this.movimientoService.obtenerMovimientosPorInventario(inv.id!)
    );

    forkJoin(requests).subscribe({
      next: (responses) => {
        this.movimientos = responses.flatMap(r => r.contenido || []);
        this.loading = false;
        
        console.log('✅ Movimientos cargados (método alternativo):', this.movimientos.length);
      },
      error: (error) => {
        this.handleError(error, 'No se pudo cargar los movimientos');
        this.movimientos = [];
        this.loading = false;
      }
    });
  }

  
  filtrarMovimientosPorInventario(): void {
    this.selectedMovimientos = [];
    
    if (this.inventarioSeleccionadoFiltro) {
      this.loading = true;
      
      this.movimientoService.obtenerMovimientosPorInventario(this.inventarioSeleccionadoFiltro.id!).subscribe({
        next: (response: PagedResponse<MovimientoResponse>) => {
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

  editMovimiento(movimiento: MovimientoResponse): void {
    if (!this.permissionService.canEdit('movimientosInventario')) {
      this.showError('No tienes permiso para editar movimientos');
      return;
    }
    
    this.editMode = true;
    this.movimiento = { ...movimiento };
    
    // Buscar el inventario correspondiente al ID
    this.inventarioSeleccionado = this.inventarios.find(inv => inv.id === movimiento.inventarioId) || null;
    this.inventarioDestinoSeleccionado = movimiento.inventarioDestinoId 
      ? this.inventarios.find(inv => inv.id === movimiento.inventarioDestinoId) || null
      : null;
    
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
  
    const movimientoData: Omit<MovimientoRequest, 'id' | 'fechaMovimiento'> = {
      inventarioId: this.inventarioSeleccionado?.id ?? 0,
      inventarioDestinoId: this.movimiento.tipo === 'TRASLADO' ? this.inventarioDestinoSeleccionado?.id ?? 0 : undefined,
      tipo: this.movimiento.tipo,
      cantidad: this.movimiento.cantidad,
      referencia: this.movimiento.referencia?.trim() || `MOV-${Date.now()}`,
      descripcion: this.movimiento.descripcion,
      usuario: this.getCurrentUsername(), // Obtener usuario del token JWT
      ventaId: undefined // Movimientos manuales no tienen ventaId
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

  deleteMovimiento(movimiento: MovimientoResponse): void {
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

  private createEmptyMovimiento(): MovimientoResponse {
    return {
      id: 0,
      inventarioId: this.inventarioSeleccionado?.id ?? 0,
      inventarioDestinoId: undefined,
      cantidad: 1,
      tipo: TipoMovimiento.ENTRADA,
      descripcion: '',
      referencia: '',
      fechaMovimiento: new Date().toISOString(),
      usuario: this.getCurrentUsername()
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
        'Inventario Origen': m.inventarioId || 'N/A',
        'Inventario Destino': m.inventarioDestinoId || 'No aplica',
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
  
  private showInfo(message: string): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Información',
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
   * Si hay inventario seleccionado, muestra solo datos de ese inventario
   */
  getEntradasHoy(): number {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // Si hay inventario seleccionado, usar movimientosFiltrados
    // Si no, usar todos los movimientos
    const movimientosParaAnalizar = this.inventarioSeleccionadoFiltro 
      ? this.movimientosFiltrados 
      : this.movimientos;
    
    return movimientosParaAnalizar.filter(m => {
      const fechaMovimiento = new Date(m.fechaMovimiento || '');
      fechaMovimiento.setHours(0, 0, 0, 0);
      return fechaMovimiento.getTime() === hoy.getTime() && 
             m.tipo === TipoMovimiento.ENTRADA;
    }).reduce((sum, m) => sum + (m.cantidad || 0), 0);
  }

  /**
   * Obtiene el número de salidas del día actual
   * Si hay inventario seleccionado, muestra solo datos de ese inventario
   */
  getSalidasHoy(): number {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // Si hay inventario seleccionado, usar movimientosFiltrados
    // Si no, usar todos los movimientos
    const movimientosParaAnalizar = this.inventarioSeleccionadoFiltro 
      ? this.movimientosFiltrados 
      : this.movimientos;
    
    return movimientosParaAnalizar.filter(m => {
      const fechaMovimiento = new Date(m.fechaMovimiento || '');
      fechaMovimiento.setHours(0, 0, 0, 0);
      return fechaMovimiento.getTime() === hoy.getTime() && 
             m.tipo === TipoMovimiento.SALIDA;
    }).reduce((sum, m) => sum + (m.cantidad || 0), 0);
  }

  /**
   * Calcula el valor total de los movimientos del mes actual
   * Si hay inventario seleccionado, muestra solo datos de ese inventario
   */
  getValorTotalMovimientos(): number {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    // Si hay inventario seleccionado, usar movimientosFiltrados
    // Si no, usar todos los movimientos
    const movimientosParaAnalizar = this.inventarioSeleccionadoFiltro 
      ? this.movimientosFiltrados 
      : this.movimientos;
    
    return movimientosParaAnalizar
      .filter(m => {
        const fecha = new Date(m.fechaMovimiento || '');
        return fecha >= inicioMes;
      })
      .reduce((total, m) => {
        const precio = m.producto?.precioVenta || 0;
        const cantidad = m.cantidad || 0;
        return total + (cantidad * precio);
      }, 0);
  }

  /**
   * Obtiene el número de productos con stock crítico
   * Si hay inventario seleccionado, solo muestra ese producto
   */
  getProductosStockCritico(): number {
    // Si hay inventario seleccionado, verificar solo ese
    if (this.inventarioSeleccionadoFiltro) {
      const cantidad = this.inventarioSeleccionadoFiltro.cantidad || 0;
      const stockMinimo = 10;
      return (cantidad < stockMinimo && cantidad > 0) ? 1 : 0;
    }
    
    // Si no hay filtro, mostrar todos los productos con stock crítico
    return this.inventarios
      .filter(inv => {
        const cantidad = inv.cantidad || 0;
        const stockMinimo = 10;
        return cantidad < stockMinimo && cantidad > 0;
      })
      .length;
  }

  /**
   * Calcula la eficiencia de los movimientos del día
   * Si hay inventario seleccionado, muestra solo datos de ese inventario
   */
  getEficienciaMovimientos(): number {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // Si hay inventario seleccionado, usar movimientosFiltrados
    // Si no, usar todos los movimientos
    const movimientosParaAnalizar = this.inventarioSeleccionadoFiltro 
      ? this.movimientosFiltrados 
      : this.movimientos;
    
    const movimientosHoy = movimientosParaAnalizar.filter(m => {
      const fechaMovimiento = new Date(m.fechaMovimiento || '');
      fechaMovimiento.setHours(0, 0, 0, 0);
      return fechaMovimiento.getTime() === hoy.getTime();
    });
    
    const totalHoy = movimientosHoy.length;
    const entradasHoy = movimientosHoy.filter(m => m.tipo === TipoMovimiento.ENTRADA).length;
    const salidasHoy = movimientosHoy.filter(m => m.tipo === TipoMovimiento.SALIDA).length;
    
    // Eficiencia basada en balance positivo (más entradas que salidas = mejor)
    if (totalHoy === 0) return 100;
    
    const balance = entradasHoy - salidasHoy;
    const eficiencia = 50 + (balance / totalHoy) * 50;
    
    return Math.max(0, Math.min(100, eficiencia));
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
        m.producto?.nombre?.toLowerCase().includes(this.productoFiltro?.nombre?.toLowerCase() || '')
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
    
    // Recargar todos los movimientos para el dashboard
    this.loadTodosLosMovimientos();
    
    // Si hay un inventario seleccionado, también recargar sus movimientos
    if (this.inventarioSeleccionadoFiltro) {
      this.filtrarMovimientosPorInventario();
    }
    
    // Mostrar mensaje de éxito
    this.showInfo('Datos actualizados correctamente');
    
    this.loading = false;
    this.isLoading = false;
  }
  
  // ==================== NUEVOS MÉTODOS: FILTROS POR FECHA ====================
  
  /**
   * Aplica preset de rango de fechas
   */
  aplicarRangoFechaPreset(preset: string): void {
    const hoy = new Date();
    this.rangoFechaPreset = preset;
    
    switch (preset) {
      case 'hoy':
        this.fechaDesde = new Date(hoy.setHours(0, 0, 0, 0));
        this.fechaHasta = new Date(hoy.setHours(23, 59, 59, 999));
        break;
      case 'semana':
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(hoy.getDate() - hoy.getDay());
        this.fechaDesde = new Date(inicioSemana.setHours(0, 0, 0, 0));
        this.fechaHasta = new Date();
        break;
      case 'mes':
        this.fechaDesde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        this.fechaHasta = new Date();
        break;
      case 'ultimoMes':
        const hace30Dias = new Date();
        hace30Dias.setDate(hoy.getDate() - 30);
        this.fechaDesde = hace30Dias;
        this.fechaHasta = new Date();
        break;
      case 'limpiar':
        this.fechaDesde = null;
        this.fechaHasta = null;
        this.rangoFechaPreset = null;
        break;
    }
    
    this.aplicarFiltrosPorFecha();
  }
  
  /**
   * Filtra movimientos por rango de fechas
   */
  aplicarFiltrosPorFecha(): void {
    if (!this.inventarioSeleccionadoFiltro) return;
    
    let movimientosFiltrados = [...this.movimientosFiltrados];
    
    if (this.fechaDesde && this.fechaHasta) {
      movimientosFiltrados = movimientosFiltrados.filter(m => {
        const fechaMov = new Date(m.fechaMovimiento || '');
        return fechaMov >= this.fechaDesde! && fechaMov <= this.fechaHasta!;
      });
    }
    
    if (this.estadoFiltro) {
      movimientosFiltrados = movimientosFiltrados.filter(m => 
        this.getEstadoMovimiento(m) === this.estadoFiltro
      );
    }
    
    this.movimientosFiltrados = movimientosFiltrados;
  }
  
  // ==================== NUEVOS MÉTODOS: EXPORTACIÓN MEJORADA ====================
  
  /**
   * Exporta movimientos a Excel con formato mejorado
   */
  exportarExcelMejorado(): void {
    if (!this.movimientosFiltrados.length) {
      this.showWarning('No hay datos para exportar');
      return;
    }

    // Preparar datos con formato mejorado
    const datosExportar = this.movimientosFiltrados.map(m => ({
      'Fecha': new Date(m.fechaMovimiento || '').toLocaleDateString('es-PE'),
      'Hora': new Date(m.fechaMovimiento || '').toLocaleTimeString('es-PE'),
      'Tipo': m.tipo,
      'Producto': m.producto?.nombre || 'N/A',
      'Color': m.color?.nombre || 'N/A',
      'Código Hex': m.color?.codigoHex || 'N/A',
      'Talla': m.talla?.numero || 'N/A',
      'Serie': m.inventarioId,
      'Cantidad': m.cantidad,
      'Descripción': m.descripcion,
      'Referencia': m.referencia,
      'Usuario': m.usuario,
      'Estado': this.getEstadoMovimiento(m)
    }));

    // Crear hoja de cálculo
    const ws = XLSX.utils.json_to_sheet(datosExportar);
    
    // Ajustar anchos de columna
    const colWidths = [
      { wch: 12 }, // Fecha
      { wch: 10 }, // Hora
      { wch: 10 }, // Tipo
      { wch: 30 }, // Producto
      { wch: 15 }, // Color
      { wch: 10 }, // Código Hex
      { wch: 8 },  // Talla
      { wch: 20 }, // Almacén
      { wch: 15 }, // Serie
      { wch: 10 }, // Cantidad
      { wch: 40 }, // Descripción
      { wch: 15 }, // Referencia
      { wch: 15 }, // Usuario
      { wch: 12 }  // Estado
    ];
    ws['!cols'] = colWidths;

    // Añadir totales
    const totalCantidad = this.movimientosFiltrados.reduce((sum, m) => sum + (m.cantidad || 0), 0);
    XLSX.utils.sheet_add_json(ws, [
      { 'Fecha': '', 'Hora': '', 'Tipo': '', 'Producto': '', 'Color': '', 'Código Hex': '', 'Talla': '', 'Almacén': '', 'Serie': 'TOTAL:', 'Cantidad': totalCantidad }
    ], { skipHeader: true, origin: -1 });

    // Crear libro y guardar
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Movimientos');
    
    // Añadir información de filtros
    const infoSheet = XLSX.utils.json_to_sheet([
      { 'Información': 'Reporte de Movimientos de Inventario' },
      { 'Información': `Generado el: ${new Date().toLocaleString('es-PE')}` },
      { 'Información': `Total de registros: ${this.movimientosFiltrados.length}` },
      { 'Información': `Inventario: ${this.inventarioSeleccionadoFiltro?.serie || 'Todos'}` },
      { 'Información': `Rango de fechas: ${this.fechaDesde ? new Date(this.fechaDesde).toLocaleDateString('es-PE') : 'N/A'} - ${this.fechaHasta ? new Date(this.fechaHasta).toLocaleDateString('es-PE') : 'N/A'}` }
    ]);
    XLSX.utils.book_append_sheet(wb, infoSheet, 'Información');
    
    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Movimientos_Inventario_${fecha}.xlsx`);
    
    this.showSuccess('Exportación completada exitosamente');
  }
  
  /**
   * Exporta movimientos a PDF con formato profesional
   */
  exportarPDF(): void {
    if (!this.movimientosFiltrados.length) {
      this.showWarning('No hay datos para exportar');
      return;
    }

    // Crear contenido HTML para el PDF
    const fecha = new Date().toLocaleDateString('es-PE');
    const hora = new Date().toLocaleTimeString('es-PE');
    
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @page { margin: 20mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            font-size: 10pt;
            color: #333;
            line-height: 1.4;
          }
          .header { 
            text-align: center; 
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 3px solid #2563eb;
          }
          .header h1 { 
            color: #1e40af; 
            font-size: 22pt; 
            margin-bottom: 8px;
            font-weight: 700;
          }
          .header .subtitle { 
            color: #64748b; 
            font-size: 11pt;
            margin-bottom: 5px;
          }
          .info-section {
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
            padding: 12px 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #3b82f6;
          }
          .info-section .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
          .info-item {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .info-label { 
            font-weight: 600; 
            color: #1e40af;
            font-size: 9pt;
          }
          .info-value { 
            color: #475569;
            font-size: 9pt;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 15px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          thead {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
          }
          thead th { 
            padding: 10px 8px; 
            text-align: left; 
            font-weight: 600;
            font-size: 9pt;
            border-right: 1px solid rgba(255,255,255,0.2);
          }
          thead th:last-child {
            border-right: none;
          }
          tbody tr { 
            border-bottom: 1px solid #e5e7eb;
            transition: background 0.2s;
          }
          tbody tr:nth-child(even) { 
            background-color: #f9fafb; 
          }
          tbody tr:hover { 
            background-color: #eff6ff; 
          }
          tbody td { 
            padding: 8px; 
            font-size: 9pt;
            color: #374151;
          }
          .tipo-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 8pt;
            font-weight: 600;
            text-transform: uppercase;
          }
          .tipo-entrada { background: #dcfce7; color: #166534; }
          .tipo-salida { background: #fee2e2; color: #991b1b; }
          .tipo-ajuste { background: #fef3c7; color: #92400e; }
          .tipo-traslado { background: #e0e7ff; color: #3730a3; }
          .estado-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 8pt;
            font-weight: 600;
          }
          .estado-completado { background: #dcfce7; color: #166534; }
          .estado-pendiente { background: #fef3c7; color: #92400e; }
          .estado-revertido { background: #f3f4f6; color: #374151; }
          .estado-anulado { background: #fee2e2; color: #991b1b; }
          .cantidad {
            font-weight: 700;
            color: #059669;
            text-align: center;
          }
          .footer {
            margin-top: 25px;
            padding-top: 15px;
            border-top: 2px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 9pt;
            color: #64748b;
          }
          .totales {
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            padding: 12px 15px;
            border-radius: 8px;
            margin-top: 15px;
            border-left: 4px solid #059669;
          }
          .totales-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
          }
          .total-item {
            text-align: center;
          }
          .total-label {
            font-size: 9pt;
            color: #475569;
            margin-bottom: 4px;
          }
          .total-value {
            font-size: 16pt;
            font-weight: 700;
            color: #059669;
          }
          @media print {
            .no-print { display: none; }
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Reporte de Movimientos de Inventario</h1>
          <div class="subtitle">Sistema de Gestión de Inventario</div>
          <div class="subtitle">${fecha} - ${hora}</div>
        </div>

        <div class="info-section">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">📦 Inventario:</span>
              <span class="info-value">${this.inventarioSeleccionadoFiltro?.serie || 'Todos'} ${this.inventarioSeleccionadoFiltro?.producto?.nombre ? '- ' + this.inventarioSeleccionadoFiltro.producto.nombre : ''}</span>
            </div>
            <div class="info-item">
              <span class="info-label">📋 Total de registros:</span>
              <span class="info-value">${this.movimientosFiltrados.length}</span>
            </div>
            <div class="info-item">
              <span class="info-label">📅 Fecha desde:</span>
              <span class="info-value">${this.fechaDesde ? new Date(this.fechaDesde).toLocaleDateString('es-PE') : 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">📅 Fecha hasta:</span>
              <span class="info-value">${this.fechaHasta ? new Date(this.fechaHasta).toLocaleDateString('es-PE') : 'N/A'}</span>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 9%">Fecha</th>
              <th style="width: 8%">Tipo</th>
              <th style="width: 20%">Producto</th>
              <th style="width: 10%">Color</th>
              <th style="width: 6%">Talla</th>
              <th style="width: 7%">Cantidad</th>
              <th style="width: 22%">Descripción</th>
              <th style="width: 10%">Referencia</th>
              <th style="width: 8%">Estado</th>
            </tr>
          </thead>
          <tbody>
    `;

    // Agregar filas de datos
    this.movimientosFiltrados.forEach(m => {
      const tipoClass = `tipo-${m.tipo.toLowerCase()}`;
      const estadoClass = `estado-${this.getEstadoMovimiento(m).toLowerCase()}`;
      
      htmlContent += `
            <tr>
              <td>${new Date(m.fechaMovimiento || '').toLocaleDateString('es-PE')}</td>
              <td><span class="tipo-badge ${tipoClass}">${m.tipo}</span></td>
              <td><strong>${m.producto?.nombre || 'N/A'}</strong></td>
              <td>${m.color?.nombre || 'N/A'}</td>
              <td style="text-align: center;">${m.talla?.numero || 'N/A'}</td>
              <td class="cantidad">${m.cantidad}</td>
              <td style="font-size: 8pt;">${m.descripcion.substring(0, 60)}${m.descripcion.length > 60 ? '...' : ''}</td>
              <td style="font-size: 8pt;">${m.referencia}</td>
              <td><span class="estado-badge ${estadoClass}">${this.getEstadoMovimiento(m)}</span></td>
            </tr>
      `;
    });

    // Calcular totales
    const totalCantidad = this.movimientosFiltrados.reduce((sum, m) => sum + (m.cantidad || 0), 0);
    const totalEntradas = this.movimientosFiltrados.filter(m => m.tipo === 'ENTRADA').reduce((sum, m) => sum + (m.cantidad || 0), 0);
    const totalSalidas = this.movimientosFiltrados.filter(m => m.tipo === 'SALIDA').reduce((sum, m) => sum + (m.cantidad || 0), 0);

    htmlContent += `
          </tbody>
        </table>

        <div class="totales">
          <div class="totales-grid">
            <div class="total-item">
              <div class="total-label">📥 Total Entradas</div>
              <div class="total-value" style="color: #059669;">${totalEntradas}</div>
            </div>
            <div class="total-item">
              <div class="total-label">📤 Total Salidas</div>
              <div class="total-value" style="color: #dc2626;">${totalSalidas}</div>
            </div>
            <div class="total-item">
              <div class="total-label">📊 Total Movimientos</div>
              <div class="total-value" style="color: #2563eb;">${totalCantidad}</div>
            </div>
          </div>
        </div>

        <div class="footer">
          <div>
            <strong>Usuario:</strong> ${this.getCurrentUsername()}
          </div>
          <div>
            <strong>Sistema de Gestión de Inventario</strong>
          </div>
          <div>
            Página 1 de 1
          </div>
        </div>
      </body>
      </html>
    `;

    // Crear una ventana para imprimir
    const ventanaImpresion = window.open('', '_blank', 'width=800,height=600');
    if (ventanaImpresion) {
      ventanaImpresion.document.write(htmlContent);
      ventanaImpresion.document.close();
      
      // Esperar a que se cargue el contenido y abrir el diálogo de impresión
      ventanaImpresion.onload = () => {
        ventanaImpresion.print();
      };
      
      this.showSuccess('PDF generado. Use la opción "Guardar como PDF" en el diálogo de impresión');
    } else {
      this.showError('No se pudo abrir la ventana de impresión. Verifique que los pop-ups no estén bloqueados.');
    }
  }
  
  // ==================== NUEVOS MÉTODOS: VISTA DE DETALLES ====================
  
  /**
   * Abre el sidebar con detalles del movimiento
   */
  verDetallesMovimiento(movimiento: MovimientoResponse): void {
    this.movimientoDetalle = movimiento;
    this.detallesSidebarVisible = true;
  }
  
  /**
   * Cierra el sidebar de detalles
   */
  cerrarDetalles(): void {
    this.detallesSidebarVisible = false;
    this.movimientoDetalle = null;
  }
  
  /**
   * Obtiene el estado del movimiento
   */
  getEstadoMovimiento(movimiento: MovimientoResponse): string {
    // Lógica para determinar el estado (esto dependerá de tu modelo de datos)
    // Por ahora retornamos COMPLETADO por defecto
    return 'COMPLETADO';
  }
  
  /**
   * Obtiene la severidad del estado
   */
  getEstadoSeverity(estado: string): 'success' | 'warning' | 'danger' | 'secondary' {
    const estadoObj = this.estadosMovimiento.find(e => e.value === estado);
    return (estadoObj?.severity as any) || 'secondary';
  }
  
  // ==================== NUEVOS MÉTODOS: DUPLICAR Y REVERTIR ====================
  
  /**
   * Duplica un movimiento
   */
  duplicarMovimiento(movimiento: MovimientoResponse): void {
    if (!this.permissionService.canCreate('movimientosInventario')) {
      this.showError('No tienes permiso para crear movimientos');
      return;
    }
    
    this.confirmationService.confirm({
      message: '¿Deseas duplicar este movimiento?',
      header: 'Confirmar Duplicación',
      icon: 'pi pi-copy',
      accept: () => {
        this.editMode = false;
        this.movimiento = {
          ...this.createEmptyMovimiento(),
          tipo: movimiento.tipo,
          inventarioId: movimiento.inventarioId,
          inventarioDestinoId: movimiento.inventarioDestinoId,
          cantidad: movimiento.cantidad,
          descripcion: `[DUPLICADO] ${movimiento.descripcion}`,
          referencia: `DUP-${movimiento.referencia}`
        };
        
        this.inventarioSeleccionado = this.inventarios.find(inv => inv.id === movimiento.inventarioId) || null;
        this.inventarioDestinoSeleccionado = movimiento.inventarioDestinoId 
          ? this.inventarios.find(inv => inv.id === movimiento.inventarioDestinoId) || null
          : null;
        
        this.movimientoDialog = true;
        this.showInfo('Datos del movimiento copiados. Revisa y confirma.');
      }
    });
  }
  
  /**
   * Revierte un movimiento creando uno inverso
   */
  revertirMovimiento(movimiento: MovimientoResponse): void {
    if (!this.permissionService.canCreate('movimientosInventario')) {
      this.showError('No tienes permiso para crear movimientos');
      return;
    }
    
    this.confirmationService.confirm({
      message: `¿Deseas revertir este movimiento de tipo ${movimiento.tipo}? Se creará un movimiento inverso automáticamente.`,
      header: 'Confirmar Reversión',
      icon: 'pi pi-replay',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () => {
        // Determinar el tipo inverso
        let tipoInverso: TipoMovimiento;
        switch (movimiento.tipo) {
          case TipoMovimiento.ENTRADA:
            tipoInverso = TipoMovimiento.SALIDA;
            break;
          case TipoMovimiento.SALIDA:
            tipoInverso = TipoMovimiento.ENTRADA;
            break;
          case TipoMovimiento.TRASLADO:
            // En traslado, invertimos origen y destino
            tipoInverso = TipoMovimiento.TRASLADO;
            break;
          default:
            tipoInverso = TipoMovimiento.AJUSTE;
        }
        
        this.editMode = false;
        this.movimiento = {
          ...this.createEmptyMovimiento(),
          tipo: tipoInverso,
          inventarioId: movimiento.tipo === TipoMovimiento.TRASLADO ? movimiento.inventarioDestinoId! : movimiento.inventarioId,
          inventarioDestinoId: movimiento.tipo === TipoMovimiento.TRASLADO ? movimiento.inventarioId : undefined,
          cantidad: movimiento.cantidad,
          descripcion: `[REVERSIÓN] ${movimiento.descripcion}`,
          referencia: `REV-${movimiento.referencia}`
        };
        
        this.inventarioSeleccionado = this.inventarios.find(inv => 
          inv.id === (movimiento.tipo === TipoMovimiento.TRASLADO ? movimiento.inventarioDestinoId : movimiento.inventarioId)
        ) || null;
        
        this.inventarioDestinoSeleccionado = movimiento.tipo === TipoMovimiento.TRASLADO 
          ? this.inventarios.find(inv => inv.id === movimiento.inventarioId) || null
          : null;
        
        this.movimientoDialog = true;
        this.showWarning(`Movimiento inverso creado (${tipoInverso}). Revisa y confirma.`);
      }
    });
  }
  
  // ==================== NUEVOS MÉTODOS: GRÁFICOS ====================
  
  /**
   * Muestra el diálogo de gráficos
   */
  mostrarGraficos(): void {
    this.generarDatosGrafico();
    this.graficosDialogVisible = true;
  }
  
  /**
   * Genera datos para el gráfico de evolución
   */
  generarDatosGrafico(): void {
    if (!this.movimientosFiltrados.length) return;
    
    // Agrupar movimientos por fecha y tipo
    const movimientosPorFecha = new Map<string, { entrada: number, salida: number, ajuste: number, traslado: number }>();
    
    this.movimientosFiltrados.forEach(m => {
      const fecha = new Date(m.fechaMovimiento || '').toLocaleDateString('es-PE');
      if (!movimientosPorFecha.has(fecha)) {
        movimientosPorFecha.set(fecha, { entrada: 0, salida: 0, ajuste: 0, traslado: 0 });
      }
      
      const datos = movimientosPorFecha.get(fecha)!;
      switch (m.tipo) {
        case TipoMovimiento.ENTRADA:
          datos.entrada += m.cantidad || 0;
          break;
        case TipoMovimiento.SALIDA:
          datos.salida += m.cantidad || 0;
          break;
        case TipoMovimiento.AJUSTE:
          datos.ajuste += m.cantidad || 0;
          break;
        case TipoMovimiento.TRASLADO:
          datos.traslado += m.cantidad || 0;
          break;
      }
    });
    
    // Ordenar fechas
    const fechasOrdenadas = Array.from(movimientosPorFecha.keys()).sort((a, b) => 
      new Date(a.split('/').reverse().join('-')).getTime() - new Date(b.split('/').reverse().join('-')).getTime()
    );
    
    this.chartData = {
      labels: fechasOrdenadas,
      datasets: [
        {
          label: 'Entradas',
          data: fechasOrdenadas.map(f => movimientosPorFecha.get(f)!.entrada),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Salidas',
          data: fechasOrdenadas.map(f => movimientosPorFecha.get(f)!.salida),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.2)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Ajustes',
          data: fechasOrdenadas.map(f => movimientosPorFecha.get(f)!.ajuste),
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.2)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Traslados',
          data: fechasOrdenadas.map(f => movimientosPorFecha.get(f)!.traslado),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          tension: 0.4,
          fill: true
        }
      ]
    };
    
    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 15
          }
        },
        title: {
          display: true,
          text: 'Evolución de Movimientos de Inventario',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Cantidad'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Fecha'
          }
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    };
  }
  
  // ==================== NUEVOS MÉTODOS: ALERTAS DE STOCK ====================
  
  /**
   * Verifica y muestra alertas de stock crítico
   */
  verificarStockCritico(movimiento: MovimientoResponse): void {
    if (!this.inventarioSeleccionado) return;
    
    const stockActual = this.inventarioSeleccionado.cantidad || 0;
    const stockMinimo = 5; // Puedes ajustar este valor o obtenerlo del inventario
    
    if (movimiento.tipo === TipoMovimiento.SALIDA) {
      const stockRestante = stockActual - (movimiento.cantidad || 0);
      
      if (stockRestante < stockMinimo) {
        this.messageService.add({
          severity: 'warn',
          summary: '⚠️ Stock Crítico',
          detail: `El stock quedará en ${stockRestante} unidades (mínimo: ${stockMinimo}). Se recomienda reabastecer.`,
          life: 8000,
          sticky: false
        });
        
        // Reproducir sonido de alerta (opcional)
        this.reproducirSonidoAlerta();
      }
    }
  }
  
  /**
   * Reproduce un sonido de alerta
   */
  reproducirSonidoAlerta(): void {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzCM0fPTgjMGHm7A7+OZURE=');
      audio.play().catch(() => {
        // Silenciar error si el navegador bloquea el audio
      });
    } catch (error) {
      // Ignorar error de audio
    }
  }
  
  // ==================== NUEVOS MÉTODOS: IMPRESIÓN DE TICKET ====================
  
  /**
   * Imprime el ticket del movimiento
   */
  imprimirTicket(movimiento: MovimientoResponse): void {
    // Crear contenido HTML del ticket
    const ticketHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ticket - Movimiento ${movimiento.id}</title>
        <style>
          @media print {
            @page { size: 80mm auto; margin: 0; }
            body { margin: 10mm; }
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            max-width: 80mm;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
          }
          .title {
            font-size: 16px;
            font-weight: bold;
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
          }
          .label {
            font-weight: bold;
          }
          .separator {
            border-top: 1px dashed #000;
            margin: 10px 0;
          }
          .footer {
            text-align: center;
            margin-top: 10px;
            border-top: 2px dashed #000;
            padding-top: 10px;
            font-size: 10px;
          }
          .qr-code {
            text-align: center;
            margin: 15px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">MOVIMIENTO DE INVENTARIO</div>
          <div>ID: ${movimiento.id}</div>
        </div>
        
        <div class="row">
          <span class="label">Tipo:</span>
          <span>${movimiento.tipo}</span>
        </div>
        <div class="row">
          <span class="label">Fecha:</span>
          <span>${new Date(movimiento.fechaMovimiento || '').toLocaleString('es-PE')}</span>
        </div>
        
        <div class="separator"></div>
        
        <div class="row">
          <span class="label">Producto:</span>
          <span>${movimiento.producto?.nombre || 'N/A'}</span>
        </div>
        <div class="row">
          <span class="label">Color:</span>
          <span>${movimiento.color?.nombre || 'N/A'}</span>
        </div>
        <div class="row">
          <span class="label">Talla:</span>
          <span>${movimiento.talla?.numero || 'N/A'}</span>
        </div>
        <div class="row">
          <span class="label">Serie:</span>
          <span>${movimiento.inventarioId}</span>
        </div>
        
        <div class="separator"></div>
        
        <div class="row">
          <span class="label">Cantidad:</span>
          <span style="font-size: 16px; font-weight: bold;">${movimiento.cantidad}</span>
        </div>
        <div class="row">
          <span class="label">Serie:</span>
          <span>${movimiento.inventarioId}</span>
        </div>
        
        <div class="separator"></div>
        
        <div style="margin: 10px 0;">
          <div class="label">Descripción:</div>
          <div>${movimiento.descripcion}</div>
        </div>
        <div class="row">
          <span class="label">Referencia:</span>
          <span>${movimiento.referencia}</span>
        </div>
        <div class="row">
          <span class="label">Usuario:</span>
          <span>${movimiento.usuario}</span>
        </div>
        
        <div class="qr-code">
          <div style="font-size: 10px; margin-bottom: 5px;">Código QR</div>
          <div style="font-size: 8px;">MOV-${movimiento.id}</div>
        </div>
        
        <div class="footer">
          Sistema de Gestión de Inventario<br>
          ${new Date().toLocaleString('es-PE')}
        </div>
      </body>
      </html>
    `;
    
    // Abrir ventana de impresión
    const ventanaImpresion = window.open('', '_blank', 'width=300,height=600');
    if (ventanaImpresion) {
      ventanaImpresion.document.write(ticketHtml);
      ventanaImpresion.document.close();
      ventanaImpresion.focus();
      setTimeout(() => {
        ventanaImpresion.print();
        ventanaImpresion.close();
      }, 250);
      
      this.showSuccess('Ticket enviado a impresión');
    } else {
      this.showError('No se pudo abrir la ventana de impresión. Verifica los permisos del navegador.');
    }
  }
}
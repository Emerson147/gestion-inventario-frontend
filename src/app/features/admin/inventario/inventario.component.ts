import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';

import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { Inventario, EstadoInventario, InventarioRequest } from '../../../core/models/inventario.model';
import { Producto } from '../../../core/models/product.model';
import { Color, Talla } from '../../../core/models/colors.model';
import { Almacen } from '../../../core/models/almacen.model';
import { InventarioService } from '../../../core/services/inventario.service';
import { ProductoService } from '../../../core/services/producto.service';
import { ColorService } from '../../../core/services/colores.service';
import { AlmacenService } from '../../../core/services/almacen.service';
import { PermissionService, PermissionType } from '../../../core/services/permission.service';
import { finalize, forkJoin, catchError, of, firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    ConfirmDialogModule,
    DialogModule,
    IconFieldModule,
    InputIconModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    TableModule,
    TagModule,
    ToastModule,
    ToolbarModule,
    HasPermissionDirective
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './inventario.component.html'
})
export class InventarioComponent implements OnInit {

  // ========== DATOS Y ESTADO ==========
  inventarios: Inventario[] = [];
  inventariosFiltrados: Inventario[] = [];
  selectedInventarios: Inventario[] = [];
  productos: Producto[] = [];
  colores: Color[] = [];
  tallas: Talla[] = [];
  almacenes: Almacen[] = [];

  // ========== FILTROS ==========
  productoSeleccionadoFiltro: Producto | null = null;

  // ========== FORMULARIO ==========
  inventario: Inventario = this.initInventario();
  productoSeleccionado: Producto | null = null;
  colorSeleccionado: Color | null = null;
  tallaSeleccionada: Talla | null = null;
  almacenSeleccionado: Almacen | null = null;

  // ========== ESTADO UI ==========
  inventarioDialog = false;
  editMode = false;
  loading = false;
  submitted = false;

  // ========== PERMISOS ==========
  permissionTypes = PermissionType;

  // ========== CONFIGURACIÓN ==========
  estadosInventario: { label: string, value: EstadoInventario }[] = [
    { label: 'Disponible', value: EstadoInventario.DISPONIBLE },
    { label: 'Agotado', value: EstadoInventario.AGOTADO },
    { label: 'Bajo Stock', value: EstadoInventario.BAJO_STOCK },
    { label: 'Reservado', value: EstadoInventario.RESERVADO }
  ];

  constructor(
    private readonly inventarioService: InventarioService,
    private readonly productoService: ProductoService,
    private readonly colorService: ColorService,
    private readonly almacenService: AlmacenService,
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService,
    private readonly permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.loadProductos();
    this.loadAlmacenes();
  }

  // ========== MÉTODOS DE CARGA ==========

  loadProductos(): void {
    this.productoService.getProducts(0, 1000).subscribe({
      next: (response) => this.productos = response.contenido || [],
      error: (error) => this.handleError(error, 'No se pudo cargar los productos')
    });
  }

  loadAlmacenes(): void {
    this.almacenService.getAlmacenes().subscribe({
      next: (response) => this.almacenes = response || [],
      error: (error) => this.handleError(error, 'No se pudieron cargar los almacenes')
    });
  }

  loadColoresPorProducto(productoId: number, colorId?: number, tallaId?: number): void {
    this.colores = [];
    this.tallas = [];
    
    this.colorService.getColoresPorProducto(productoId).subscribe({
      next: (coloresRes) => {
        this.colores = coloresRes || [];
        
        if (colorId) {
          const foundColor = this.colores.find(c => c.id === colorId);
          if (foundColor) {
            this.colorSeleccionado = foundColor;
            this.tallas = foundColor.tallas || [];
            
            if (tallaId) {
              this.tallaSeleccionada = this.tallas.find(t => t.id === tallaId) || null;
            }
          }
        }
      },
      error: (error) => this.handleError(error, 'No se pudieron cargar los colores')
    });
  }

  loadTallasPorColor(colorId: number): void {
    const colorSeleccionado = this.colores.find(c => c.id === colorId);
    this.tallas = colorSeleccionado?.tallas || [];
    this.tallaSeleccionada = null;
  }

  // ========== FILTROS ==========

  filtrarInventarioPorProducto(): void {
    this.selectedInventarios = [];
    
    if (this.productoSeleccionadoFiltro) {
      this.loading = true;
      
      this.inventarioService.obtenerInventarioPorProducto(this.productoSeleccionadoFiltro.id!).subscribe({
        next: (inventarios) => {
          this.inventariosFiltrados = Array.isArray(inventarios) ? inventarios : [inventarios];
          this.loading = false;
        },
        error: (error) => {
          this.handleError(error, 'No se pudo cargar el inventario de este producto');
          this.inventariosFiltrados = [];
          this.loading = false;
        }
      });
    } else {
      this.inventariosFiltrados = [];
    }
  }

  limpiarFiltros(): void {
    this.productoSeleccionadoFiltro = null;
    this.inventariosFiltrados = [];
    this.selectedInventarios = [];
  }

  // ========== CRUD ==========

  openNew(): void {
    if (!this.permissionService.canCreate('inventario')) {
      this.showError('No tiene permisos para crear inventarios');
      return;
    }

    this.editMode = false;
    this.inventario = this.initInventario();
    this.productoSeleccionado = this.productoSeleccionadoFiltro;
    this.resetSelections();
    
    if (this.productoSeleccionadoFiltro) {
      this.loadColoresPorProducto(this.productoSeleccionadoFiltro.id!);
    }
    
    this.submitted = false;
    this.inventarioDialog = true;
  }

  editInventario(inventario: Inventario): void {
    if (!this.permissionService.canEdit('inventario')) {
      this.showError('No tiene permisos para editar inventarios');
      return;
    }

    this.editMode = true;
    this.inventario = { ...inventario };
    this.productoSeleccionado = inventario.producto;
    this.almacenSeleccionado = inventario.almacen;
    
    const originalColorId = inventario.color?.id;
    const originalTallaId = inventario.talla?.id;
    
    this.resetSelections();
    
    if (this.productoSeleccionado?.id) {
      this.loadColoresPorProducto(this.productoSeleccionado.id, originalColorId, originalTallaId);
    }
    
    this.submitted = false;
    this.inventarioDialog = true;
  }

  guardarInventario(): void {
    this.submitted = true;
    
    if (!this.isValidInventario()) {
      return;
    }
    
    const inventarioRequest: InventarioRequest = {
      productoId: this.productoSeleccionado!.id!,
      colorId: this.colorSeleccionado!.id!,
      tallaId: this.tallaSeleccionada!.id!,
      almacenId: this.almacenSeleccionado!.id!,
      cantidad: this.inventario.cantidad,
      estado: this.inventario.estado || EstadoInventario.DISPONIBLE,
    };
    
    this.loading = true;

    if (this.editMode && this.inventario.id) {
      this.inventarioService.actualizarInventario(this.inventario.id, inventarioRequest)
        .pipe(finalize(() => this.loading = false))
        .subscribe({
          next: () => {
            this.showSuccess('Inventario actualizado correctamente');
            this.hideDialog();
            this.filtrarInventarioPorProducto();
          },
          error: (error) => this.handleError(error, 'No se pudo actualizar el inventario')
        });
    } else {
      this.inventarioService.crearInventario(inventarioRequest)
        .pipe(finalize(() => this.loading = false))
        .subscribe({
          next: () => {
            this.showSuccess('Inventario creado correctamente');
            this.hideDialog();
            this.filtrarInventarioPorProducto();
          },
          error: (error) => this.handleError(error, 'No se pudo crear el inventario')
        });
    }
  }

  eliminarInventario(inventario: Inventario): void {
    if (!this.permissionService.canDelete('inventario')) {
      this.showError('No tiene permisos para eliminar inventarios');
      return;
    }

    if (!inventario.id) return;
    
    this.confirmationService.confirm({
      message: `¿Está seguro que desea eliminar el inventario de ${inventario.producto?.nombre} - ${inventario.color?.nombre} - Talla ${inventario.talla?.numero}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.loading = true;
        this.inventarioService.eliminarInventario(inventario.id!)
          .pipe(finalize(() => this.loading = false))
          .subscribe({
            next: () => {
              this.showSuccess('Inventario eliminado correctamente');
              this.filtrarInventarioPorProducto();
              this.selectedInventarios = [];
            },
            error: (error) => this.handleError(error, 'No se pudo eliminar el inventario')
          });
      }
    });
  }

  deleteSelectedInventarios(): void {
    if (!this.permissionService.canDelete('inventario')) {
      this.showError('No tiene permisos para eliminar inventarios');
      return;
    }

    if (!this.selectedInventarios.length) return;
    
    this.confirmationService.confirm({
      message: `¿Está seguro que desea eliminar los ${this.selectedInventarios.length} registros seleccionados?`,
      header: 'Confirmar eliminación múltiple',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.processMultipleDelete()
    });
  }

  // ========== VALIDACIONES ==========

  private isValidInventario(): boolean {
    if (!this.productoSeleccionado) {
      this.showError('Debe seleccionar un producto');
      return false;
    }

    if (!this.colorSeleccionado) {
      this.showError('Debe seleccionar un color');
      return false;
    }

    if (!this.tallaSeleccionada) {
      this.showError('Debe seleccionar una talla');
      return false;
    }

    if (!this.almacenSeleccionado) {
      this.showError('Debe seleccionar un almacén');
      return false;
    }

    if (this.inventario.cantidad < 0) {
      this.showError('La cantidad debe ser mayor o igual a 0');
      return false;
    }

    return true;
  }

  private async processMultipleDelete(): Promise<void> {
    this.loading = true;
    
    try {
      const deleteOperations = this.selectedInventarios
        .filter(inventario => inventario.id)
        .map(inventario => 
          this.inventarioService.eliminarInventario(inventario.id!)
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
      this.filtrarInventarioPorProducto();
      this.selectedInventarios = [];
    } catch (error) {
      this.handleError(error, 'No se pudieron eliminar algunos inventarios');
    } finally {
      this.loading = false;
    }
  }

  private showDeleteResults(successful: number, failed: number): void {
    if (successful > 0) {
      this.showSuccess(`${successful} inventarios eliminados correctamente`);
    }
    
    if (failed > 0) {
      this.showWarning(`${failed} inventarios no pudieron ser eliminados`);
    }
  }

  // ========== UTILIDADES ==========

  hideDialog(): void {
    this.inventarioDialog = false;
    this.submitted = false;
    this.inventario = this.initInventario();
    this.resetSelections();
  }

  private resetSelections(): void {
    this.colorSeleccionado = null;
    this.tallaSeleccionada = null;
    this.almacenSeleccionado = null;
    this.colores = [];
    this.tallas = [];
  }

  onGlobalFilter(dt: any, event: Event): void {
    const element = event.target as HTMLInputElement;
    dt.filterGlobal(element.value, 'contains');
  }

  getEstadoSeverity(estado: EstadoInventario): 'success' | 'danger' | 'warning' | 'info' | 'secondary' {
    const severityMap = {
      [EstadoInventario.DISPONIBLE]: 'success' as const,
      [EstadoInventario.AGOTADO]: 'danger' as const,
      [EstadoInventario.BAJO_STOCK]: 'warning' as const,
      [EstadoInventario.RESERVADO]: 'info' as const
    };
    
    return severityMap[estado] || 'secondary';
  }

  // ========== EXPORTACIÓN ==========

  exportarExcel(): void {
    if (!this.inventariosFiltrados?.length) {
      this.showWarning('No hay datos para exportar');
      return;
    }

    import('xlsx').then(xlsx => {
      const dataToExport = this.inventariosFiltrados.map(inventario => ({
        'Serie': inventario.serie || '',
        'Producto': inventario.producto?.nombre || '',
        'Código': inventario.producto?.codigo || '',
        'Color': inventario.color?.nombre || '',
        'Talla': inventario.talla?.numero || '',
        'Almacén': inventario.almacen?.nombre || '',
        'Cantidad': inventario.cantidad,
        'Estado': inventario.estado,
        'Última Actualización': new Date(inventario.fechaActualizacion).toLocaleString()
      }));
      
      const worksheet = xlsx.utils.json_to_sheet(dataToExport);
      const workbook = { Sheets: { 'Inventario': worksheet }, SheetNames: ['Inventario'] };
      const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
      this.guardarArchivo(excelBuffer, 'inventario');
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

  private initInventario(): Inventario {
    return {
      id: undefined,
      serie: '',
      producto: null,
      color: null,
      talla: null,
      almacen: null,
      cantidad: 0,
      estado: EstadoInventario.DISPONIBLE, // Cambié el default a DISPONIBLE
      fechaActualizacion: new Date().toISOString(),
      fechaCreacion: new Date().toISOString()
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
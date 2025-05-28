import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { FileUploadModule } from 'primeng/fileupload';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { SelectModule } from 'primeng/select';
import { PanelModule } from 'primeng/panel';
import { SplitButtonModule } from 'primeng/splitbutton'; // 👈 Nuevo import
import { TooltipModule } from 'primeng/tooltip'; // 👈 Nuevo import

import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { Producto } from '../../../core/models/product.model';
import { ProductoService } from '../../../core/services/producto.service';
import { PermissionService, PermissionType } from '../../../core/services/permission.service';
import { environment } from '../../../../enviroments/enviroment';
import { finalize, forkJoin, catchError, of, firstValueFrom, switchMap, tap } from 'rxjs';

interface ViewOption {
  label: string;
  value: 'table' | 'cards';
  icon: string;
}

// 👇 Nueva interfaz para acciones masivas
interface AccionMasiva {
  label: string;
  icon: string;
  command: () => void;
}

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    CheckboxModule,
    ConfirmDialogModule,
    DialogModule,
    FileUploadModule,
    IconFieldModule,
    InputIconModule,
    InputNumberModule,
    InputTextModule,
    InputGroupModule,
    InputGroupAddonModule,
    SelectModule,
    SelectButtonModule,
    PanelModule,
    SplitButtonModule, // 👈 Nuevo
    TableModule,
    TagModule,
    TextareaModule,
    ToastModule,
    TooltipModule, // 👈 Nuevo
    ToolbarModule,
    HasPermissionDirective
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './productos.component.html',
  styles: [`
    :host ::ng-deep .product-dialog-header .p-dialog-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      color: white !important;
      border: none !important;
      padding: 1.5rem 1.5rem 0.5rem 1.5rem;
    }

    /* 👇 Nuevos estilos para el diseño moderno */
    :host ::ng-deep {
      /* Cards más elegantes */
      .p-card {
        border-radius: 16px !important;
        transition: all 0.3s ease !important;
      }
      
      /* Botones con sombras */
      .p-button {
        transition: all 0.3s ease !important;
      }
      
      .p-button:hover {
        transform: translateY(-1px);
      }
      
      /* Input fields más modernos */
      .p-inputtext,
      .p-dropdown,
      .p-select {
        border-radius: 8px !important;
        border: 1px solid #e5e7eb !important;
        transition: all 0.3s ease !important;
      }
      
      .p-inputtext:focus,
      .p-dropdown:focus,
      .p-select:focus {
        border-color: #6366f1 !important;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1) !important;
      }

      /* Panel de filtros */
      .p-panel .p-panel-header {
        background: transparent !important;
        border: none !important;
        padding: 1rem !important;
      }

      .p-panel .p-panel-content {
        border: none !important;
        background: transparent !important;
      }
    }

    /* 👇 Utilidades CSS personalizadas */
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .line-clamp-3 {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .card-hover {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .card-hover:hover {
      transform: translateY(-4px);
    }
  `]
})
export class ProductosComponent implements OnInit {

  // ========== DATOS Y ESTADO ==========
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  selectedProductos: Producto[] = [];
  producto: Producto = this.initProducto();

  // ========== FILTROS ==========
  filtroTexto = '';
  filtroMarca = '';
  filtroPrecioMin: number | null = null;
  filtroPrecioMax: number | null = null;
  marcasDisponibles: string[] = [];

  // ========== FORMULARIO ==========
  generarCodigoAuto = true;
  imagenParaSubir: File | null = null;
  previewImageUrl: string | null = null;

  // ========== ESTADO UI ==========
  productoDialog = false;
  editMode = false;
  loading = false;
  submitted = false;
  currentView: 'table' | 'cards' = 'table';

  // 👇 Nuevas propiedades para el diseño moderno
  filtrosPanelCollapsed = true;
  estadisticasDialog = false;
  detalleProductoDialog = false;
  productoDetalle: Producto | null = null;

  // ========== CONFIGURACIÓN ==========
  viewOptions: ViewOption[] = [
    { label: 'Tabla', value: 'table', icon: 'pi pi-list' },
    { label: 'Tarjetas', value: 'cards', icon: 'pi pi-th-large' }
  ];

  // 👇 Nuevas acciones masivas
  accionesMasivas: AccionMasiva[] = [
    {
      label: 'Exportar Seleccionados',
      icon: 'pi pi-download',
      command: () => this.exportarSeleccionados()
    },
    {
      label: 'Cambiar Precios en Lote',
      icon: 'pi pi-dollar',
      command: () => this.cambiarPreciosLote()
    },
    {
      label: 'Duplicar Productos',
      icon: 'pi pi-copy',
      command: () => this.duplicarProductos()
    },
    {
      label: 'Actualizar Códigos',
      icon: 'pi pi-refresh',
      command: () => this.actualizarCodigosLote()
    }
  ];

  // ========== PERMISOS ==========
  permissionTypes = PermissionType;

  constructor(
    private readonly productoService: ProductoService,
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService,
    private readonly permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.loadProductos();
  }

  // ========== MÉTODOS DE CARGA ==========

  loadProductos(): void {
    this.loading = true;
    
    this.productoService.getProducts(0, 1000).subscribe({
      next: (response) => {
        this.productos = response.contenido || [];
        this.productosFiltrados = [...this.productos];
        this.extractMarcas();
      },
      error: (error) => {
        this.handleError(error, 'No se pudo cargar los productos');
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  private extractMarcas(): void {
    const marcasSet = new Set(this.productos.map(p => p.marca).filter(Boolean));
    this.marcasDisponibles = Array.from(marcasSet).sort();
  }

  // ========== NUEVOS MÉTODOS PARA EL DISEÑO MODERNO ==========

  /**
   * 👇 Calcula el valor total del inventario
   */
  calcularValorTotal(): number {
    return this.productos?.reduce((total, producto) => {
      return total + (producto.precioVenta || 0);
    }, 0) || 0;
  }

  /**
   * 👇 Cuenta cuántos filtros están activos
   */
  getTotalFiltrosActivos(): number {
    let count = 0;
    if (this.filtroTexto?.trim()) count++;
    if (this.filtroMarca) count++;
    if (this.filtroPrecioMin && this.filtroPrecioMin > 0) count++;
    if (this.filtroPrecioMax && this.filtroPrecioMax > 0) count++;
    return count;
  }

  /**
   * 👇 Tracking para mejor performance en ngFor
   */
  trackByProducto(index: number, producto: any): any {
    return producto.id || index;
  }

  /**
   * 👇 Maneja el toggle del panel de filtros
   */
  onFiltrosPanelToggle(event: any): void {
    this.filtrosPanelCollapsed = event.collapsed;
  }

  /**
   * 👇 Muestra detalles del producto en modal
   */
  verDetallesProducto(producto: Producto): void {
    this.productoDetalle = { ...producto };
    this.detalleProductoDialog = true;
  }

  /**
   * 👇 Muestra estadísticas del inventario
   */
  mostrarEstadisticas(): void {
    this.estadisticasDialog = true;
  }

  /**
   * 👇 Obtiene estadísticas del inventario
   */
  getEstadisticas() {
    const productos = this.productos || [];
    const total = productos.length;
    const valorTotal = this.calcularValorTotal();
    const promedioMargen = productos.length > 0 
      ? productos.reduce((sum, p) => sum + this.calcularMargenGanancia(p), 0) / productos.length 
      : 0;
    
    const marcas = new Set(productos.map(p => p.marca)).size;
    const productosMayorMargen = productos.filter(p => this.calcularMargenGanancia(p) >= 50).length;
    const productosMargenBajo = productos.filter(p => this.calcularMargenGanancia(p) < 20).length;

    return {
      total,
      valorTotal,
      promedioMargen,
      marcas,
      productosMayorMargen,
      productosMargenBajo,
      productoMasCaro: productos.reduce((max, p) => (p.precioVenta || 0) > (max.precioVenta || 0) ? p : max, productos[0]),
      productoMasBarato: productos.reduce((min, p) => (p.precioVenta || 0) < (min.precioVenta || 0) ? p : min, productos[0])
    };
  }

  // ========== NUEVAS ACCIONES MASIVAS ==========

  /**
   * 👇 Exporta solo los productos seleccionados
   */
  async exportarSeleccionados(): Promise<void> {
    if (!this.selectedProductos?.length) {
      this.showWarning('No hay productos seleccionados para exportar');
      return;
    }

    try {
      const xlsx = await import('xlsx');
      
      const dataToExport = this.selectedProductos.map(producto => ({
        'ID': producto.id || '',
        'Código': producto.codigo || '',
        'Nombre': producto.nombre || '',
        'Marca': producto.marca || '',
        'Modelo': producto.modelo || '',
        'Descripción': producto.descripcion || '',
        'Precio Compra': producto.precioCompra || 0,
        'Precio Venta': producto.precioVenta || 0,
        'Margen %': this.calcularMargenGanancia(producto).toFixed(2),
        'Ganancia Unitaria': ((producto.precioVenta || 0) - (producto.precioCompra || 0)).toFixed(2),
        'Fecha Creación': producto.fechaCreacion ? new Date(producto.fechaCreacion).toLocaleString() : 'N/A'
      }));
      
      const worksheet = xlsx.utils.json_to_sheet(dataToExport);
      const workbook = { Sheets: { 'Productos_Seleccionados': worksheet }, SheetNames: ['Productos_Seleccionados'] };
      const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
      this.guardarArchivo(excelBuffer, 'productos_seleccionados');
      
      this.showSuccess(`${this.selectedProductos.length} productos seleccionados exportados correctamente`);
    } catch (error) {
      this.handleError(error, 'Error al exportar productos seleccionados');
    }
  }

  /**
   * 👇 Permite cambiar precios en lote
   */
  cambiarPreciosLote(): void {
    if (!this.selectedProductos?.length) {
      this.showWarning('No hay productos seleccionados');
      return;
    }

    // Aquí podrías abrir un modal para cambio masivo de precios
    this.showInfo(`Funcionalidad de cambio de precios en lote para ${this.selectedProductos.length} productos (próximamente)`);
  }

  /**
   * 👇 Duplica productos seleccionados
   */
  duplicarProductos(): void {
    if (!this.selectedProductos?.length) {
      this.showWarning('No hay productos seleccionados');
      return;
    }

    this.confirmationService.confirm({
      message: `¿Desea duplicar los ${this.selectedProductos.length} productos seleccionados?`,
      header: 'Confirmar duplicación',
      icon: 'pi pi-copy',
      accept: () => {
        // Aquí implementarías la lógica de duplicación
        this.showInfo(`Duplicando ${this.selectedProductos.length} productos (funcionalidad próximamente)`);
      }
    });
  }

  /**
   * 👇 Actualiza códigos en lote
   */
  actualizarCodigosLote(): void {
    if (!this.selectedProductos?.length) {
      this.showWarning('No hay productos seleccionados');
      return;
    }

    this.showInfo(`Actualización de códigos para ${this.selectedProductos.length} productos (próximamente)`);
  }

  // ========== FILTROS (Manteniendo funcionalidad original) ==========

  aplicarFiltros(): void {
    let productos = [...this.productos];

    // Filtro por texto (nombre, código, marca, modelo)
    if (this.filtroTexto) {
      const texto = this.filtroTexto.toLowerCase();
      productos = productos.filter(p => 
        p.nombre?.toLowerCase().includes(texto) ||
        p.codigo?.toLowerCase().includes(texto) ||
        p.marca?.toLowerCase().includes(texto) ||
        p.modelo?.toLowerCase().includes(texto)
      );
    }

    // Filtro por marca
    if (this.filtroMarca) {
      productos = productos.filter(p => p.marca === this.filtroMarca);
    }

    // Filtro por rango de precios
    if (this.filtroPrecioMin !== null) {
      productos = productos.filter(p => (p.precioVenta || 0) >= this.filtroPrecioMin!);
    }

    if (this.filtroPrecioMax !== null) {
      productos = productos.filter(p => (p.precioVenta || 0) <= this.filtroPrecioMax!);
    }

    this.productosFiltrados = productos;
  }

  limpiarFiltros(): void {
    this.filtroTexto = '';
    this.filtroMarca = '';
    this.filtroPrecioMin = null;
    this.filtroPrecioMax = null;
    this.productosFiltrados = [...this.productos];
    this.selectedProductos = [];
  }

  // ========== CRUD (Manteniendo funcionalidad original) ==========

  openNew(): void {
    if (!this.permissionService.canCreate('productos')) {
      this.showError('No tiene permisos para crear productos');
      return;
    }
    
    this.editMode = false;
    this.producto = this.initProducto();
    this.generarCodigoAuto = true;
    this.resetImageState();
    this.submitted = false;
    this.productoDialog = true;
  }

  editProducto(producto: Producto): void {
    if (!this.permissionService.canEdit('productos')) {
      this.showError('No tiene permisos para editar productos');
      return;
    }
    
    this.editMode = true;
    this.producto = { ...producto };
    this.generarCodigoAuto = false;
    this.resetImageState();
    this.submitted = false;
    this.productoDialog = true;
  }

  saveProducto(): void {
    this.submitted = true;
    
    if (!this.isValidProducto()) {
      return;
    }
    
    this.loading = true;
    
    const saveOperation = this.editMode && this.producto.id
      ? this.updateExistingProduct()
      : this.createNewProduct();
      
    saveOperation
      .pipe(
        switchMap((productoGuardado) => {
          if (this.imagenParaSubir && productoGuardado?.id) {
            return this.subirImagenParaProducto(productoGuardado.id);
          }
          return of(productoGuardado);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (result) => {
          if (result) {
            this.showSuccess(this.editMode ? 'Producto actualizado correctamente' : 'Producto creado correctamente');
            this.hideDialog();
            this.loadProductos();
          }
        },
        error: (error) => this.handleError(error, 'Error al procesar el producto')
      });
  }

  private updateExistingProduct() {
    return this.productoService.updateProduct(this.producto.id!, this.producto)
      .pipe(
        tap(() => console.log('Producto actualizado exitosamente')),
        catchError((error) => {
          this.handleError(error, 'No se pudo actualizar el producto');
          return of(null);
        })
      );
  }
  
  private createNewProduct() {
    return this.productoService.createProduct(this.producto)
      .pipe(
        tap((response) => {
          console.log('Producto creado exitosamente:', response);
          this.producto.id = response.id;
        }),
        catchError((error) => {
          this.handleError(error, 'No se pudo crear el producto');
          return of(null);
        })
      );
  }

  deleteProducto(producto: Producto): void {
    if (!this.permissionService.canDelete('productos')) {
      this.showError('No tiene permisos para eliminar productos');
      return;
    }

    if (!producto.id) return;
    
    this.confirmationService.confirm({
      message: `¿Está seguro que desea eliminar el producto "${producto.nombre}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.loading = true;
        this.productoService.deleteProduct(producto.id!)
          .pipe(finalize(() => this.loading = false))
          .subscribe({
            next: () => {
              this.showSuccess('Producto eliminado correctamente');
              this.loadProductos();
              this.selectedProductos = [];
            },
            error: (error) => this.handleError(error, 'No se pudo eliminar el producto (puede tener inventario asociado)')
          });
      }
    });
  }

  deleteSelectedProductos(): void {
    if (!this.permissionService.canDelete('productos')) {
      this.showError('No tiene permisos para eliminar productos');
      return;
    }

    if (!this.selectedProductos.length) return;
    
    this.confirmationService.confirm({
      message: `¿Está seguro que desea eliminar los ${this.selectedProductos.length} productos seleccionados?`,
      header: 'Confirmar eliminación múltiple',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.processMultipleDelete()
    });
  }

  // ========== GESTIÓN DE IMÁGENES (Manteniendo funcionalidad original) ==========

  onUpload(event: { files?: File[] }): void {
    const file = event.files?.[0];
    if (!file) return;
    
    this.setupImagePreview(file);
    
    if (this.editMode && this.producto.id) {
      this.subirImagenProductoExistente(this.producto.id, file);
    } else {
      this.imagenParaSubir = file;
      this.showInfo('La imagen se guardará cuando guardes el producto');
    }
  }

  private setupImagePreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewImageUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  private subirImagenProductoExistente(productoId: number, file: File): void {
    const formData = new FormData();
    formData.append('imagen', file);
    
    this.loading = true;
    
    this.productoService.uploadImage(productoId, formData)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response) => {
          if (response?.imagen) {
            this.producto.imagen = response.imagen;
            this.showSuccess('Imagen subida correctamente');
            this.resetImageState();
            this.loadProductos();
          }
        },
        error: (error) => this.handleError(error, 'No se pudo subir la imagen')
      });
  }

  private subirImagenParaProducto(productoId: number) {
    if (!this.imagenParaSubir) return of(null);
  
    const formData = new FormData();
    formData.append('imagen', this.imagenParaSubir);
    
    return this.productoService.uploadImage(productoId, formData)
      .pipe(
        tap((response) => {
          if (response?.imagen) {
            this.producto.imagen = response.imagen;
          }
        }),
        catchError((error) => {
          this.showWarning('El producto se guardó pero hubo un error al subir la imagen');
          return of(null);
        })
      );
  }

  getImageUrl(producto: Producto): string {
    if (this.previewImageUrl) {
      return this.previewImageUrl;
    }
    
    if (producto?.imagen) {
      if (producto.imagen.startsWith('http')) {
        return producto.imagen;
      }
      return `${environment.apiUrl}api/files/uploads/${producto.imagen}`;
    }
    
    return 'assets/images/placeholder-product.jpg';
  }

  onImageError(event: any): void {
    event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlbiBubyBkaXNwb25ibGU8L3RleHQ+PC9zdmc+';
  }

  // ========== VALIDACIONES (Manteniendo funcionalidad original) ==========

  private isValidProducto(): boolean {
    if (!this.producto.nombre?.trim()) {
      this.showError('El nombre del producto es obligatorio');
      return false;
    }

    if (!this.producto.marca?.trim()) {
      this.showError('La marca es obligatoria');
      return false;
    }

    if (!this.producto.modelo?.trim()) {
      this.showError('El modelo es obligatorio');
      return false;
    }

    if (!this.producto.precioCompra || this.producto.precioCompra <= 0) {
      this.showError('El precio de compra debe ser mayor a 0');
      return false;
    }

    if (!this.producto.precioVenta || this.producto.precioVenta <= 0) {
      this.showError('El precio de venta debe ser mayor a 0');
      return false;
    }

    if (this.producto.precioVenta <= this.producto.precioCompra) {
      this.showError('El precio de venta debe ser mayor al precio de compra');
      return false;
    }

    if (!this.generarCodigoAuto && !this.producto.codigo?.trim()) {
      this.showError('El código del producto es obligatorio');
      return false;
    }

    return true;
  }

  private async processMultipleDelete(): Promise<void> {
    this.loading = true;
    
    try {
      const deleteOperations = this.selectedProductos
        .filter(producto => producto.id)
        .map(producto => 
          this.productoService.deleteProduct(producto.id!)
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
      this.loadProductos();
      this.selectedProductos = [];
    } catch (error) {
      this.handleError(error, 'No se pudieron eliminar algunos productos');
    } finally {
      this.loading = false;
    }
  }

  private showDeleteResults(successful: number, failed: number): void {
    if (successful > 0) {
      this.showSuccess(`${successful} productos eliminados correctamente`);
    }
    
    if (failed > 0) {
      this.showWarning(`${failed} productos no pudieron ser eliminados (pueden tener inventario asociado)`);
    }
  }

  // ========== UTILIDADES (Manteniendo y expandiendo funcionalidad original) ==========

  hideDialog(): void {
    this.productoDialog = false;
    this.submitted = false;
    this.producto = this.initProducto();
    this.resetImageState();
  }

  /**
   * 👇 Cierra el modal de detalles
   */
  hideDetalleDialog(): void {
    this.detalleProductoDialog = false;
    this.productoDetalle = null;
  }

  /**
   * 👇 Cierra el modal de estadísticas
   */
  hideEstadisticasDialog(): void {
    this.estadisticasDialog = false;
  }

  private resetImageState(): void {
    this.imagenParaSubir = null;
    this.previewImageUrl = null;
  }

  onGlobalFilter(dt: any, event: Event): void {
    const element = event.target as HTMLInputElement;
    dt.filterGlobal(element.value, 'contains');
  }

  calcularMargenGanancia(producto: Producto): number {
    if (!producto?.precioCompra || !producto?.precioVenta) return 0;
    return Number((((producto.precioVenta - producto.precioCompra) / producto.precioCompra) * 100).toFixed(2));
  }

  getMargenSeverity(margen: number): 'success' | 'warning' | 'danger' | null {
    if (margen >= 50) return 'success';
    if (margen >= 20) return 'warning';
    return 'danger';
  }

  getSeverityValue(margen: number): 'success' | 'warning' | 'danger' | 'info' {
    try {
      return this.getMargenSeverity(margen) || 'info';
    } catch (e) {
      return 'info';
    }
  }

  // ========== EXPORTACIÓN (Manteniendo funcionalidad original) ==========

  async exportarExcel(): Promise<void> {
    if (!this.productosFiltrados?.length) {
      this.showWarning('No hay datos para exportar');
      return;
    }

    try {
      const xlsx = await import('xlsx');
      
      const dataToExport = this.productosFiltrados.map(producto => ({
        'ID': producto.id || '',
        'Código': producto.codigo || '',
        'Nombre': producto.nombre || '',
        'Marca': producto.marca || '',
        'Modelo': producto.modelo || '',
        'Descripción': producto.descripcion || '',
        'Precio Compra': producto.precioCompra || 0,
        'Precio Venta': producto.precioVenta || 0,
        'Margen %': this.calcularMargenGanancia(producto).toFixed(2),
        'Ganancia Unitaria': ((producto.precioVenta || 0) - (producto.precioCompra || 0)).toFixed(2),
        'Fecha Creación': producto.fechaCreacion ? new Date(producto.fechaCreacion).toLocaleString() : 'N/A',
        'Última Actualización': producto.fechaActualizacion ? new Date(producto.fechaActualizacion).toLocaleString() : 'N/A'
      }));
      
      const worksheet = xlsx.utils.json_to_sheet(dataToExport);
      const workbook = { Sheets: { 'Productos': worksheet }, SheetNames: ['Productos'] };
      const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
      this.guardarArchivo(excelBuffer, 'productos');
    } catch (error) {
      this.handleError(error, 'Error al exportar a Excel');
    }
  }

  private guardarArchivo(buffer: any, fileName: string): void {
    const data = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(data);
    link.download = `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    link.click();
  }

  // ========== INICIALIZACIÓN (Manteniendo funcionalidad original) ==========

  private initProducto(): Producto {
    return {
      id: undefined,
      codigo: '',
      nombre: '',
      marca: '',
      modelo: '',
      descripcion: '',
      precioCompra: 0,
      precioVenta: 0,
      imagen: '',
      fechaCreacion: undefined,
      fechaActualizacion: undefined
    };
  }

  // ========== MENSAJES (Manteniendo funcionalidad original) ==========

  private showSuccess(message: string): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
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

  /**
 * Exporta las estadísticas del inventario a Excel
 */
async exportarEstadisticas(): Promise<void> {
  if (!this.productos?.length) {
    this.showWarning('No hay datos para exportar estadísticas');
    return;
  }

  try {
    const xlsx = await import('xlsx');
    const stats = this.getEstadisticas();
    
    // Datos de resumen
    const resumenData = [
      ['RESUMEN DEL INVENTARIO', ''],
      ['Total de Productos', stats.total],
      ['Valor Total del Inventario', stats.valorTotal],
      ['Margen Promedio (%)', stats.promedioMargen.toFixed(2)],
      ['Marcas Diferentes', stats.marcas],
      ['Productos con Alto Margen (≥50%)', stats.productosMayorMargen],
      ['Productos con Bajo Margen (<20%)', stats.productosMargenBajo],
      ['', ''],
      ['PRODUCTOS DESTACADOS', ''],
      ['Producto Más Caro', stats.productoMasCaro?.nombre || 'N/A'],
      ['Precio Más Alto', stats.productoMasCaro?.precioVenta || 0],
      ['Producto Más Económico', stats.productoMasBarato?.nombre || 'N/A'],
      ['Precio Más Bajo', stats.productoMasBarato?.precioVenta || 0]
    ];

    // Análisis por marca
    const marcasAnalisis = this.productos.reduce((acc, producto) => {
      const marca = producto.marca || 'Sin marca';
      if (!acc[marca]) {
        acc[marca] = {
          cantidad: 0,
          valorTotal: 0,
          margenPromedio: 0,
          margenes: []
        };
      }
      acc[marca].cantidad++;
      acc[marca].valorTotal += producto.precioVenta || 0;
      const margen = this.calcularMargenGanancia(producto);
      acc[marca].margenes.push(margen);
      return acc;
    }, {} as any);

    const marcasData = [
      ['ANÁLISIS POR MARCA', '', '', ''],
      ['Marca', 'Cantidad', 'Valor Total', 'Margen Promedio (%)'],
      ...Object.entries(marcasAnalisis).map(([marca, data]: [string, any]) => [
        marca,
        data.cantidad,
        data.valorTotal,
        (data.margenes.reduce((sum: number, m: number) => sum + m, 0) / data.margenes.length).toFixed(2)
      ])
    ];

    // Crear hojas
    const resumenSheet = xlsx.utils.aoa_to_sheet(resumenData);
    const marcasSheet = xlsx.utils.aoa_to_sheet(marcasData);
    
    const workbook = {
      Sheets: {
        'Resumen': resumenSheet,
        'Análisis por Marca': marcasSheet
      },
      SheetNames: ['Resumen', 'Análisis por Marca']
    };

    const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.guardarArchivo(excelBuffer, 'estadisticas_inventario');
    
    this.showSuccess('Estadísticas exportadas correctamente');
    this.hideEstadisticasDialog();
  } catch (error) {
    this.handleError(error, 'Error al exportar estadísticas');
  }
}
}
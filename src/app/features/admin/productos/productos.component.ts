import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
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
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { Producto } from '../../../core/models/product.model';
import { ProductoService } from '../../../core/services/producto.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { FileUploadModule } from 'primeng/fileupload';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { environment } from '../../../../enviroments/enviroment';
import { Subject, catchError, finalize, firstValueFrom, forkJoin, of, takeUntil } from 'rxjs';

@Component({
  selector: 'app-productos',
  standalone: true,
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
    TagModule,
    FileUploadModule,
    CheckboxModule,
    InputNumberModule
  ],
  providers: [MessageService, ConfirmationService, ProductoService],
  templateUrl: './productos.component.html'
})
export class ProductosComponent implements OnInit, OnDestroy {
  // Definiciones de tablas
  productos: Producto[] = [];
  producto: Producto = this.getEmptyProducto();
  selectedProductos: Producto[] = [];
  cols = [
    { field: 'codigo', header: 'Código' },
    { field: 'nombre', header: 'Nombre' },
    { field: 'descripcion', header: 'Descripción' },
    { field: 'precioCompra', header: 'Precio Compra' },
    { field: 'precioVenta', header: 'Precio Venta' },
    { field: 'modelo', header: 'Modelo' },
    { field: 'marca', header: 'Marca' },
  ];

  // Estados UI
  loading = false;
  submitted = false;
  productoDialog = false;
  editMode = false;
  deleteProductoDialog = false;
  generarCodigoAuto = true;

  // Manejo de imagen
  imagenParaSubir: File | null = null;
  previewImageUrl: string | null = null;
  
  // Propiedades para la paginación
  first = 0;
  totalRecords = 0;
  rows = 10;
  currentPage = 0;
  totalPages = 0;
  pageLinkSize = 5;

  // Para gestionar suscripciones
  private destroy$ = new Subject<void>();

  constructor(
    private productoService: ProductoService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit(): void {
    this.loadProductos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProductos(): void {
    this.loading = true;

    this.productoService.getProducts(this.currentPage, this.rows)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (response) => {
          if (response && response.contenido) {
            this.productos = response.contenido;
            this.totalRecords = response.totalElementos || 0;
            this.rows = response.tamañoPagina || 10;
            this.currentPage = response.numeroPagina || 0;
            this.totalPages = response.totalPaginas || 1;
            this.first = this.currentPage * this.rows;
          } else {
            this.resetPaginationData();
          }
        },
        error: (error) => {
          this.handleError('No se pudo cargar la lista de productos', error);
        }
      });
  }

  private resetPaginationData(): void {
    this.productos = [];
    this.totalRecords = 0;
    this.totalPages = 0;
    this.first = 0;
  }

  onPageChange(event: { first: number; rows: number }): void {
    this.first = event.first;
    this.rows = event.rows;
    this.currentPage = Math.floor(this.first / this.rows);
    this.loadProductos();
  }

  private getEmptyProducto(): Producto {
    return {
      codigo: '',
      nombre: '',
      marca: '',
      modelo: '',
      precioVenta: 0,
      precioCompra: 0,
      descripcion: '',
      imagen: '',
    };
  }

  openNew(): void {
    this.producto = this.getEmptyProducto();
    this.generarCodigoAuto = true;
    this.resetFormState();
    this.productoDialog = true;
  }

  editProducto(producto: Producto): void {
    this.producto = { ...producto };
    this.generarCodigoAuto = false;
    this.productoDialog = true;
    this.resetImageState();
  }

  private resetFormState(): void {
    this.submitted = false;
    this.resetImageState();
  }

  private resetImageState(): void {
    this.previewImageUrl = null;
    this.imagenParaSubir = null;
  }

  deleteProducto(producto: Producto): void {
    this.deleteProductoDialog = true;
    this.producto = { ...producto };
  }

  confirmDelete(): void {
    this.deleteProductoDialog = false;
    
    if (!this.producto.id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se puede eliminar un producto sin ID'
      });
      return;
    }

    this.loading = true;
    
    this.productoService.deleteProduct(this.producto.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Producto eliminado correctamente'
          });
          this.loadProductos();
          this.producto = this.getEmptyProducto();
        },
        error: (error) => {
          this.handleError('Error al eliminar el producto', error);
        }
      });
  }

  hideDialog(): void {
    this.productoDialog = false;
    this.resetFormState();
  }

  saveProducto(): void {
    this.submitted = true;
    
    if (!this.isValidProducto()) {
      return;
    }
    
    this.loading = true;
    
    const saveOperation = this.producto.id
      ? this.updateExistingProduct()
      : this.createNewProduct();
      
    saveOperation
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          // La finalización del loading se maneja en los métodos específicos
          // para asegurar que ocurra después de las operaciones de imagen
        })
      )
      .subscribe();
  }

  private updateExistingProduct() {
    if (!this.producto.id) {
      return of(null);
    }
    
    return this.productoService.updateProduct(this.producto.id, this.producto)
      .pipe(
        catchError((error) => {
          this.handleError('No se pudo actualizar el producto', error);
          this.loading = false;
          return of(null);
        }),
        finalize(() => {
          if (!this.imagenParaSubir) {
            this.loading = false;
            this.loadProductos();
            this.productoDialog = false;
          }
        })
      );
  }

  private createNewProduct() {
    return this.productoService.createProduct(this.producto)
      .pipe(
        catchError((error) => {
          this.handleError('No se pudo crear el producto', error);
          this.loading = false;
          return of(null);
        }),
        finalize(() => {
          if (!this.imagenParaSubir) {
            this.loading = false;
            this.loadProductos();
            this.productoDialog = false;
            this.resetImageState();
          }
        })
      );
  }

  isValidProducto(): boolean {
    const isValid = !!(
      this.producto.nombre?.trim() &&
      this.producto.marca?.trim() &&
      this.producto.modelo?.trim() &&
      this.producto.precioCompra > 0 &&
      this.producto.precioVenta > 0 &&
      (this.generarCodigoAuto || this.producto.codigo?.trim())
    );
    
    if (!isValid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos Incompletos',
        detail: 'Por favor complete todos los campos obligatorios correctamente'
      });
    }
    
    return isValid;
  }

  // Manejo de imagen
  onUpload(event: { files?: File[] }): void {
    const file = event.files?.[0];
    
    if (!file) {
      return;
    }
    
    this.setupImagePreview(file);
    
    if (this.producto.id) {
      this.subirImagenProductoExistente(this.producto.id, file);
    } else {
      this.imagenParaSubir = file;
      this.messageService.add({
        severity: 'info',
        summary: 'Imagen seleccionada',
        detail: 'La imagen se subirá cuando guardes el producto'
      });
    }
  }

  private setupImagePreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewImageUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  subirImagenProductoExistente(productoId: number, file: File): void {
    if (!file || !productoId) {
      return;
    }

    const formData = new FormData();
    formData.append('imagen', file);
    
    this.loading = true;
    
    this.productoService.uploadImage(productoId, formData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
          this.resetImageState();
        })
      )
      .subscribe({
        next: (response) => {
          if (response && response.imagen) {
            this.producto.imagen = response.imagen;
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Imagen subida correctamente'
            });
            
            if (this.productoDialog) {
              this.productoDialog = false;
            }
            
            this.loadProductos();
          } else {
            this.messageService.add({
              severity: 'warn',
              summary: 'Advertencia',
              detail: 'La imagen fue subida pero la respuesta del servidor no es la esperada'
            });
          }
        },
        error: (error) => {
          this.handleError('No se pudo subir la imagen', error);
        }
      });
  }

  getImageUrl(producto: Producto): string {
    if (this.previewImageUrl && this.producto === producto) {
      return this.previewImageUrl;
    }

    if (!producto.imagen) {
      return '../../../../assets/images/product-placeholder.png';
    }
    
    return `${environment.apiUrl}productos/${producto.id}/imagen-file`;
  }

  onGlobalFilter(table: Table, event: Event): void {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  deleteSelectedProductos(): void {
    if (!this.selectedProductos?.length) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'No hay productos seleccionados para eliminar'
      });
      return;
    }

    this.confirmationService.confirm({
      message: `¿Está seguro que desea eliminar los ${this.selectedProductos.length} productos seleccionados?`,
      header: 'Confirmar eliminación múltiple',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.processMultipleDelete()
    });
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
      this.handleError('Error al eliminar los productos seleccionados', error);
    } finally {
      this.loading = false;
    }
  }

  private showDeleteResults(successful: number, failed: number): void {
    if (successful > 0) {
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: `${successful} productos eliminados correctamente`
      });
    }
    
    if (failed > 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: `${failed} productos no pudieron ser eliminados`
      });
    }
  }

  async exportCSV(): Promise<void> {
    const exportData = this.productos.map(producto => ({
      ID: producto.id,
      Codigo: producto.codigo,
      Nombre: producto.nombre,
      Descripción: producto.descripcion,
      Marca: producto.marca,
      Modelo: producto.modelo,
      'Precio Compra': producto.precioCompra,
      'Precio Venta': producto.precioVenta,
      'Fecha Creación': producto.fechaCreacion ? new Date(producto.fechaCreacion).toLocaleDateString() : '',
      'Fecha Actualización': producto.fechaActualizacion ? new Date(producto.fechaActualizacion).toLocaleDateString() : ''
    }));

    try {
      const xlsx = await import('xlsx');
      const worksheet = xlsx.utils.json_to_sheet(exportData);
      const workbook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
      const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
      this.saveAsExcelFile(excelBuffer, 'productos');
    } catch (error) {
      this.handleError('Error al exportar a Excel', error);
    }
  }

  private async saveAsExcelFile(buffer: any, fileName: string): Promise<void> {
    const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const EXCEL_EXTENSION = '.xlsx';
    const data: Blob = new Blob([buffer], { type: EXCEL_TYPE });
    
    try {
      const fileSaver = await import('file-saver');
      fileSaver.saveAs(data, fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION);
    } catch (error) {
      this.handleError('Error al guardar el archivo Excel', error);
    }
  }

  private handleError(message: string, error: any): void {
    console.error(`${message}:`, error);
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message
    });
  }
}
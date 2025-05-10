import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ColorService } from '../../../core/services/colores.service';
import { ProductoService } from '../../../core/services/producto.service';
import { Producto } from '../../../core/models/product.model';
import { Color, Talla } from '../../../core/models/colors.model';

@Component({
  selector: 'app-colores',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    TableModule,
    ToastModule,
    ConfirmDialogModule,
    DropdownModule,
    ToolbarModule,
    TagModule,
    InputIconModule,
    IconFieldModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './colores.component.html'
})

export class ColoresComponent implements OnInit {
  colores: Color[] = [];
  coloresFiltrados: Color[] = [];
  selectedColores: Color[] = [];
  productos: Producto[] = [];
  
  // Propiedades para controlar el diálogo
  visible: boolean = false;
  productoId: number | null = null;
  productoSeleccionado: Producto | null = null;
  productoSeleccionadoFiltro: Producto | null = null;
  color: Color = { nombre: '' };
  editMode: boolean = false;
  nuevaTalla: string = '';
  tallas: Talla[] = [];
  submitted: boolean = false;
  loading: boolean = false;

  constructor(
    private colorService: ColorService,
    private productoService: ProductoService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.resetForm();
    this.loadProductos();
    // Ya no cargamos todos los colores al inicio, sólo cuando se seleccione un producto
  }
  
  /**
   * Método para filtrar la tabla globalmente
   * @param dt Referencia a la tabla
   * @param event Evento de input
   */
  onGlobalFilter(dt: any, event: Event): void {
    const element = event.target as HTMLInputElement;
    dt.filterGlobal(element.value, 'contains');
  }
  
  /**
   * Método para eliminar colores seleccionados
   */
  eliminarColoresSeleccionados(): void {
    this.confirmationService.confirm({
      message: `¿Está seguro que desea eliminar los ${this.selectedColores.length} colores seleccionados?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (this.selectedColores && this.selectedColores.length > 0) {
          const eliminarPromises = this.selectedColores
            .filter(color => color.id) // Filtrar solo los que tienen ID
            .map(color => this.colorService.eliminarColor(color.id!));
          
          if (eliminarPromises.length > 0) {
            this.loading = true;
            
            // Utilizar forkJoin para manejar múltiples observables
            import('rxjs').then(({ forkJoin }) => {
              forkJoin(eliminarPromises).subscribe({
                next: () => {
                  this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Colores eliminados correctamente'
                  });
                  this.selectedColores = [];
                  // Recargar los colores del producto seleccionado
                  if (this.productoSeleccionadoFiltro) {
                    this.cargarColoresPorProducto();
                  }
                },
                error: (error) => {
                  console.error('Error al eliminar colores:', error);
                  this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.error?.message || 'No se pudieron eliminar algunos colores'
                  });
                },
                complete: () => {
                  this.loading = false;
                }
              });
            });
          }
        }
      }
    });
  }
  
  /**
   * Método para exportar la tabla a CSV
   */
  exportarCSV(): void {
    import('xlsx').then(xlsx => {
      if (this.colores && this.colores.length > 0) {
        const dataToExport = this.colores.map(color => {
          return {
            ID: color.id,
            Nombre: color.nombre,
            Tallas: color.tallas ? color.tallas.map(t => t.numero).join(', ') : ''
          };
        });
        
        const worksheet = xlsx.utils.json_to_sheet(dataToExport);
        const workbook = { Sheets: { 'Colores': worksheet }, SheetNames: ['Colores'] };
        const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
        
        const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(data);
        link.download = 'colores.xlsx';
        link.click();
      } else {
        this.messageService.add({
          severity: 'warn',
          summary: 'Advertencia',
          detail: 'No hay datos para exportar'
        });
      }
    });
  }

  /**
   * Método para abrir el diálogo para crear un nuevo color sin un producto asociado
   */
  openNew(): void {
    this.editMode = false;
    this.resetForm();
    
    // Usar el producto seleccionado en el filtro para preseleccionarlo al crear
    if (this.productoSeleccionadoFiltro && this.productoSeleccionadoFiltro.id) {
      this.productoId = this.productoSeleccionadoFiltro.id;
      this.productoSeleccionado = this.productoSeleccionadoFiltro;
    } else {
      this.productoId = null;
      this.productoSeleccionado = null;
    }
    
    this.visible = true;
  }

  /**
   * Método para abrir el diálogo para crear un nuevo color
   * @param productoId ID del producto al que se asociará el color
   */
  open(productoId: number): void {
    this.productoId = productoId;
    this.editMode = false;
    this.resetForm();
    this.visible = true;
  }

  /**
   * Método para abrir el diálogo para editar un color existente
   * @param color Color a editar
   * @param productoId ID del producto al que está asociado el color
   */
  openForEdit(color: Color, productoId: number): void {
    this.productoId = productoId;
    this.editMode = true;
    this.color = { ...color };
    this.tallas = [...(color.tallas || [])];
    this.visible = true;
  }

  /**
   * Método para cerrar el diálogo
   */
  hide(): void {
    this.visible = false;
    this.resetForm();
  }

  /**
   * Método para cargar los productos disponibles
   */
  loadProductos(): void {
    this.productoService.getProducts(0, 1000).subscribe({
      next: (response) => {
        this.productos = response.contenido || [];
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'No se pudo cargar los productos'
        });
      }
    });
  }

  /**
   * Método para resetear el formulario
   */
  private resetForm(): void {
    this.color = { nombre: '' };
    this.tallas = [];
    this.nuevaTalla = '';
    this.submitted = false;
  }

  /**
   * Método para cargar los colores por producto seleccionado
   */
  cargarColoresPorProducto(): void {
    if (!this.productoSeleccionadoFiltro || !this.productoSeleccionadoFiltro.id) {
      this.coloresFiltrados = [];
      return;
    }
    
    this.loading = true;
    this.colorService.getColoresPorProducto(this.productoSeleccionadoFiltro.id).subscribe({
      next: (response) => {
        this.coloresFiltrados = response;
        console.log('Colores cargados:', this.coloresFiltrados);
      },
      error: (error) => {
        console.error(`Error al cargar colores para el producto ${this.productoSeleccionadoFiltro?.nombre}:`, error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'No se pudieron cargar los colores para este producto'
        });
        this.coloresFiltrados = [];
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
  
  /**
   * Método para cargar todos los colores
   * (No se usa directamente en la interfaz, pero puede ser útil para exportación)
   */
  loadColores(): void {
    this.loading = true;
    this.colorService.getColores(0, 100, 'nombre', 'asc').subscribe({
      next: (response) => {
        this.colores = response.contenido;
      },
      error: (error) => {
        console.error('Error al cargar todos los colores:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'No se pudo cargar los colores'
        });
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  /**
   * Método para añadir una nueva talla a la lista
   */
  agregarTalla(): void {
    if (this.nuevaTalla?.trim()) {
      // Verificar si la talla ya existe
      const existeTalla = this.tallas.some(t => t.numero === this.nuevaTalla.trim());
      
      if (existeTalla) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Talla duplicada',
          detail: `La talla ${this.nuevaTalla} ya existe en este color`
        });
        return;
      }
      
      this.tallas.push({ numero: this.nuevaTalla.trim() });
      this.nuevaTalla = '';
    }
  }

  /**
   * Método para eliminar una talla de la lista
   * @param index Índice de la talla a eliminar
   */
  eliminarTalla(index: number): void {
    this.tallas.splice(index, 1);
  }

  /**
   * Método para confirmar la eliminación de un color
   * @param color Color a eliminar
   */
  confirmarEliminacion(color: Color): void {
    this.confirmationService.confirm({
      message: `¿Está seguro que desea eliminar el color "${color.nombre}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.eliminarColor(color);
      }
    });
  }

  /**
   * Método para eliminar un color
   * @param color Color a eliminar
   */
  eliminarColor(color: Color): void {
    if (!color.id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se puede eliminar un color sin ID'
      });
      return;
    }

    this.loading = true;
    this.colorService.eliminarColor(color.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Color eliminado correctamente'
        });
        // Recargar los colores del producto seleccionado, no todos los colores
        if (this.productoSeleccionadoFiltro) {
          this.cargarColoresPorProducto();
        }
      },
      error: (error) => {
        console.error('Error al eliminar color:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'No se pudo eliminar el color'
        });
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  /**
   * Método para guardar el color (crear o actualizar)
   */
  guardarColor(): void {
    this.submitted = true;
    
    if (!this.color.nombre?.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos incompletos',
        detail: 'El nombre del color es obligatorio'
      });
      return;
    }
    
    if (!this.editMode && !this.productoSeleccionado) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos incompletos',
        detail: 'Debe seleccionar un producto'
      });
      return;
    }
    
    // Actualizar el productoId basado en el producto seleccionado si no estamos en modo edición
    if (!this.editMode && this.productoSeleccionado && this.productoSeleccionado.id) {
      this.productoId = this.productoSeleccionado.id;
    }
    
    this.loading = true;
    const colorRequest = {
      nombre: this.color.nombre.trim(),
      tallas: this.tallas.map(t => ({ numero: t.numero }))
    };
    
    if (this.editMode && this.color.id) {
      this.colorService.actualizarColor(this.color.id, colorRequest).subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Color actualizado correctamente'
          });
          this.hide();
          // Recargar los colores del producto seleccionado
          if (this.productoSeleccionadoFiltro) {
            this.cargarColoresPorProducto();
          }
        },
        error: (error) => {
          console.error('Error al actualizar color:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'No se pudo actualizar el color'
          });
        },
        complete: () => {
          this.loading = false;
        }
      });
    } else {
      if (this.productoId === null) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo identificar el producto'
        });
        this.loading = false;
        return;
      }
      
      this.colorService.crearColor(this.productoId, colorRequest).subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Color creado correctamente'
          });
          this.hide();
          // Recargar los colores del producto seleccionado
          if (this.productoSeleccionadoFiltro) {
            this.cargarColoresPorProducto();
          }
        },
        error: (error) => {
          console.error('Error al crear color:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'No se pudo crear el color'
          });
        },
        complete: () => {
          this.loading = false;
        }
      });
    }
  }
}
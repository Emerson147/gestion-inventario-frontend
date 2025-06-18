import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
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
import { environment } from '../../../../environments/environment';
import { finalize, forkJoin, catchError, of, firstValueFrom, switchMap, tap } from 'rxjs';
import { AlertaNegocio, AnalyticsService, KPIMetrics, OptimizacionPrecio } from '../../../core/services/analytics.service';
import { EnterpriseIntegrationService, SincronizacionResult } from '../../../core/services/enterprise-integration.service';
import { MenuModule } from 'primeng/menu';

interface ViewOption {
  label: string;
  value: 'table' | 'cards';
  icon: string;
}

// Interfaz para acciones masivas
interface AccionMasiva {
  label: string;
  icon: string;
  command: () => void;
  separator?: boolean;
  disabled?: boolean;
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
    MenuModule,
    HasPermissionDirective
  ],
  providers: [MessageService, ConfirmationService, CurrencyPipe],
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.scss']
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

    // Propiedades para acciones masivas
    accionesMasivas: AccionMasiva[] = [];

    /**
   * 🚀 Inicializa las acciones masivas disponibles
   */
    private inicializarAccionesMasivas(): void {
      this.accionesMasivas = [
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
        { separator: true } as AccionMasiva,
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
    }

    /**
   * 🎯 Acción principal del split button (la más común)
   */
    accionPrincipalMasiva(): void {
      // La acción más común - exportar
      this.exportarSeleccionados();
    }
  

  // ========== PERMISOS ==========
  permissionTypes = PermissionType;

   // 🆕 NUEVAS PROPIEDADES EMPRESARIALES
  kpiMetrics: KPIMetrics | null = null;
  alertasNegocio: AlertaNegocio[] = [];
  optimizacionesDialog = false;
  optimizacionesSugeridas: OptimizacionPrecio[] = [];
  productosMap: Map<number, Producto> = new Map();
  dashboardEjecutivoDialog = false;
  alertasDialog = false;
  sincronizandoERP = false;

  // 🆕 Nuevos filtros avanzados
  filtroAvanzado = {
    categoria: '',
    margenMinimo: null as number | null,
    margenMaximo: null as number | null,
    fechaDesde: null as Date | null,
    fechaHasta: null as Date | null,
    soloPorductosConAlertas: false
  };

  marcasCalzado = [
    { label: 'Nike', value: 'Nike' },
    { label: 'Adidas', value: 'Adidas' },
    { label: 'Puma', value: 'Puma' },
    { label: 'Reebok', value: 'Reebok' },
    { label: 'Converse', value: 'Converse' },
    { label: 'Vans', value: 'Vans' },
    { label: 'New Balance', value: 'New Balance' },
    { label: 'Asics', value: 'Asics' },
    { label: 'Fila', value: 'Fila' },
    { label: 'Under Armour', value: 'Under Armour' },
    { label: 'Timberland', value: 'Timberland' },
    { label: 'Dr. Martens', value: 'Dr. Martens' },
    { label: 'Caterpillar', value: 'Caterpillar' },
    { label: 'Clarks', value: 'Clarks' },
    { label: 'Otro', value: 'Otro' }
  ];

  generosCalzado = [
    { label: 'Hombre', value: 'hombre' },
    { label: 'Mujer', value: 'mujer' },
    { label: 'Niño', value: 'nino' },
    { label: 'Niña', value: 'nina' },
    { label: 'Unisex', value: 'unisex' }
  ];

  modeloCalzado = [
    { label: 'Zapatillas Deportivas', value: 'zapatillas_deportivas' },
    { label: 'Zapatillas Casual', value: 'zapatillas_casual' },
    { label: 'Zapatos Formales', value: 'zapatos_formales' },
    { label: 'Botines', value: 'botines' },
    { label: 'Botas', value: 'botas' },
    { label: 'Sandalias', value: 'sandalias' },
    { label: 'Chinelas', value: 'chinelas' },
    { label: 'Zapatos de Seguridad', value: 'zapatos_seguridad' },
    { label: 'Zapatos de Vestir', value: 'zapatos_vestir' },
    { label: 'Otros', value: 'otros' }
  ];


  constructor(
    private readonly productoService: ProductoService,
    private readonly messageService: MessageService,
    private readonly confirmationService: ConfirmationService,
    private readonly permissionService: PermissionService,
    private readonly analyticsService: AnalyticsService,
    private readonly enterpriseService: EnterpriseIntegrationService,
    private readonly currencyPipe: CurrencyPipe
  ) {}

  ngOnInit(): void {
    this.inicializarAccionesMasivas();
    this.loadProductos();
    this.cargarDatosEmpresariales(); // 🆕 Nueva función
    this.productosMap = new Map(
      this.productos
        .filter(p => p.id !== undefined && p.id !== null) // Filtrar IDs válidos
        .map(p => [p.id!, p]) // El ! indica que sabemos que id no es undefined después del filter
    );
  }

  get alertasAltaSeveridad(): number {
    return this.alertasNegocio.filter(a => a.severidad === 'HIGH').length;
  }

  onToggleSeleccionTodas(event: any): void {
    const checked = event.checked;
    this.optimizacionesSugeridas.forEach(optimizacion => {
      // Agregamos la propiedad selected dinámicamente
      (optimizacion as any).selected = checked;
    });
  }

   getNombreProductoRapido(productoId: number): string {
    return this.productosMap.get(productoId)?.nombre || 'Producto no encontrado';
  }

    /**
   * Calcula el impacto total estimado de las optimizaciones seleccionadas
   */
  get impactoTotalSeleccionado(): number {
    return this.optimizacionesSugeridas.reduce((sum, optimizacion) => {
      const selected = (optimizacion as any).selected;
      return sum + (selected ? optimizacion.impactoEstimado : 0);
    }, 0);
  }

    /**
   * Verifica si hay al menos una optimización seleccionada
   */
  get hayOptimizacionesSeleccionadas(): boolean {
    return this.optimizacionesSugeridas.some(o => (o as any).selected);
  }

  getSelectedOptimizations(): OptimizacionPrecio[] {
    return this.optimizacionesSugeridas.filter(o => o['selected']);
  }

  hasSelectedOptimizations(): boolean {
    return this.getSelectedOptimizations().length > 0;
  }

   /**
   * Carga datos empresariales en paralelo
   */
  private async cargarDatosEmpresariales(): Promise<void> {
    try {
      // Cargar KPIs y alertas en paralelo
      const [kpis, alertas] = await Promise.all([
        firstValueFrom(this.analyticsService.getKPIMetrics()),
        firstValueFrom(this.analyticsService.getAlertasNegocio())
      ]);

      this.kpiMetrics = kpis;
      this.alertasNegocio = alertas;

      // Mostrar notificación si hay alertas críticas
      const alertasCriticas = alertas.filter(a => a.severidad === 'HIGH');
      if (alertasCriticas.length > 0) {
        this.showWarning(`Tienes ${alertasCriticas.length} alertas críticas de negocio`);
      }
    } catch (error) {
      console.error('Error cargando datos empresariales:', error);
    }
  }

  /**
   * 📊 Abrir dashboard ejecutivo
   */
  abrirDashboardEjecutivo(): void {
    this.dashboardEjecutivoDialog = true;
  }

  /**
   * 🚨 Ver alertas de negocio
   */
  verAlertasNegocio(): void {
    this.alertasDialog = true;
  }

  /**
   * 🔄 Sincronizar con ERP
   */
  async sincronizarConERP(): Promise<void> {
    this.sincronizandoERP = true;

    try {
      const resultado = await firstValueFrom(
        this.enterpriseService.sincronizarConERP({
          productos: this.productos,
          incluirPrecios: true,
          incluirStock: true
        })
      );

      this.mostrarResultadoSincronizacion(resultado);
    } catch (error) {
      this.handleError(error, 'Error en sincronización con ERP');
    } finally {
      this.sincronizandoERP = false;
    }
  }

  /**
   * 📈 Aplicar optimizaciones seleccionadas
   */
  async aplicarOptimizaciones(optimizaciones: OptimizacionPrecio[]): Promise<void> {
    this.loading = true;

    try {
      for (const opt of optimizaciones) {
        const producto = this.productos.find(p => p.id === opt.productoId);
        if (producto) {
          producto.precioVenta = opt.precioOptimizado;
          await firstValueFrom(this.productoService.updateProduct(producto.id!, producto));
        }
      }

      this.showSuccess(`${optimizaciones.length} precios optimizados correctamente`);
      this.loadProductos();
      this.optimizacionesDialog = false;
    } catch (error) {
      this.handleError(error, 'Error al aplicar optimizaciones');
    } finally {
      this.loading = false;
    }
  }

  /**
   * 🔍 Filtros avanzados
   */
  aplicarFiltrosAvanzados(): void {
    let productos = [...this.productos];

    // Filtro por margen
    if (this.filtroAvanzado.margenMinimo !== null) {
      productos = productos.filter(p => this.calcularMargenGanancia(p) >= this.filtroAvanzado.margenMinimo!);
    }

    if (this.filtroAvanzado.margenMaximo !== null) {
      productos = productos.filter(p => this.calcularMargenGanancia(p) <= this.filtroAvanzado.margenMaximo!);
    }

    // Filtro por fecha
    if (this.filtroAvanzado.fechaDesde) {
      productos = productos.filter(p => 
        p.fechaCreacion && new Date(p.fechaCreacion) >= this.filtroAvanzado.fechaDesde!
      );
    }

    // Filtro productos con alertas
    if (this.filtroAvanzado.soloPorductosConAlertas) {
      const productosConAlertas = this.alertasNegocio
        .filter(a => a.productoId)
        .map(a => a.productoId);
      
      productos = productos.filter(p => productosConAlertas.includes(p.id));
    }

    this.productosFiltrados = productos;
  }

  // 🆕 MÉTODOS DE UTILIDAD

  private mostrarResultadoSincronizacion(resultado: SincronizacionResult): void {
    if (resultado.exitosos > 0) {
      this.showSuccess(`${resultado.exitosos} productos sincronizados exitosamente`);
    }
    
    if (resultado.fallidos > 0) {
      this.showWarning(`${resultado.fallidos} productos fallaron en la sincronización`);
    }
  }

  getSeveridadColor(severidad: string): string {
    switch (severidad) {
      case 'HIGH': return 'danger';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'info';
      default: return 'secondary';
    }
  }

  getAlertIcon(tipo: string): string {
    switch (tipo) {
      case 'MARGEN_BAJO': return 'pi pi-exclamation-triangle';
      case 'STOCK_CRITICO': return 'pi pi-box';
      case 'OPORTUNIDAD_VENTA': return 'pi pi-chart-line';
      case 'PRECIO_COMPETENCIA': return 'pi pi-dollar';
      default: return 'pi pi-info-circle';
    }
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


  getProductoPorId(alertaProductoId: number): Producto | undefined {
    return this.productos.find(p => p.id === alertaProductoId);
  }

  verDetallesProductoPorId(alertaProductoId: number): void {
    const producto = this.getProductoPorId(alertaProductoId);
    if (producto) {
      this.verDetallesProducto(producto);
    }
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
    if (!this.selectedProductos || this.selectedProductos.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Selecciona productos para cambiar precios'
      });
      return;
    }

    // Mostrar confirmación simple
    this.confirmationService.confirm({
      message: `¿Deseas cambiar los precios de ${this.selectedProductos.length} productos?`,
      header: 'Cambiar Precios en Lote',
      icon: 'pi pi-dollar',
      accept: () => {
        // Por ahora, incrementar precios en 10%
        this.selectedProductos.forEach(producto => {
          if (producto.precioVenta) {
            producto.precioVenta = Math.round(producto.precioVenta * 1.1 * 100) / 100;
          }
        });

        // Aquí llamarías a tu servicio para actualizar
        this.messageService.add({
          severity: 'info',
          summary: 'Simulación',
          detail: 'Precios incrementados en 10% (simulación)'
        });
      }
    });
  }


  /**
   * 👇 Duplica productos seleccionados
   */
  duplicarProductos(): void {
    this.confirmationService.confirm({
      message: `¿Duplicar ${this.selectedProductos.length} productos?`,
      header: 'Confirmar Duplicación',
      icon: 'pi pi-copy',
      accept: () => {
          this.selectedProductos.forEach(producto => {
            const productosDuplicado = {
              ...producto,
              id: undefined, // Nuevo ID
              codigo: `${producto.codigo}_COPY`,
              nombre: `${producto.nombre} (Copia)`
            };
            
            this.productoService.createProduct(productosDuplicado).subscribe({
              next: () => {
                this.messageService.add({
                  severity: 'success',
                  summary: 'Éxito',
                  detail: 'Productos duplicados correctamente'
                });
                this.loadProductos();
              },
              error: () => {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: 'Error al duplicar productos'
                });
              }
            });
          });
        }
      });
    }

     /**
   * 🔄 Actualizar códigos automáticamente
   */
  actualizarCodigosLote(): void {
    if (!this.selectedProductos || this.selectedProductos.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Selecciona productos para actualizar códigos'
      });
      return;
    }

    this.confirmationService.confirm({
      message: `¿Actualizar códigos de ${this.selectedProductos.length} productos?`,
      header: 'Actualizar Códigos',
      icon: 'pi pi-refresh',
      accept: () => {
        const timestamp = Date.now();
        
        this.selectedProductos.forEach((producto, index) => {
          producto.codigo = `PROD_${timestamp}_${String(index + 1).padStart(3, '0')}`;
        });

        this.messageService.add({
          severity: 'info',
          summary: 'Simulación',
          detail: 'Códigos actualizados (simulación)'
        });
      }
    });
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
    // 🔍 Log 1: Verificar datos antes de enviar
    console.log('=== CREANDO PRODUCTO ===');
    console.log('Datos del producto a enviar:', this.producto);
    console.log('Tipo de datos:', typeof this.producto);
    console.log('JSON stringify:', JSON.stringify(this.producto));
    
    return this.productoService.createProduct(this.producto)
      .pipe(
        tap((response) => {
          // ✅ Log de éxito
          console.log('✅ Producto creado exitosamente:', response);
          console.log('Response completo:', JSON.stringify(response));
          this.producto.id = response.id;
        }),
        catchError((error) => {
          // ❌ Logs detallados de error
          console.error('❌ ERROR AL CREAR PRODUCTO:');
          console.error('Error completo:', error);
          console.error('Status:', error.status);
          console.error('Status Text:', error.statusText);
          console.error('Error message:', error.error);
          console.error('Error details:', error.error?.message);
          console.error('Error validation:', error.error?.errors);
          console.error('URL:', error.url);
          
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

  Math = Math; // Para usar Math en la plantilla

  calcularMargenGanancia(producto: Producto): number {
    if (!producto.precioCompra || !producto.precioVenta || producto.precioCompra === 0) {
      return 0;
    }
    
    const ganancia = producto.precioVenta - producto.precioCompra;
    const margen = (ganancia / producto.precioCompra) * 100;
    
    return Math.round(margen * 100) / 100; // Redondear a 2 decimales
  }

    /**
   * 🎨 Obtiene la severity del margen para el tag
   **/
  getMargenSeverity(margen: number): string {
    if (margen >= 40) return 'success';
    if (margen >= 25) return 'info';
    if (margen >= 15) return 'warning';
    return 'danger';
  }

   /**
   * 🌈 Obtiene la clase de color para la barra de progreso
   */
   getMargenColorClass(margen: number): string {
    if (margen >= 40) return 'bg-gradient-to-r from-emerald-500 to-green-600';
    if (margen >= 25) return 'bg-gradient-to-r from-blue-500 to-indigo-600';
    if (margen >= 15) return 'bg-gradient-to-r from-yellow-500 to-orange-600';
    return 'bg-gradient-to-r from-red-500 to-red-600';
  }


  /**
   * 🎨 Obtiene clase de color para el margen de ganancia
   */
  getProfitColorClass(margen: number): string {
    if (margen >= 40) return 'text-emerald-400';
    if (margen >= 25) return 'text-blue-400';
    if (margen >= 15) return 'text-yellow-400';
    return 'text-red-400';
  }

  /**
   * 💡 Obtiene clase CSS para el tip de rentabilidad
   */
  getProfitTipClass(margen: number): string {
    if (margen >= 40) return 'tip-excellent';
    if (margen >= 25) return 'tip-good';
    return 'tip-warning';
  }

    /**
   * 🏆 Obtiene título del tip de rentabilidad
   */
    getProfitTipTitle(margen: number): string {
      if (margen >= 40) return '¡Excelente Rentabilidad!';
      if (margen >= 25) return 'Buena Rentabilidad';
      if (margen >= 15) return 'Rentabilidad Aceptable';
      return 'Margen Bajo';
    }

    /**
   * 💬 Obtiene mensaje del tip de rentabilidad
   */
  getProfitTipMessage(margen: number): string {
    if (margen >= 40) return 'Este producto tiene un margen excelente para calzado deportivo';
    if (margen >= 25) return 'Margen competitivo para el mercado de zapatillas';
    if (margen >= 15) return 'Considera optimizar costos o ajustar precios';
    return 'Revisa la estrategia de precios para mejorar rentabilidad';
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
      genero: 'No especificado',
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


// Funciones adicionales para el componente

getCurrentTime(): Date {
  return new Date();
}

getMargenPromedio(): number {
  if (!this.productos?.length) return 0;
  const total = this.productos.reduce((sum, p) => sum + this.calcularMargenGanancia(p), 0);
  return total / this.productos.length;
}

getInventoryHealthPercentage(): number {
  if (!this.productos?.length) return 0;
  const productosConBuenMargen = this.productos.filter(p => this.calcularMargenGanancia(p) >= 20).length;
  return Math.round((productosConBuenMargen / this.productos.length) * 100);
}

getInventoryHealthColor(): string {
  const health = this.getInventoryHealthPercentage();
  if (health >= 70) return 'text-emerald-700';
  if (health >= 40) return 'text-orange-700';
  return 'text-red-700';
}

/**
   * 📝 Obtiene el texto descriptivo de rentabilidad
   */
getRentabilidadTexto(margen: number): string {
  if (margen >= 40) return 'Excelente';
  if (margen >= 25) return 'Bueno';
  if (margen >= 15) return 'Regular';
  if (margen > 0) return 'Bajo';
  return 'Sin ganancia';
}


selectedFiltro: string = 'todos'; // Variable para el modelo seleccionado

// Filtros rápidos (mantener como array de opciones)
filtrosRapidos = [
  { label: 'Todos los productos', value: 'todos' },
  { label: 'Alto margen (>50%)', value: 'alto_margen' },
  { label: 'Margen regular (20-50%)', value: 'margen_regular' },
  { label: 'Bajo margen (<20%)', value: 'bajo_margen' },
  { label: 'Productos premium', value: 'premium' },
  { label: 'Agregados hoy', value: 'nuevos' }
];

  
aplicarFiltroRapido(): void {
  // Implementar lógica de filtrado rápido
  switch (this.selectedFiltro) {
    case 'alto_margen':
      this.productosFiltrados = this.productos.filter(p => this.calcularMargenGanancia(p) > 50);
      break;
    case 'margen_regular':
      this.productosFiltrados = this.productos.filter(p => {
        const margen = this.calcularMargenGanancia(p);
        return margen >= 20 && margen <= 50;
      });
      break;
    case 'bajo_margen':
      this.productosFiltrados = this.productos.filter(p => this.calcularMargenGanancia(p) < 20);
      break;
    // ... más casos
    default:
      this.productosFiltrados = [...this.productos];
  }
}

duplicarProducto(producto: any): void {
  const productoDuplicado = {
    ...producto,
    id: undefined,
    codigo: `${producto.codigo}-COPY`,
    nombre: `${producto.nombre} (Copia)`,
    fechaCreacion: new Date(),
    fechaActualizacion: new Date()
  };
  this.producto = productoDuplicado;
  this.editMode = false;
  this.productoDialog = true;
}

importarProductos(): void {
  // Implementar lógica de importación
  this.messageService.add({
    severity: 'info',
    summary: 'Función disponible',
    detail: 'Funcionalidad de importación en desarrollo'
  });
}

abrirConfiguracion(): void {
  // Implementar panel de configuración
  this.messageService.add({
    severity: 'info',
    summary: 'Configuración',
    detail: 'Panel de configuración en desarrollo'
  });
}

toggleFiltrosAvanzados(): void {
  this.filtrosPanelCollapsed = !this.filtrosPanelCollapsed;
}

/**
 * Obtiene el número de categorías únicas
 */
getCategorias(): number {
  if (!this.productos || this.productos.length === 0) {
    return 0;
  }
  
  const categoriasUnicas = new Set(
    this.productos
      .filter(p => p.marca)
      .map(p => p.marca)
  );
  
  return categoriasUnicas.size;
}

/**
 * Obtiene el precio mínimo del catálogo
 */
getPrecioMinimo(): number {
  if (!this.productos || this.productos.length === 0) {
    return 0;
  }
  
  const precios = this.productos
    .filter(p => p.precioCompra && p.precioCompra > 0)
    .map(p => p.precioCompra);
    
  return precios.length > 0 ? Math.min(...precios) : 0;
}

/**
 * Obtiene el precio máximo del catálogo
 */
getPrecioMaximo(): number {
  if (!this.productos || this.productos.length === 0) {
    return 0;
  }
  
  const precios = this.productos
    .filter(p => p.precioVenta && p.precioVenta > 0)
    .map(p => p.precioVenta);
    
  return precios.length > 0 ? Math.max(...precios) : 0;
}

/**
 * Calcula el precio promedio del catálogo
 */
getPrecioPromedio(): number {
  if (!this.productos || this.productos.length === 0) {
    return 0;
  }
  
  const precios = this.productos
    .filter(p => p.precioVenta && p.precioVenta > 0)
    .map(p => p.precioVenta);
    
  if (precios.length === 0) return 0;
  
  const suma = precios.reduce((acc, precio) => acc + precio, 0);
  return suma / precios.length;
}

  /**
   * 🖼️ Mejora del manejo de imágenes con lazy loading
   */
  onImageLoad(event: any): void {
    // Opcional: animación cuando la imagen carga
    event.target.style.opacity = '1';
  }

   /**
   * 🎨 Obtiene la clase CSS para el margen según el valor
   */
   getMargenIconClass(margen: number): string {
    return margen > 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down';
  }

  /**
   * 📊 Información adicional para tooltips en cards
   */
  getProductoTooltip(producto: any): string {
    const margen = this.calcularMargenGanancia(producto);
    const ganancia = producto.precioVenta - producto.precioCompra;
    
    return `
      Margen: ${margen.toFixed(1)}%
      Ganancia: ${this.currencyPipe.transform(ganancia, 'S/. ', 'symbol', '1.2-2')}
      Categoría: ${producto.categoria || 'Sin categoría'}
    `;
  }

    /**
   * 📱 Detecta si estamos en vista móvil para optimizar cards
   */
    get isMobileView(): boolean {
      return window.innerWidth < 768;
    }
  
    /**
     * 🔢 Obtiene el número de columnas según el tamaño de pantalla
     */
    getGridColumns(): number {
      const width = window.innerWidth;
      if (width < 576) return 1;      // xs
      if (width < 768) return 2;      // sm
      if (width < 992) return 3;      // md
      if (width < 1200) return 4;     // lg
      return 4;                       // xl+
    }

      /**
   * 🏷️ Obtiene la etiqueta del género
   */
  getGeneroLabel(genero: string): string {
    const generos: Record<string, string> = {
      'hombre': 'Hombre',
      'mujer': 'Mujer',
      'nino': 'Niño',
      'nina': 'Niña',
      'unisex': 'Unisex'
    };
    return generos[genero] || genero;
  }

  /**
   * 👟 Obtiene la etiqueta del tipo de calzado
   */
  getTipoCalzadoLabel(tipo: string): string {
    const tipos: Record<string, string> = {
      'zapatillas_deportivas': 'Zapatillas Deportivas',
      'zapatillas_casual': 'Zapatillas Casual',
      'zapatos_formales': 'Zapatos Formales',
      'botines': 'Botines',
      'botas': 'Botas',
      'sandalias': 'Sandalias',
      'chinelas': 'Chinelas',
      'zapatos_seguridad': 'Zapatos de Seguridad',
      'zapatos_vestir': 'Zapatos de Vestir',
      'otros': 'Otros'
    };
    return tipos[tipo] || tipo;
  }

   
  /**
   * 🏆 Obtiene clase para badge de margen
   */
  getMargenBadgeClass(margen: number): string {
    if (margen >= 40) return 'badge-excellent';
    if (margen >= 25) return 'badge-good';
    if (margen >= 15) return 'badge-warning';
    return 'badge-poor';
  }

  /**
   * 📊 Obtiene clase para progreso de margen
   */
  getMargenProgressClass(margen: number): string {
    if (margen >= 40) return 'progress-excellent';
    if (margen >= 25) return 'progress-good';
    if (margen >= 15) return 'progress-warning';
    return 'progress-poor';
  }

  /**
   * 🏷️ Obtiene etiqueta del margen
   */
  getMargenLabel(margen: number): string {
    if (margen >= 40) return 'Excelente';
    if (margen >= 25) return 'Bueno';
    if (margen >= 15) return 'Regular';
    return 'Bajo';
  }

}
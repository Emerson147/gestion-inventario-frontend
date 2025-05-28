import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Cliente } from '../../../core/models/cliente.model';
import { VentaRequest, VentaDetalleRequest, VentaResponse } from '../../../core/models/venta.model';
import { PagoRequest, PagoResponse } from '../../../core/models/pago.model';
import { Inventario } from '../../../core/models/inventario.model';
import { ClienteService } from '../../../core/services/clientes.service';
import { VentasService } from '../../../core/services/ventas.service';
import { PagosService } from '../../../core/services/pagos.service';
import { InventarioService } from '../../../core/services/inventario.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { trigger, transition, style, animate, state, query, stagger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputMaskModule } from 'primeng/inputmask';
import { StepsModule } from 'primeng/steps';
import { PanelModule } from 'primeng/panel';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SkeletonModule } from 'primeng/skeleton';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';

interface OpcionSelect {
  label: string;
  value: string;
}

@Component({
  selector: 'app-realizar-venta',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    ConfirmDialogModule,
    InputTextModule,
    TableModule,
    TagModule,
    TextareaModule,
    ToastModule,
    AutoCompleteModule,
    DropdownModule,
    InputNumberModule,
    InputMaskModule,
    StepsModule,
    PanelModule,
    ProgressSpinnerModule,
    SkeletonModule,
    InputGroupModule,
    InputGroupAddonModule
  ],
  templateUrl: './realizar-venta.component.html',
  styleUrls: ['./realizar-venta.component.scss'],
  providers: [MessageService, ConfirmationService],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms cubic-bezier(.4,0,.2,1)', style({ opacity: 0, transform: 'translateY(20px)' }))
      ])
    ]),
    trigger('listAnimation', [
      transition('* <=> *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(-10px)' }),
          stagger('50ms', [
            animate('300ms cubic-bezier(.4,0,.2,1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true }),
        query(':leave', [
          animate('200ms', style({ opacity: 0, transform: 'scale(0.95)' }))
        ], { optional: true })
      ])
    ])
  ]
})
export class RealizarVentaComponent implements OnInit {

  ventaForm: FormGroup;
  pagoForm: FormGroup;
  detalleForm: FormGroup;
  clientes: Cliente[] = [];
  usuarioId = 1;
  detalles: VentaDetalleRequest[] = [];
  ventaRegistrada: VentaResponse | null = null;
  inventarios: Inventario[] = [];
  pagos: PagoResponse[] = [];
  isLoading = false;
  isLoadingClientes = false;
  isLoadingInventario = false;
  isLoadingInitialData = false;
  currentStep = 0;
  mostrarPanelPago = false;

  isLoadingPago: boolean = false;

  metodosPago: OpcionSelect[] = [
    { label: 'Efectivo', value: 'EFECTIVO' },
    { label: 'Tarj. Crédito', value: 'TARJETA_CREDITO' },
    { label: 'Tarj. Débito', value: 'TARJETA_DEBITO' },
    { label: 'Transferencia', value: 'TRANSFERENCIA' },
    { label: 'Yape', value: 'YAPE' },
    { label: 'Plin', value: 'PLIN' },
    { label: 'Otros', value: 'OTROS' }
  ];

  tiposComprobante: OpcionSelect[] = [
    { label: 'Factura', value: 'FACTURA' },
    { label: 'Boleta', value: 'BOLETA' },
    { label: 'Nota de Venta', value: 'NOTA_VENTA' },
    { label: 'Ticket', value: 'TICKET' }
  ];
isAddingProduct: unknown;

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private inventarioService: InventarioService,
    private ventaService: VentasService,
    private pagoService: PagosService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.ventaForm = this.fb.group({
      cliente: [null, Validators.required],
      tipoComprobante: ['FACTURA', Validators.required],
      serieComprobante: ['F001', [Validators.required, Validators.maxLength(4)]],
      numeroComprobante: [null],
      observaciones: ['']
    });

    this.pagoForm = this.fb.group({
      monto: [0, [Validators.required, Validators.min(0.01)]],
      metodoPago: ['EFECTIVO', Validators.required],
      nombreTarjeta: [''],
      ultimos4Digitos: ['', Validators.pattern(/^\d{4}$/)],
      numeroReferencia: [''],
      observaciones: ['']
    });

    this.detalleForm = this.fb.group({
      inventario: [null, Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit() {
    this.isLoadingInitialData = true;
    this.cargarDatos().finally(() => this.isLoadingInitialData = false);
    this.ventaForm.valueChanges.subscribe(() => this.updateStep());
    this.detalleForm.valueChanges.subscribe(() => this.updateStep());
  }

  async cargarDatos() {
    await Promise.all([this.cargarClientes(), this.cargarInventario()]);
  }

  cargarClientes(event?: any): Promise<void> {
    this.isLoadingClientes = true;
    const query = event?.query || '';
    return new Promise((resolve) => {
      this.clienteService.listar().subscribe({
        next: (data) => {
          this.clientes = data.filter(c =>
            c.nombres.toLowerCase().includes(query.toLowerCase()) ||
            (c.dni || '').includes(query)
          );
          this.isLoadingClientes = false;
          resolve();
        },
        error: (err) => {
          this.mostrarError('No se pudieron cargar los clientes', err);
          this.isLoadingClientes = false;
          resolve();
        }
      });
    });
  }

  cargarInventario(event?: any): Promise<void> {
    this.isLoadingInventario = true;
    const query = event?.query || '';
    return new Promise((resolve) => {
      this.inventarioService.obtenerInventarios().subscribe({
        next: (response) => {
          const inventarios = response.contenido || response;
          this.inventarios = inventarios.filter(i =>
            i.producto?.nombre.toLowerCase().includes(query.toLowerCase())
          );
          this.isLoadingInventario = false;
          resolve();
        },
        error: (err) => {
          this.mostrarError('No se pudo cargar el inventario', err);
          this.isLoadingInventario = false;
          resolve();
        }
      });
    });
  }

  updateStep() {
    if (this.ventaRegistrada) {
      this.currentStep = 3;
    } else if (this.detalles.length > 0) {
      this.currentStep = 2;
    } else if (this.ventaForm.get('cliente')?.value) {
      this.currentStep = 1;
    } else {
      this.currentStep = 0;
    }
  }

  togglePanelPago() {
    this.mostrarPanelPago = !this.mostrarPanelPago;
  }

  onMetodoPagoChange() {
    const metodo = this.pagoForm.get('metodoPago')?.value;
    if (metodo === 'TARJETA_CREDITO' || metodo === 'TARJETA_DEBITO') {
      this.pagoForm.get('nombreTarjeta')?.setValidators([Validators.required]);
      this.pagoForm.get('ultimos4Digitos')?.setValidators([Validators.required, Validators.pattern(/^\d{4}$/)]);
    } else {
      this.pagoForm.get('nombreTarjeta')?.clearValidators();
      this.pagoForm.get('ultimos4Digitos')?.clearValidators();
    }
    this.pagoForm.get('nombreTarjeta')?.updateValueAndValidity();
    this.pagoForm.get('ultimos4Digitos')?.updateValueAndValidity();
  }

  agregarDetalle() {
    if (this.detalleForm.invalid) {
      this.messageService.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Selecciona un producto y cantidad válida' });
      return;
    }
    const inventario = this.detalleForm.get('inventario')?.value;
    const cantidad = this.detalleForm.get('cantidad')?.value;
    if (this.detalles.some(d => d.inventarioId === inventario.id)) {
      this.messageService.add({ severity: 'warn', summary: 'Ya agregado', detail: 'Este producto ya está en la venta' });
      return;
    }
    if (inventario.cantidad < cantidad) {
      this.messageService.add({ severity: 'error', summary: 'Sin stock suficiente', detail: `Solo hay ${inventario.cantidad} unidades disponibles` });
      return;
    }
    this.detalles.push({
      inventarioId: inventario.id,
      cantidad: cantidad
    });
    this.messageService.add({ severity: 'success', summary: 'Producto agregado', detail: `${inventario.producto.nombre} añadido` });
    this.detalleForm.reset({ inventario: null, cantidad: 1 });
    this.updateStep();
  }

  quitarDetalle(idx: number) {
    if (idx >= 0 && idx < this.detalles.length) {
      const detalle = this.detalles[idx];
      const nombreProducto = this.getProductoNombrePorInventarioId(detalle.inventarioId);
      this.detalles.splice(idx, 1);
      this.messageService.add({ severity: 'info', summary: 'Producto eliminado', detail: `Se eliminó "${nombreProducto}" de la venta` });
      this.updateStep();
    }
  }

  registrarVenta() {
    if (this.ventaForm.invalid || !this.detalles.length) {
      this.messageService.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Completa todos los campos requeridos' });
      return;
    }
    this.isLoading = true;
    const venta: VentaRequest = {
      clienteId: this.ventaForm.value.cliente.id,
      usuarioId: this.usuarioId,
      tipoComprobante: this.ventaForm.value.tipoComprobante,
      serieComprobante: this.ventaForm.value.serieComprobante,
      numeroComprobante: this.ventaForm.value.numeroComprobante,
      observaciones: this.ventaForm.value.observaciones,
      detalles: this.detalles
    };
    this.ventaService.registrarVenta(venta).subscribe({
      next: (resp) => {
        this.ventaRegistrada = resp;
        this.messageService.add({ severity: 'success', summary: 'Venta registrada', detail: `N° Venta: ${resp.numeroVenta}` });
        this.isLoading = false;
        this.updateStep();
        this.pagoForm.patchValue({ monto: this.calcularSaldoPendiente() });
      },
      error: (err) => {
        this.mostrarError('Ocurrió un error al registrar la venta', err);
        this.isLoading = false;
      }
    });
  }

  registrarPago() {
    if (this.pagoForm.invalid) {
      this.messageService.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Completa los campos requeridos del pago' });
      return;
    }
    this.isLoading = true;
    const pago: PagoRequest = {
      ventaId: this.ventaRegistrada!.id,
      usuarioId: this.usuarioId,
      monto: this.pagoForm.value.monto,
      metodoPago: this.pagoForm.value.metodoPago,
      numeroReferencia: this.pagoForm.value.numeroReferencia || undefined,
      nombreTarjeta: this.pagoForm.value.nombreTarjeta || undefined,
      ultimos4Digitos: this.pagoForm.value.ultimos4Digitos || undefined,
      observaciones: this.pagoForm.value.observaciones || undefined
    };
    this.pagoService.registrarPago(pago).subscribe({
      next: (resp) => {
        this.pagos.push(resp);
        this.messageService.add({ severity: 'success', summary: 'Pago registrado', detail: `Monto: S/ ${resp.monto.toFixed(2)}` });
        this.pagoForm.reset({ metodoPago: 'EFECTIVO', monto: this.calcularSaldoPendiente() });
        this.isLoading = false;
        if (this.calcularSaldoPendiente() <= 0) {
          this.mostrarPanelPago = false;
        }
      },
      error: (err) => {
        this.mostrarError('Ocurrió un error al registrar el pago', err);
        this.isLoading = false;
      }
    });
  }

  confirmarLimpiarVenta() {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que deseas limpiar el formulario?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.limpiarVenta();
      }
    });
  }

  limpiarVenta() {
    this.ventaForm.reset({
      tipoComprobante: 'FACTURA',
      serieComprobante: 'F001',
      observaciones: ''
    });
    this.detalleForm.reset({ inventario: null, cantidad: 1 });
    this.detalles = [];
    this.ventaRegistrada = null;
    this.pagos = [];
    this.mostrarPanelPago = false;
    this.messageService.add({ severity: 'info', summary: 'Limpiado', detail: 'Se ha limpiado el formulario' });
    this.updateStep();
  }

  calcularTotalEstimado(): number {
    return this.detalles.reduce((total, detalle) => {
      const precio = this.getPrecioPorInventarioId(detalle.inventarioId);
      return total + (precio * detalle.cantidad);
    }, 0);
  }

  calcularTotalPagado(): number {
    return this.pagos.reduce((total, pago) => total + pago.monto, 0);
  }

  calcularSaldoPendiente(): number {
    return (this.ventaRegistrada?.total || 0) - this.calcularTotalPagado();
  }

  getProductoNombrePorInventarioId(inventarioId: number): string {
    const inventario = this.inventarios.find(i => i.id === inventarioId);
    return inventario?.producto?.nombre || 'Producto no encontrado';
  }

  getColorPorInventarioId(inventarioId: number): string {
    const inventario = this.inventarios.find(i => i.id === inventarioId);
    return inventario?.color?.nombre || '';
  }

  getTallaPorInventarioId(inventarioId: number): string {
    const inventario = this.inventarios.find(i => i.id === inventarioId);
    return inventario?.talla?.numero || '';
  }

  getPrecioPorInventarioId(inventarioId: number): number {
    const inventario = this.inventarios.find(i => i.id === inventarioId);
    return inventario?.producto?.precioCompra || 0;
  }

  imprimirComprobante() {
    this.messageService.add({ severity: 'info', summary: 'Imprimiendo', detail: 'Generando comprobante...' });
  }

  finalizarVenta() {
    this.messageService.add({ severity: 'success', summary: 'Venta finalizada', detail: 'La venta ha sido completada' });
  }

  mostrarError(mensaje: string, error: any) {
    console.error('Error:', error);
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: error?.error?.mensaje || error?.message || mensaje
    });
  }



  iniciarNuevaVenta() {
  // Reset the form and state to start a new sale
  this.ventaRegistrada = null;
  this.detalles = [];
  this.pagos = [];
  this.mostrarPanelPago = false;
  this.currentStep = 0;
  
  // Reset forms
  this.ventaForm.reset();
  this.detalleForm.reset();
  this.pagoForm.reset();
  
  // Initialize with default values if needed
  this.ventaForm.patchValue({
    tipoComprobante: this.tiposComprobante[0]?.value || 'BOLETA',
    serieComprobante: 'B001'
  });
}

  getProductoImagen(inventarioId: number): string | undefined {
    const inv = this.inventarios?.find(i => i.id === inventarioId);
    return inv?.producto?.imagen || undefined;
  }

  getPrecioUnitario(inventarioId: number): number {
    const inv = this.inventarios?.find(i => i.id === inventarioId);
    return inv?.producto?.precioCompra || 0;
  }

  calcularSubtotalPorDetalle(detalle: any): number {
    return (detalle.cantidad || 0) * this.getPrecioUnitario(detalle.inventarioId);
  }

  getMaxCantidadParaDetalleEnTabla(inventarioId: number): number {
    // Prioriza cantidadDisponible si existe, si no, usa cantidad, si no, 999
    const inv = this.inventarios?.find(i => i.id === inventarioId);
    return inv?.cantidad ?? inv?.cantidad ?? 999;
  }

  actualizarCantidadEnTabla(detalle: any, i: number, event: any) {
    // Puedes poner lógica para validar y ajustar cantidad aquí si necesitas
    if (detalle.cantidad < 1) detalle.cantidad = 1;
    if (detalle.cantidad > this.getMaxCantidadParaDetalleEnTabla(detalle.inventarioId)) {
      detalle.cantidad = this.getMaxCantidadParaDetalleEnTabla(detalle.inventarioId);
    }
  }

  getMetodoPagoLabel(metodo: string): string {
    // Si tienes un array metodosPago con {label, value}
    const found = this.metodosPago.find(m => m.value === metodo);
    return found?.label || metodo;
  }

  onImgError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.src = 'assets/images/girl.jpg'; // Ruta de la imagen por defecto
  }
}
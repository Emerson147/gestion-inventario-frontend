// ✅ IMPORTS DE ANGULAR CORE
import { Component, OnInit, OnDestroy, ViewChild, inject, ElementRef } from '@angular/core';
import { Subject, takeUntil, interval } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// ✅ IMPORTS DE PRIMENG UI
import { MessageService, ConfirmationService } from 'primeng/api';
import { MenuItem } from 'primeng/api';
import { TableLazyLoadEvent } from 'primeng/table';

// ✅ IMPORTS DE PRIMENG COMPONENTS
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule, ButtonSeverity } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { CalendarModule } from 'primeng/calendar';
import { SliderModule } from 'primeng/slider';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { PanelModule } from 'primeng/panel';
import { AccordionModule } from 'primeng/accordion';
import { TabViewModule } from 'primeng/tabview';
import { SplitterModule } from 'primeng/splitter';
import { ChartModule } from 'primeng/chart';
import { ProgressBarModule } from 'primeng/progressbar';
import { ChipModule } from 'primeng/chip';
import { BadgeModule } from 'primeng/badge';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SpeedDialModule } from 'primeng/speeddial';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';

// ✅ IMPORTS DE SERVICIOS (crear estos servicios)
// import { ReportesService } from '../services/reportes.service';
import { ClienteService } from '../../../../../core/services/clientes.service';
import { VentasService } from '../../../../../core/services/ventas.service';
// import { IAService } from '../services/ia.service';

// ✅ INTERFACES EMPRESARIALES
interface KPIData {
  ventasTotales: number;
  numeroTransacciones: number;
  clientesUnicos: number;
  ticketPromedio: number;
  crecimientoVentas: number;
  crecimientoTransacciones: number;
  crecimientoClientes: number;
  crecimientoTicket: number;
  metaMensual: number;
}

interface TopProducto {
  id: number;
  nombre: string;
  categoria: string;
  totalVentas: number;
  cantidadVendida: number;
  porcentaje: number;
}

interface TopVendedor {
  id: number;
  nombre: string;
  iniciales: string;
  sucursal: string;
  totalVentas: number;
  comision: number;
  porcentajeMeta: number;
  numeroVentas: number;
}

interface TopCliente {
  id: number;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  segmento: 'premium' | 'frecuente' | 'ocasional';
  totalCompras: number;
  numeroCompras: number;
  ultimaCompra: Date;
  fechaRegistro: Date;
}

interface TipoReporte {
  tipo: string;
  titulo: string;
  descripcion: string;
  formato: string;
  icono: string;
  iconoAccion: string;
  clase: string;
  severidad: ButtonSeverity;
  generando: boolean;
  progreso: number;
}

interface HistorialReporte {
  id: number;
  fecha: Date;
  tipo: string;
  estado: 'COMPLETADO' | 'GENERANDO' | 'ERROR' | 'CANCELADO';
  archivo: string;
  tamaño: number;
  icon: string;
}

interface PrediccionIA {
  proximaSemana: number;
  proximoMes: number;
  confianza: number;
  tendencia: 'ascendente' | 'descendente' | 'estable';
}

interface CompraCliente {
  fecha: Date;
  producto: string;
  cantidad: number;
  total: number;
  vendedor: string;
}

interface Sucursal {
  id: number;
  nombre: string;
}

interface Vendedor {
  id: number;
  nombre: string;
}

interface Categoria {
  id: number;
  nombre: string;
}

interface Periodo {
  label: string;
  value: string;
}

interface TipoGrafico {
  label: string;
  value: string;
}

interface AlgoritmoIA {
  label: string;
  value: string;
}

interface VentanaTiempo {
  label: string;
  value: string;
}

interface VariablePredictiva {
  label: string;
  value: string;
}

interface MetodoPago {
  nombre: string;
  porcentaje: number;
  color: string;
}

// ✅ INTERFACES PARA GRÁFICOS
interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

interface ChartDataset {
  label?: string;
  data: number[];
  fill?: boolean;
  borderColor?: string;
  backgroundColor?: string | string[];
  tension?: number;
  borderWidth?: number;
  borderDash?: number[];
  hoverBackgroundColor?: string[];
}

interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins?: {
    legend?: {
      position?: string;
      display?: boolean;
    };
    title?: {
      display: boolean;
      text: string;
    };
  };
  scales?: {
    y?: {
      beginAtZero: boolean;
      ticks?: {
        callback?: (value: number) => string;
      };
    };
  };
}

// ✅ CONFIGURACIÓN DEL COMPONENTE
@Component({
  selector: 'app-reporte-ventas',
  standalone: true, // Si usas standalone components
  imports: [
    // Angular Common
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    
    // PrimeNG Modules
    TableModule,
    CardModule,
    ButtonModule,
    DropdownModule,
    MultiSelectModule,
    CalendarModule,
    SliderModule,
    InputNumberModule,
    InputTextModule,
    PanelModule,
    AccordionModule,
    TabViewModule,
    SplitterModule,
    ChartModule,
    ProgressBarModule,
    ChipModule,
    BadgeModule,
    TagModule,
    AvatarModule,
    TooltipModule,
    SelectButtonModule,
    SpeedDialModule,
    DialogModule,
    ConfirmDialogModule,
    ToastModule
  ],
  templateUrl: './reporte-ventas.component.html',
  styleUrls: ['./reporte-ventas.component.scss'],
  providers: [
    MessageService,
    ConfirmationService
  ]
})
export class ReportesComponent implements OnInit, OnDestroy {

  // ✅ VIEW CHILD REFERENCES
  @ViewChild('tablaUsuarios') tablaUsuarios!: ElementRef;
  @ViewChild('graficoVentas') graficoVentas!: ElementRef;

  // ✅ DATOS DEL SISTEMA
  currentUser = 'Emerson147';
  currentDateTime = '2025-06-06 04:07:19';
  tabActivo = 0;

  // ✅ ESTADOS DE CARGA
  aplicandoFiltros = false;
  cargandoHistorial = false;
  entrenandoModelo = false;
  generandoPrediccion = false;

  // ✅ FILTROS Y CONFIGURACIÓN
  periodoSeleccionado = 'mes_actual';
  rangoFechas: Date[] = [];
  sucursalesSeleccionadas: number[] = [];
  vendedoresSeleccionados: number[] = [];
  categoriasSeleccionadas: number[] = [];
  rangoMontos: number[] = [0, 50000];
  minimoTransacciones = 1;

  // ✅ DATOS PARA DROPDOWNS
  periodos: Periodo[] = [
    { label: 'Hoy', value: 'hoy' },
    { label: 'Ayer', value: 'ayer' },
    { label: 'Esta Semana', value: 'semana_actual' },
    { label: 'Semana Pasada', value: 'semana_anterior' },
    { label: 'Este Mes', value: 'mes_actual' },
    { label: 'Mes Pasado', value: 'mes_anterior' },
    { label: 'Este Año', value: 'año_actual' },
    { label: 'Personalizado', value: 'personalizado' }
  ];

  sucursales: Sucursal[] = [
    { id: 1, nombre: 'Sucursal Principal - Lima Centro' },
    { id: 2, nombre: 'Sucursal Norte - Los Olivos' },
    { id: 3, nombre: 'Sucursal Sur - Villa El Salvador' },
    { id: 4, nombre: 'Sucursal Este - San Juan de Lurigancho' }
  ];

  vendedores: Vendedor[] = [
    { id: 1, nombre: 'María García López' },
    { id: 2, nombre: 'Carlos Roberto Silva' },
    { id: 3, nombre: 'Ana Sofía Mendoza' },
    { id: 4, nombre: 'Luis Fernando Torres' },
    { id: 5, nombre: 'Patricia Yolanda Cruz' },
    { id: 6, nombre: 'Roberto Carlos Díaz' }
  ];

  categorias: Categoria[] = [
    { id: 1, nombre: 'Electrónicos' },
    { id: 2, nombre: 'Ropa y Accesorios' },
    { id: 3, nombre: 'Hogar y Decoración' },
    { id: 4, nombre: 'Deportes y Fitness' },
    { id: 5, nombre: 'Libros y Educación' },
    { id: 6, nombre: 'Salud y Belleza' }
  ];

  // ✅ KPIs PRINCIPALES
  kpis: KPIData = {
    ventasTotales: 458750,
    numeroTransacciones: 2847,
    clientesUnicos: 1456,
    ticketPromedio: 161.2,
    crecimientoVentas: 12.5,
    crecimientoTransacciones: 8.3,
    crecimientoClientes: 15.7,
    crecimientoTicket: 4.2,
    metaMensual: 500000
  };

  progresoMeta = 91.75;

  // ✅ GRÁFICOS DE VENTAS - CON TIPOS ESPECÍFICOS
  tipoGraficoVentas = 'line';
  tiposGrafico: TipoGrafico[] = [
    { label: 'Línea', value: 'line' },
    { label: 'Barras', value: 'bar' },
    { label: 'Área', value: 'area' }
  ];

  datosGraficoVentas: ChartData = {
    labels: [],
    datasets: []
  };
  opcionesGraficoVentas: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false
  };
  datosGraficoMetodosPago: ChartData = {
    labels: [],
    datasets: []
  };
  resumenMetodosPago: MetodoPago[] = [];
  opcionesGraficoCircular: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false
  };

  // ✅ TOP DATA
  topProductos: TopProducto[] = [];
  topVendedores: TopVendedor[] = [];
  topClientes: TopCliente[] = [];

  // ✅ GRÁFICOS ADICIONALES - CON TIPOS ESPECÍFICOS
  datosGraficoVendedores: ChartData = {
    labels: [],
    datasets: []
  };
  opcionesGraficoBarras: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false
  };
  datosSegmentosClientes: ChartData = {
    labels: [],
    datasets: []
  };
  datosFrecuenciaCompras: ChartData = {
    labels: [],
    datasets: []
  };

  // ✅ TIPOS DE REPORTES
  tiposReportes: TipoReporte[] = [];
  historialReportes: HistorialReporte[] = [];

  // ✅ INTELIGENCIA ARTIFICIAL
  algoritmoIA = 'random_forest';
  ventanaTiempo = '30_dias';
  variablesPredictivas: string[] = ['ventas', 'clientes', 'estacionalidad'];

  algoritmosIA: AlgoritmoIA[] = [
    { label: 'Random Forest', value: 'random_forest' },
    { label: 'Neural Network', value: 'neural_network' },
    { label: 'Linear Regression', value: 'linear_regression' },
    { label: 'XGBoost', value: 'xgboost' }
  ];

  ventanasTiempo: VentanaTiempo[] = [
    { label: '7 días', value: '7_dias' },
    { label: '15 días', value: '15_dias' },
    { label: '30 días', value: '30_dias' },
    { label: '60 días', value: '60_dias' },
    { label: '90 días', value: '90_dias' }
  ];

  variablesDisponibles: VariablePredictiva[] = [
    { label: 'Ventas Históricas', value: 'ventas' },
    { label: 'Número de Clientes', value: 'clientes' },
    { label: 'Estacionalidad', value: 'estacionalidad' },
    { label: 'Inventario', value: 'inventario' },
    { label: 'Marketing', value: 'marketing' },
    { label: 'Competencia', value: 'competencia' }
  ];

  predicciones: PrediccionIA = {
    proximaSemana: 8.5,
    proximoMes: 12.3,
    confianza: 87.4,
    tendencia: 'ascendente'
  };

  datosPredicciones: ChartData = {
    labels: [],
    datasets: []
  };
  opcionesGraficoPredicciones: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false
  };

  // ✅ MENÚ FLOTANTE
  menuFlotante: MenuItem[] = [];

  // ✅ ESTADOS DE DIÁLOGOS
  mostrarDetalles = false;
  tituloDetalle = '';
  tipoDetalle = '';
  clienteSeleccionado: TopCliente | null = null;
  historialComprasCliente: CompraCliente[] = [];

  // ✅ SUBJECT PARA DESTRUCCIÓN
  private destroy$ = new Subject<void>();

  // ✅ CONSTRUCTOR CON SERVICIOS
  private messageService: MessageService = inject(MessageService);
  private confirmationService: ConfirmationService = inject(ConfirmationService);
  // private reportesService: ReportesService,
  private clientesService: ClienteService = inject(ClienteService);
  private ventasService: VentasService = inject(VentasService);
  // private iaService: IAService

  constructor() {
    console.log('🚀 Construyendo ReportesEmpresarialComponent...');
    console.log('👤 Usuario actual:', this.currentUser);
    console.log('📅 Fecha/Hora UTC:', this.currentDateTime);
  }

  ngOnInit(): void {
    console.log('📊 Inicializando Dashboard de Reportes Empresariales...');
    console.log('👤 Usuario actual:', this.currentUser);
    console.log('📅 Fecha actual (UTC):', this.currentDateTime);
    
    this.inicializarComponente();
    this.configurarReloj();
    this.cargarDatosIniciales();
    this.inicializarFiltros();
    this.inicializarGraficos();
    this.inicializarMenuFlotante();
  }

  ngOnDestroy(): void {
    console.log('🔄 Destruyendo componente...');
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ✅ MÉTODOS DE INICIALIZACIÓNget
  private inicializarComponente(): void {
    this.currentUser = 'Emerson147';
    this.tabActivo = 0;
    this.calcularProgresoMeta();
    this.inicializarTiposReportes();
    this.inicializarHistorialReportes();
  }

  private inicializarTiposReportes(): void {
    this.tiposReportes = [
      {
        tipo: 'excel',
        titulo: 'Excel Detallado',
        descripcion: 'Reporte completo con todos los datos en formato Excel',
        formato: 'XLSX',
        icono: 'pi pi-file-excel',
        iconoAccion: 'pi pi-download',
        clase: 'excel-card',
        severidad: 'success',
        generando: false,
        progreso: 0
      },
      {
        tipo: 'pdf',
        titulo: 'PDF Ejecutivo',
        descripcion: 'Resumen ejecutivo con gráficos y métricas principales',
        formato: 'PDF',
        icono: 'pi pi-file-pdf',
        iconoAccion: 'pi pi-download',
        clase: 'pdf-card',
        severidad: 'danger',
        generando: false,
        progreso: 0
      },
      {
        tipo: 'powerpoint',
        titulo: 'PowerPoint',
        descripcion: 'Presentación para directorio con slides interactivos',
        formato: 'PPTX',
        icono: 'pi pi-file',
        iconoAccion: 'pi pi-download',
        clase: 'ppt-card',
        severidad: 'danger',
        generando: false,
        progreso: 0
      },
      {
        tipo: 'csv',
        titulo: 'CSV Datos',
        descripcion: 'Datos en bruto para análisis avanzado',
        formato: 'CSV',
        icono: 'pi pi-database',
        iconoAccion: 'pi pi-download',
        clase: 'csv-card',
        severidad: 'info',
        generando: false,
        progreso: 0
      }
    ];
  }

  private inicializarHistorialReportes(): void {
    this.historialReportes = [
      {
        id: 1,
        fecha: new Date('2025-06-05 14:30:00'),
        tipo: 'Excel Detallado',
        estado: 'COMPLETADO',
        archivo: 'reporte_ventas_202506051430.xlsx',
        tamaño: 2.4,
        icon: 'pi pi-file-excel'
      },
      {
        id: 2,
        fecha: new Date('2025-06-05 10:15:00'),
        tipo: 'PDF Ejecutivo',
        estado: 'COMPLETADO',
        archivo: 'resumen_ejecutivo_202506051015.pdf',
        tamaño: 1.8,
        icon: 'pi pi-file-pdf'
      },
      {
        id: 3,
        fecha: new Date('2025-06-04 16:45:00'),
        tipo: 'PowerPoint',
        estado: 'COMPLETADO',
        archivo: 'presentacion_directorio_202506041645.pptx',
        tamaño: 5.2,
        icon: 'pi pi-file'
      }
    ];
  }

  private inicializarMenuFlotante(): void {
    this.menuFlotante = [
      {
        tooltipOptions: { tooltipLabel: 'Exportar Dashboard' },
        icon: 'pi pi-download',
        command: () => this.exportarDashboard()
      },
      {
        tooltipOptions: { tooltipLabel: 'Actualizar Datos' },
        icon: 'pi pi-refresh',
        command: () => this.actualizarDatos()
      },
      {
        tooltipOptions: { tooltipLabel: 'Configuración' },
        icon: 'pi pi-cog',
        command: () => this.abrirConfiguracion()
      },
      {
        tooltipOptions: { tooltipLabel: 'Ayuda' },
        icon: 'pi pi-question-circle',
        command: () => this.mostrarAyuda()
      }
    ];
  }

  private configurarReloj(): void {
    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentDateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
      });
  }

  private cargarDatosIniciales(): void {
    console.log('📊 Cargando datos empresariales...');
    this.cargarTopProductos();
    this.cargarTopVendedores();
    this.cargarTopClientes();
    this.actualizarGraficos();
    this.calcularMetricas();
  }

  private cargarTopProductos(): void {
    this.topProductos = [
      {
        id: 1,
        nombre: 'Smartphone Samsung Galaxy S24',
        categoria: 'Electrónicos',
        totalVentas: 125750,
        cantidadVendida: 187,
        porcentaje: 27.4
      },
      {
        id: 2,
        nombre: 'Laptop HP Pavilion 15',
        categoria: 'Electrónicos', 
        totalVentas: 98420,
        cantidadVendida: 142,
        porcentaje: 21.5
      },
      {
        id: 3,
        nombre: 'Zapatillas Nike Air Max',
        categoria: 'Deportes',
        totalVentas: 67890,
        cantidadVendida: 234,
        porcentaje: 14.8
      },
      {
        id: 4,
        nombre: 'Auriculares Sony WH-1000XM5',
        categoria: 'Electrónicos',
        totalVentas: 45320,
        cantidadVendida: 156,
        porcentaje: 9.9
      },
      {
        id: 5,
        nombre: 'Reloj Apple Watch Series 9',
        categoria: 'Electrónicos',
        totalVentas: 38950,
        cantidadVendida: 89,
        porcentaje: 8.5
      }
    ];
  }

  private cargarTopVendedores(): void {
    this.topVendedores = [
      {
        id: 1,
        nombre: 'María García López',
        iniciales: 'MG',
        sucursal: 'Principal',
        totalVentas: 145750,
        comision: 7287,
        porcentajeMeta: 145.8,
        numeroVentas: 287
      },
      {
        id: 2,
        nombre: 'Carlos Roberto Silva',
        iniciales: 'CS',
        sucursal: 'Norte',
        totalVentas: 132450,
        comision: 6622,
        porcentajeMeta: 132.5,
        numeroVentas: 251
      },
      {
        id: 3,
        nombre: 'Ana Sofía Mendoza',
        iniciales: 'AM',
        sucursal: 'Sur',
        totalVentas: 118920,
        comision: 5946,
        porcentajeMeta: 118.9,
        numeroVentas: 198
      },
      {
        id: 4,
        nombre: 'Luis Fernando Torres',
        iniciales: 'LT',
        sucursal: 'Este',
        totalVentas: 97650,
        comision: 4882,
        porcentajeMeta: 97.7,
        numeroVentas: 165
      }
    ];
  }

  private cargarTopClientes(): void {
    this.topClientes = [
      {
        id: 1,
        nombres: 'Ricardo',
        apellidos: 'Montoya Delgado',
        email: 'ricardo.montoya@email.com',
        telefono: '+51 987 654 321',
        segmento: 'premium',
        totalCompras: 25750,
        numeroCompras: 47,
        ultimaCompra: new Date('2025-06-05'),
        fechaRegistro: new Date('2024-03-15')
      },
      {
        id: 2,
        nombres: 'Carmen',
        apellidos: 'Vásquez Torres',
        email: 'carmen.vasquez@email.com',
        telefono: '+51 987 654 322',
        segmento: 'premium',
        totalCompras: 18920,
        numeroCompras: 32,
        ultimaCompra: new Date('2025-06-04'),
        fechaRegistro: new Date('2024-01-20')
      },
      {
        id: 3,
        nombres: 'José Luis',
        apellidos: 'Fernández Ruiz',
        email: 'jose.fernandez@email.com',
        telefono: '+51 987 654 323',
        segmento: 'frecuente',
        totalCompras: 14680,
        numeroCompras: 28,
        ultimaCompra: new Date('2025-06-03'),
        fechaRegistro: new Date('2024-05-10')
      }
    ];
  }

  private inicializarFiltros(): void {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.rangoFechas = [inicioMes, hoy];
    
    // Seleccionar todas las sucursales por defecto
    this.sucursalesSeleccionadas = this.sucursales.map(s => s.id);
  }

  private inicializarGraficos(): void {
    this.inicializarGraficoVentas();
    this.inicializarGraficoMetodosPago();
    this.inicializarGraficoVendedores();
    this.inicializarGraficoSegmentos();
    this.inicializarGraficoPredicciones();
  }

  private inicializarGraficoVentas(): void {
    this.datosGraficoVentas = {
      labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Ventas 2025',
          data: [65000, 78000, 82000, 94000, 105000, 112000],
          fill: false,
          borderColor: '#42A5F5',
          backgroundColor: '#42A5F5',
          tension: 0.4
        },
        {
          label: 'Ventas 2024',
          data: [58000, 69000, 75000, 81000, 87000, 92000],
          fill: false,
          borderColor: '#66BB6A',
          backgroundColor: '#66BB6A',
          tension: 0.4
        }
      ]
    };

    this.opcionesGraficoVentas = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Evolución de Ventas Mensuales'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value: number) {
              return 'S/ ' + value.toLocaleString();
            }
          }
        }
      }
    };
  }

  private inicializarGraficoMetodosPago(): void {
    this.datosGraficoMetodosPago = {
      labels: ['Efectivo', 'Tarjeta Débito', 'Tarjeta Crédito', 'Transferencia', 'Yape/Plin'],
      datasets: [
        {
          data: [35, 25, 20, 12, 8],
          backgroundColor: [
            '#FF6384',
            '#36A2EB', 
            '#FFCE56',
            '#4BC0C0',
            '#9966FF'
          ],
          hoverBackgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56', 
            '#4BC0C0',
            '#9966FF'
          ]
        }
      ]
    };

    this.resumenMetodosPago = [
      { nombre: 'Efectivo', porcentaje: 35, color: '#FF6384' },
      { nombre: 'T. Débito', porcentaje: 25, color: '#36A2EB' },
      { nombre: 'T. Crédito', porcentaje: 20, color: '#FFCE56' },
      { nombre: 'Transferencia', porcentaje: 12, color: '#4BC0C0' },
      { nombre: 'Yape/Plin', porcentaje: 8, color: '#9966FF' }
    ];
  }

  private inicializarGraficoVendedores(): void {
    this.datosGraficoVendedores = {
      labels: this.topVendedores.map(v => v.nombre.split(' ')[0]),
      datasets: [
        {
          label: 'Ventas (S/)',
          data: this.topVendedores.map(v => v.totalVentas),
          backgroundColor: '#42A5F5',
          borderColor: '#1976D2',
          borderWidth: 1
        }
      ]
    };
  }

  private inicializarGraficoSegmentos(): void {
    this.datosSegmentosClientes = {
      labels: ['Premium VIP', 'Frecuentes', 'Ocasionales'],
      datasets: [
        {
          data: [127, 245, 195],
          backgroundColor: [
            '#FFD700',
            '#4CAF50', 
            '#2196F3'
          ],
          hoverBackgroundColor: [
            '#FFD700',
            '#4CAF50',
            '#2196F3'
          ]
        }
      ]
    };

    this.datosFrecuenciaCompras = {
      labels: ['Diario', 'Semanal', 'Quincenal', 'Mensual', 'Esporádico'],
      datasets: [
        {
          label: 'Número de Clientes',
          data: [45, 189, 156, 234, 143],
          backgroundColor: '#42A5F5',
          borderColor: '#1976D2',
          borderWidth: 1
        }
      ]
    };
  }

  private inicializarGraficoPredicciones(): void {
    this.datosPredicciones = {
      labels: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'],
      datasets: [
        {
          label: 'Ventas Reales',
          data: [85000, 92000, 88000, 95000, 105000, 112000, 0, 0],
          borderColor: '#42A5F5',
          backgroundColor: '#42A5F5',
          fill: false
        },
        {
          label: 'Predicción IA',
          data: [0, 0, 0, 0, 0, 112000, 118000, 125000],
          borderColor: '#FF6384',
          backgroundColor: '#FF6384',
          borderDash: [5, 5],
          fill: false
        }
      ]
    };

    this.opcionesGraficoPredicciones = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top'
        },
        title: {
          display: true,
          text: 'Predicciones de Ventas con IA'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value: number) {
              return 'S/ ' + value.toLocaleString();
            }
          }
        }
      }
    };

    this.opcionesGraficoCircular = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      }
    };

    this.opcionesGraficoBarras = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value: number) {
              return 'S/ ' + value.toLocaleString();
            }
          }
        }
      }
    };
  }

  private calcularProgresoMeta(): void {
    this.progresoMeta = (this.kpis.ventasTotales / this.kpis.metaMensual) * 100;
  }

  private calcularMetricas(): void {
    console.log('📈 Calculando métricas avanzadas para:', this.currentUser);
  }

  private actualizarGraficos(): void {
    console.log('📊 Actualizando gráficos...');
    this.inicializarGraficoVendedores();
  }

  // ✅ RESTO DE MÉTODOS YA IMPLEMENTADOS...
  // (Continuarían todos los métodos del componente anterior)

  // ✅ MÉTODOS DE FILTROS
  aplicarFiltros(): void {
    console.log('🔍 Aplicando filtros para usuario:', this.currentUser);
    console.log('📅 Fecha/Hora actual:', this.currentDateTime);
    
    this.aplicandoFiltros = true;
    
    setTimeout(() => {
      this.aplicandoFiltros = false;
      this.actualizarDatos();
      
      this.messageService.add({
        severity: 'success',
        summary: '✅ Filtros Aplicados',
        detail: `Datos actualizados para ${this.currentUser} - ${this.currentDateTime}`,
        life: 3000
      });
    }, 2000);
  }

  limpiarFiltros(): void {
    console.log('🔄 Limpiando filtros...');
    
    this.periodoSeleccionado = 'mes_actual';
    this.sucursalesSeleccionadas = this.sucursales.map(s => s.id);
    this.vendedoresSeleccionados = [];
    this.categoriasSeleccionadas = [];
    this.rangoMontos = [0, 50000];
    this.minimoTransacciones = 1;
    
    this.inicializarFiltros();
    this.aplicarFiltros();
  }

  guardarConfiguracion(): void {
    console.log('💾 Guardando configuración de filtros...');
    
    const configuracion = {
      periodo: this.periodoSeleccionado,
      rangoFechas: this.rangoFechas,
      sucursales: this.sucursalesSeleccionadas,
      vendedores: this.vendedoresSeleccionados,
      categorias: this.categoriasSeleccionadas,
      usuario: this.currentUser,
      fechaGuardado: this.currentDateTime
    };
    
    localStorage.setItem('reportes_config_emerson147', JSON.stringify(configuracion));
    
    this.messageService.add({
      severity: 'info',
      summary: '💾 Configuración Guardada',
      detail: `Configuración guardada para ${this.currentUser}`,
      life: 3000
    });
  }

  // ✅ MÉTODOS DE REPORTES
  generarReporte(tipo: string): void {
    console.log('📄 Generando reporte:', tipo, 'para usuario:', this.currentUser);
    
    const tipoReporte = this.tiposReportes.find(t => t.tipo === tipo);
    if (!tipoReporte) return;
    
    tipoReporte.generando = true;
    tipoReporte.progreso = 0;
    
    const intervalo = setInterval(() => {
      tipoReporte.progreso += Math.random() * 15 + 5;
      
      if (tipoReporte.progreso >= 100) {
        tipoReporte.progreso = 100;
        clearInterval(intervalo);
        
        setTimeout(() => {
          this.finalizarGeneracionReporte(tipo, tipoReporte);
        }, 500);
      }
    }, 300);
  }

  private finalizarGeneracionReporte(tipo: string, tipoReporte: TipoReporte): void {
    tipoReporte.generando = false;
    tipoReporte.progreso = 0;
    
    const nuevoReporte: HistorialReporte = {
      id: this.historialReportes.length + 1,
      fecha: new Date(),
      tipo: tipoReporte.titulo,
      estado: 'COMPLETADO',
      archivo: `reporte_${tipo}_${this.currentUser}_${new Date().getTime()}.${tipoReporte.formato.toLowerCase()}`,
      tamaño: Math.random() * 3 + 1,
      icon: tipoReporte.icono
    };
    
    this.historialReportes.unshift(nuevoReporte);
    
    this.messageService.add({
      severity: 'success',
      summary: '📄 Reporte Generado',
      detail: `${tipoReporte.titulo} generado exitosamente por ${this.currentUser}`,
      life: 5000
    });
  }

  // ✅ MÉTODOS HELPER
getRankSeverity(rowIndex: number): 'info' | 'success' | 'warn' | 'danger' | 'secondary' | 'contrast' {
  if (rowIndex === 0) return 'success';
  if (rowIndex === 1) return 'info';
  if (rowIndex === 2) return 'warn';
  return 'secondary';
}

  getClienteInitials(cliente: TopCliente): string {
    if (!cliente) return 'NN';
    return (cliente.nombres.charAt(0) + cliente.apellidos.charAt(0)).toUpperCase();
  }

  getSegmentoClass(segmento: string): string {
    const clases = {
      'premium': 'premium-chip',
      'frecuente': 'frecuente-chip',
      'ocasional': 'ocasional-chip'
    };
    return clases[segmento as keyof typeof clases] || 'ocasional-chip';
  }

  getEstadoReporteSeverity(estado: string): 'success' | 'info' | 'danger' | 'warning' | 'secondary' {
    const severities = {
      'COMPLETADO': 'success',
      'GENERANDO': 'info',
      'ERROR': 'danger',
      'CANCELADO': 'warning'
    } as const;
    return severities[estado as keyof typeof severities] || 'secondary';
  }

  getEstadoReporteIcon(estado: string): string {
    const iconos = {
      'COMPLETADO': 'pi pi-check-circle',
      'GENERANDO': 'pi pi-spin pi-spinner',
      'ERROR': 'pi pi-times-circle',
      'CANCELADO': 'pi pi-ban'
    };
    return iconos[estado as keyof typeof iconos] || 'pi pi-info-circle';
  }

  // ✅ MÉTODOS DE MENÚ FLOTANTE
  exportarDashboard(): void {
    this.messageService.add({
      severity: 'info',
      summary: '📤 Exportando Dashboard',
      detail: `Generando reporte completo para ${this.currentUser}`,
      life: 4000
    });
  }

  actualizarDatos(): void {
    this.cargarDatosIniciales();
    this.messageService.add({
      severity: 'success',
      summary: '🔄 Datos Actualizados',
      detail: `Datos actualizados a ${this.currentDateTime}`,
      life: 3000
    });
  }

  abrirConfiguracion(): void {
    this.messageService.add({
      severity: 'info',
      summary: '⚙️ Configuración',
      detail: 'Abriendo panel de configuración...',
      life: 3000
    });
  }

  mostrarAyuda(): void {
    this.messageService.add({
      severity: 'info',
      summary: '❓ Centro de Ayuda',
      detail: 'Accediendo a la documentación del sistema...',
      life: 3000
    });
  }

  // ✅ MÉTODOS PARA EVITAR ERRORES EN TEMPLATE
  cambiarTipoGrafico(): void {
    console.log('📊 Cambiando tipo de gráfico a:', this.tipoGraficoVentas);
  }

cargarHistorialReportes(event: TableLazyLoadEvent): void {
  console.log('📋 Cargando historial con lazy loading:', event);
  this.cargandoHistorial = true;
  setTimeout(() => {
    this.cargandoHistorial = false;
  }, 1000);
}
  entrenarModelo(): void {
    console.log('🧠 Entrenando modelo de IA...');
    this.entrenandoModelo = true;
    setTimeout(() => {
      this.entrenandoModelo = false;
      this.messageService.add({
        severity: 'success',
        summary: '🤖 Modelo Entrenado',
        detail: `Modelo entrenado por ${this.currentUser}`,
        life: 4000
      });
    }, 3000);
  }

  generarPrediccion(): void {
    console.log('📈 Generando predicción con IA...');
    this.generandoPrediccion = true;
    setTimeout(() => {
      this.generandoPrediccion = false;
      this.messageService.add({
        severity: 'success',
        summary: '🔮 Predicción Generada',
        detail: 'Nuevas predicciones disponibles',
        life: 4000
      });
    }, 2500);
  }

  exportarModelo(): void {
    this.messageService.add({
      severity: 'info',
      summary: '📤 Exportando Modelo',
      detail: 'Preparando modelo para descarga...',
      life: 3000
    });
  }

  verDetalleCliente(cliente: TopCliente): void {
    this.clienteSeleccionado = cliente;
    this.tipoDetalle = 'cliente';
    this.tituloDetalle = `Detalle de ${cliente.nombres} ${cliente.apellidos}`;
    this.mostrarDetalles = true;
  }

  enviarEmailCliente(cliente: TopCliente): void {
    this.messageService.add({
      severity: 'info',
      summary: '📧 Email Enviado',
      detail: `Email enviado a ${cliente.email}`,
      life: 3000
    });
  }

  filtrarClientes(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    console.log('🔍 Filtrando clientes:', valor);
  }

  descargarReporte(reporte: HistorialReporte): void {
    this.messageService.add({
      severity: 'info',
      summary: '💾 Descarga Iniciada',
      detail: `Descargando ${reporte.archivo}`,
      life: 3000
    });
  }

  vistaPrevia(reporte: HistorialReporte): void {
    this.messageService.add({
      severity: 'info',
      summary: '👁️ Vista Previa',
      detail: `Abriendo vista previa de ${reporte.archivo}`,
      life: 3000
    });
  }

  eliminarReporte(reporte: HistorialReporte): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar el reporte ${reporte.tipo}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        const index = this.historialReportes.indexOf(reporte);
        if (index > -1) {
          this.historialReportes.splice(index, 1);
          this.messageService.add({
            severity: 'warn',
            summary: '🗑️ Reporte Eliminado',
            detail: `${reporte.tipo} eliminado del historial`,
            life: 3000
          });
        }
      }
    });
  }
}
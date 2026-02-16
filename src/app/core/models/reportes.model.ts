import { ButtonSeverity } from 'primeng/button';

// ✅ INTERFACES EMPRESARIALES
export interface KPIData {
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

export interface KPIFinanciero {
  utilidadNeta: number;
  margenPromedio: number;
  costoVentas: number;
}

export interface KPIInventario {
  valorizacionTotal: number;
  itemsTotales: number;
  stockBajoCount: number;
  productosSinVenta: number;
}

export interface TopProducto {
  id: number;
  nombre: string;
  categoria: string;
  totalVentas: number;
  cantidadVendida: number;
  porcentaje: number;
}

export interface TopVendedor {
  id: number;
  nombre: string;
  iniciales: string;
  sucursal: string;
  totalVentas: number;
  comision: number;
  porcentajeMeta: number;
  numeroVentas: number;
}

export interface TopCliente {
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

export interface TipoReporte {
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

export interface HistorialReporte {
  id: number;
  fecha: Date;
  tipo: string;
  estado: 'COMPLETADO' | 'GENERANDO' | 'ERROR' | 'CANCELADO';
  archivo: string;
  tamaño: number;
  icon: string;
}

export interface PrediccionIA {
  proximaSemana: number;
  proximoMes: number;
  confianza: number;
  tendencia: 'ascendente' | 'descendente' | 'estable';
}

export interface CompraCliente {
  fecha: Date;
  producto: string;
  cantidad: number;
  total: number;
  vendedor: string;
}

export interface Sucursal {
  id: number;
  nombre: string;
  icono?: string;
}

export interface Vendedor {
  id: number;
  nombre: string;
}

export interface Categoria {
  id: number;
  nombre: string;
}

export interface Periodo {
  label: string;
  value: string;
}

export interface TipoGrafico {
  label: string;
  value: string;
  icon: string;
}

export interface AlgoritmoIA {
  label: string;
  value: string;
}

export interface VentanaTiempo {
  label: string;
  value: string;
}

export interface VariablePredictiva {
  label: string;
  value: string;
}

export interface MetodoPago {
  nombre: string;
  porcentaje: number;
  color: string;
}

// ✅ INTERFACES PARA GRÁFICOS
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
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

export interface ChartOptions {
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

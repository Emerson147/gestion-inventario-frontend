export interface MetricaVenta {
  id: string;
  titulo: string;
  valor: number | string;
  icono: string;
  color: 'success' | 'info' | 'warning' | 'danger' | 'secondary';
  categoria?: 'ventas' | 'financiero' | 'operaciones' | 'marketing';
  tendencia?: {
    porcentaje: number;
    direccion: 'up' | 'down' | 'neutral';
    periodo: string;
    periodoAnterior?: string | number;
  };
  objetivo?: {
    valor: number;
    progreso: number;
    fechaLimite?: Date;
  };
  miniGrafico?: {
    data: number[];
    labels?: string[];
    type: 'line' | 'bar' | 'area';
  };
  desglose?: Array<{
    label: string;
    valor: number;
    color: string;
    porcentaje?: number;
  }>;
  alertaCritica?: {
    activa: boolean;
    mensaje: string;
    nivel: 'alta' | 'media' | 'baja';
  };
  accionPrincipal?: {
    label: string;
    icono: string;
    callback: () => void;
    disabled?: boolean;
  };
  metricas?: Array<{
    label: string;
    valor: string | number;
    icono?: string;
    color?: string;
  }>;
  loading?: boolean;
  ultimaActualizacion?: Date;
}
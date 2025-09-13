import { Inventario } from './inventario.model';

/**
 * Interfaces específicas para las respuestas del servicio de inventario
 */

export interface InventarioStats {
  totalProductos: number;
  valorTotalInventario: number;
  stockCritico: number;
  productosAgotados: number;
  rotacionPromedio: number;
  movimientosDelMes: number;
  eficienciaStock: number;
  valorEnRiesgo: number;
}

export interface SugerenciaReposicion {
  id: number;
  inventario: Inventario;
  cantidadSugerida: number;
  motivoReposicion: string;
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
  fechaSugerencia: Date;
  costoEstimado?: number;
  tiempoReposicion?: number;
  proveedorRecomendado?: string;
}

export interface InventarioValidationResult {
  valido: boolean;
  errores: string[];
  advertencias?: string[];
}

export interface InventarioExportOptions {
  formato: 'excel' | 'csv' | 'pdf';
  incluirMovimientos?: boolean;
  fechaDesde?: Date;
  fechaHasta?: Date;
  campos?: string[];
}

export interface MovimientoInventarioResponse {
  mensaje: string;
  movimiento: any; // Usar el tipo correcto según tu modelo
  inventarioActualizado?: Inventario;
}

export interface BulkUpdateResult {
  exitosos: number;
  fallidos: number;
  errores: string[];
  inventariosActualizados: Inventario[];
}

/**
 * Respuesta estándar de la API
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
  timestamp: Date;
}

/**
 * Respuesta de error estándar
 */
export interface ApiError {
  success: false;
  message: string;
  errors: string[];
  code?: string;
  timestamp: Date;
}
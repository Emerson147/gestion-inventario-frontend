import { Inventario } from './inventario.model';
import { VentaResponse } from './venta.model';

export enum TipoMovimiento {
  ENTRADA = 'ENTRADA',
  SALIDA = 'SALIDA',
  AJUSTE = 'AJUSTE',
  TRASLADO = 'TRASLADO'
}

export interface MovimientoInventario {
  id?: number;
  inventario: Inventario | null;
  inventarioDestino: Inventario | null;
  cantidad: number;
  tipo: TipoMovimiento;
  descripcion: string;
  venta?: VentaResponse;
  referencia: string;
  fechaMovimiento?: Date;
  usuario?: string;
}

// Interfaz actualizada para coincidir con el backend español
export interface PagedResponse<T> {
  contenido: T[];
  numeroPagina: number;
  tamañoPagina: number;
  totalElementos: number;
  totalPaginas: number;
  primera?: boolean;
  ultima: boolean;
}
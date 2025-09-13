import { Inventario } from './inventario.model';
import { VentaResponse } from './venta.model';
import { Almacen } from './almacen.model';
import { Producto } from './product.model';
import { Color, Talla } from './colors.model';

export enum TipoMovimiento {
  ENTRADA = 'ENTRADA',
  SALIDA = 'SALIDA',
  AJUSTE = 'AJUSTE',
  TRASLADO = 'TRASLADO'
}

export interface MovimientoRequest {
  id?: number;
  inventarioId: number;
  inventarioDestinoId?: number;
  productoId?: number;
  colorId?: number; 
  tallaId?: number;
  almacenDestinoId?: number;
  ventaId?: number;
  cantidad: number;
  tipo: TipoMovimiento;
  descripcion: string;
  referencia: string;
  usuario?: string; // 🔥 OPCIONAL - Se setea automáticamente en backend
  fechaMovimiento?: string; // Solo en response
}


export interface MovimientoResponse {
  id: number;
  inventarioId: number;
  inventarioDestinoId?: number;
  cantidad: number;
  tipo: TipoMovimiento;
  descripcion: string;
  referencia: string;
  usuario: string;
  fechaMovimiento: string;
  estadoResultante?: string; // Estado del inventario después del movimiento
  almacenDestinoNombre?: string; // Solo para traslados
  
  // Datos relacionados del inventario origen
  producto?: Producto;
  color?: Color;
  talla?: Talla;
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
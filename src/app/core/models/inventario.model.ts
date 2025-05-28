import { Producto } from './product.model';
import { Color, Talla } from './colors.model';
import { Almacen } from './almacen.model';

export enum EstadoInventario {
  DISPONIBLE = 'DISPONIBLE',
  AGOTADO = 'AGOTADO',
  BAJO_STOCK = 'BAJO_STOCK',
  RESERVADO = 'RESERVADO'
}

export interface Inventario {
  id?: number;
  serie?: string;
  producto: Producto | null;
  color: Color | null;
  talla: Talla | null;
  almacen: Almacen | null;
  cantidad: number;
  estado: EstadoInventario;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface InventarioRequest {
  productoId: number;
  colorId: number;
  tallaId: number;
  almacenId: number;
  cantidad: number;
  estado: EstadoInventario;
}

export interface MovimientoInventario {
  id?: number;
  inventarioId?: number;
  cantidad: number;
  tipo: 'ENTRADA' | 'SALIDA';
  descripcion: string;
  fecha: string;
}

// Respuestas paginadas
export interface PagedResponse<T> {
  contenido: T[];
  numeroPagina: number;
  tamañoPagina: number;
  totalElementos: number;
  totalPaginas: number;
  ultima: boolean;
}
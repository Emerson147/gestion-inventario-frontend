/**
 * Modelos para el sistema de gestión de caja
 */

export interface Tienda {
  id: number;
  nombre: string;
  direccion: string;
  telefono?: string;
  ruc?: string;
}

export interface ImpresoraConfig {
  id: string;
  nombre: string;
  puerto: string;
  tipo: 'TERMICA_58mm' | 'TERMICA_80mm' | 'LASER';
  habilitada: boolean;
}

export interface EstadoCaja {
  abierta: boolean;
  montoInicial: number;
  fechaApertura: Date | null;
  usuarioApertura: string | null;
  totalVentasDelDia: number;
  cantidadVentas: number;
  ultimaActualizacion: Date;
  tienda: Tienda | null;
  impresora: ImpresoraConfig | null;
  turno: 'MAÑANA' | 'TARDE' | 'NOCHE' | null;
  observaciones?: string;
}

export interface AperturaCajaRequest {
  montoInicial: number;
  tiendaId: number;
  impresoraId: string;
  turno: 'MAÑANA' | 'TARDE' | 'NOCHE';
  observaciones?: string;
}

export interface CierreCajaResponse {
  montoFinal: number;
  diferencia: number;
  ventasEfectivo: number;
  ventasTarjeta: number;
  totalVentas: number;
  cantidadVentas: number;
}

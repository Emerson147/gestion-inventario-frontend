// Importar las interfaces necesarias
import { VentaResponse } from './venta.model';
import { User } from './user.model';

export interface PagoRequest {
  ventaId: number;
  usuarioId: number;
  monto: number;
  metodoPago: string;
  numeroReferencia?: string;
  nombreTarjeta?: string;
  ultimos4Digitos?: string;
  observaciones?: string;
}

export interface PagoResponse {
  id: number;
  numeroPago: string;
  venta: VentaResponse;
  usuario: User;
  monto: number;
  metodoPago: string;
  estado: string;
  fechaCreacion: string;
}
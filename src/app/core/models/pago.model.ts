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
  venta: any;
  usuario: any;
  monto: number;
  metodoPago: string;
  estado: string;
  fechaCreacion: string;
}
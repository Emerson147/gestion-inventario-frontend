export interface VentaDetalleRequest {
  inventarioId: number;
  cantidad: number;
}

export interface VentaRequest {
  clienteId: number;
  usuarioId: number;
  tipoComprobante: string; // FACTURA, BOLETA, etc
  serieComprobante: string;
  numeroComprobante?: string;
  observaciones?: string;
  detalles: VentaDetalleRequest[];
}

export interface VentaDetalleResponse {
  id: number;
  producto: { id: number; codigo: string; nombre: string; marca?: string };
  color: { id: number; nombre: string };
  talla: { id: number; numero: string };
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  descripcionProducto: string;
}

export interface VentaResponse {
  id: number;
  numeroVenta: string;
  cliente: { id: number; nombres: string; apellidos: string; documento: string };
  usuario: { id: number; username: string; nombre: string };
  subtotal: number;
  igv: number;
  total: number;
  estado: string;
  tipoComprobante: string;
  serieComprobante: string;
  numeroComprobante: string | null;
  observaciones: string;
  detalles: VentaDetalleResponse[];
  fechaCreacion: string;
  fechaActualizacion: string;
}
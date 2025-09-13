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

interface VentaDetalleResponse {
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

export interface ResumenDiario {
  fecha: string;
  cantidadProductos: number;
  productosMasVendidos: ProductoVendido[];
  totalVentas: number;
  cantidadVentas: number;
  ventasPorComprobante: Record<string, number>;
}


export interface ProductoVendido {
  productoId: number;
  nombreProducto: string;
  cantidadVendida: number;
}

export interface ClienteVentas {
  clienteId: number;
  nombreCliente: string;
  total: number;
}


export interface ProductoVendido {
  productoId: number;
  nombreProducto: string;
  cantidadVendida: number;
}


export interface ReporteVentasResponse {
  fechaInicio: string;      // ISO string de fecha
  fechaFin: string;         // ISO string de fecha
  totalVentas: number;
  totalIgv: number;
  cantidadVentas: number;
  topClientes: ClienteVentas[];
  topProductos: ProductoVendido[];
}

export interface ResumenDiarioResponse {
  totalVentas: number;
  totalIngresos: number;
  clientesUnicos: number;
  clientesNuevos: number;
  productosVendidos: number;
  tiposProductos: number;
  porcentajeCrecimiento: number;
  promedioVenta: number;
  cantidadProductos: number;
  cantidadVentas: number;
}

export interface EstadisticasModeloResponse {
  modelos: {nombre: string, cantidad: number}[];
  totalVentas: number;
}

export interface ResumenClienteResponse {
  cliente: string;
  totalCompras: number;
  cantidadVentas: number;
  promedioCompra: number;
}

export interface FiltrosVentaRequest {
  fechaDesde?: Date;
  fechaHasta?: Date;
  estado?: string;
  termino?: string;
}
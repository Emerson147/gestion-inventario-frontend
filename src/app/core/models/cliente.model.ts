export interface Cliente {
  id?: number;
  nombres: string;
  apellidos: string;
  dni?: string;
  ruc?: string;
  telefono?: string;
  direccion?: string;
  email?: string;
  estado?: boolean;
  fechaNacimiento?: string; // ISO string
  fechaCreacion?: string;   // ISO string
  fechaActualizacion?: string; // ISO string
  // Estadísticas del cliente
  compras?: number;         // Número total de compras
  totalCompras?: number;    // Monto total gastado
  ultimaCompra?: string;    // Fecha de la última compra
}
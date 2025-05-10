export interface ProductoRequest {
  codigo?: string;  // Puede ser opcional si el backend lo genera
  nombre: string;
  descripcion?: string;
  marca: string;
  modelo: string;
  precioCompra: number;
  precioVenta: number;
  imagen?: string;  
}

export interface Producto {
  id?: number;
  codigo?: string;
  nombre: string;
  descripcion?: string;
  marca: string;
  modelo: string;
  precioCompra: number;
  precioVenta: number;
  imagen?: string;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}
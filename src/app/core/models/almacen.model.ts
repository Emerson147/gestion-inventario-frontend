export interface Almacen {
  id?: number;
  nombre: string;
  ubicacion?: string;
  descripcion?: string;
  fechaCreacion?: string;      // ISO string (puede estar ausente en el request)
  fechaActualizacion?: string;
}

export interface AlmacenRequest {
  nombre: string;
  ubicacion?: string;
  descripcion?: string;
}

export interface AlmacenResponse {
  id: number;
  nombre: string;
  ubicacion?: string;
  descripcion?: string;
  fechaCreacion: string;        // ISO string (yyyy-MM-dd HH:mm:ss)
  fechaActualizacion: string;
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
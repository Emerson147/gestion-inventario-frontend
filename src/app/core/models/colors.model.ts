export interface Talla {
  id?: number;
  numero: string;
}

export interface Color {
  id?: number;
  nombre: string;
  tallas?: Talla[];
}

export interface ColorRequest {
  nombre: string;
  tallas?: {
    numero: string;
  }[];
}

export interface ColorResponse {
  id: number;
  nombre: string;
  tallas: Talla[];
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
/**
 * Interfaz genérica para respuestas paginadas
 * @template T - Tipo de los elementos en la lista paginada
 */
export interface PagedResponse<T> {
  /** Lista de elementos en la página actual */
  content: T[];
  
  /** Número total de elementos en todas las páginas */
  totalElements: number;
  
  /** Número total de páginas disponibles */
  totalPages: number;
  
  /** Tamaño de la página (número de elementos por página) */
  size: number;
  
  /** Número de la página actual (0-based) */
  number: number;
  
  /** Indica si es la primera página */
  first: boolean;
  
  /** Indica si es la última página */
  last: boolean;
  
  /** Número de elementos en la página actual */
  numberOfElements: number;
}

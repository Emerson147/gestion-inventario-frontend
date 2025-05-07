export interface User {
  id?: number;
  nombres: string;
  apellidos: string;
  username: string;
  password?: string;
  email: string;
  activo: boolean;
  roles: string[];
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

// DTO para crear/actualizar usuarios
export interface UsuarioRequest {
  nombres: string;
  apellidos: string;
  username: string;
  password?: string;
  email: string;
  activo: boolean;
  roles: string[];  
}
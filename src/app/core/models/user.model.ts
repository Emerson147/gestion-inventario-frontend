export interface User {
  id?: number;
  nombres: string;
  apellidos: string;
  username: string;
  avatar?: string;
  password?: string;
  email: string;
  roles: string[];
  activo: boolean;
  ultimoLogin?: string;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  requieresCambioPassword?: boolean;
}

// DTO para crear/actualizar usuarios
export interface UsuarioRequest {
  nombres: string;
  apellidos: string;
  username: string;
  password?: string;
  email: string;
  roles: string[];  
}
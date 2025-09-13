import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Utilidades para validaciones personalizadas
 */
export class ValidationUtils {

  /**
   * Validador para stock mínimo
   */
  static stockMinValidator(maxControl?: AbstractControl): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      
      if (!value || value < 0) {
        return { stockMin: { message: 'El stock mínimo debe ser mayor o igual a 0' } };
      }
      
      if (maxControl && maxControl.value && value > maxControl.value) {
        return { stockMin: { message: 'El stock mínimo no puede ser mayor al máximo' } };
      }
      
      return null;
    };
  }

  /**
   * Validador para stock máximo
   */
  static stockMaxValidator(minControl?: AbstractControl): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      
      if (!value || value < 0) {
        return { stockMax: { message: 'El stock máximo debe ser mayor a 0' } };
      }
      
      if (minControl && minControl.value && value < minControl.value) {
        return { stockMax: { message: 'El stock máximo no puede ser menor al mínimo' } };
      }
      
      return null;
    };
  }

  /**
   * Validador para cantidad de inventario
   */
  static cantidadValidator(stockDisponible?: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      
      if (!value || value <= 0) {
        return { cantidad: { message: 'La cantidad debe ser mayor a 0' } };
      }
      
      if (stockDisponible !== undefined && value > stockDisponible) {
        return { 
          cantidad: { 
            message: `La cantidad no puede exceder el stock disponible (${stockDisponible})`,
            stockDisponible,
            cantidadSolicitada: value
          } 
        };
      }
      
      return null;
    };
  }

  /**
   * Validador para fechas
   */
  static fechaValidator(tipo: 'pasado' | 'futuro' | 'presente' = 'presente'): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      
      if (!value) {
        return null; // Si no hay valor, no validar (usar required por separado)
      }
      
      const fecha = new Date(value);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      fecha.setHours(0, 0, 0, 0);
      
      switch (tipo) {
        case 'pasado':
          if (fecha >= hoy) {
            return { fecha: { message: 'La fecha debe ser anterior a hoy' } };
          }
          break;
        case 'futuro':
          if (fecha <= hoy) {
            return { fecha: { message: 'La fecha debe ser posterior a hoy' } };
          }
          break;
        case 'presente':
          // Permitir fechas pasadas, presentes y futuras cercanas (1 año)
          const unAñoAtras = new Date();
          unAñoAtras.setFullYear(unAñoAtras.getFullYear() - 1);
          const unAñoAdelante = new Date();
          unAñoAdelante.setFullYear(unAñoAdelante.getFullYear() + 1);
          
          if (fecha < unAñoAtras || fecha > unAñoAdelante) {
            return { fecha: { message: 'La fecha debe estar dentro de un rango razonable' } };
          }
          break;
      }
      
      return null;
    };
  }

  /**
   * Validador para rango de fechas
   */
  static rangoFechasValidator(fechaInicioControl: AbstractControl): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const fechaFin = control.value;
      const fechaInicio = fechaInicioControl.value;
      
      if (!fechaFin || !fechaInicio) {
        return null;
      }
      
      if (new Date(fechaFin) <= new Date(fechaInicio)) {
        return { 
          rangoFechas: { 
            message: 'La fecha de fin debe ser posterior a la fecha de inicio' 
          } 
        };
      }
      
      return null;
    };
  }

  /**
   * Validador para códigos únicos
   */
  static codigoUnicoValidator(codigosExistentes: string[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      
      if (!value) {
        return null;
      }
      
      if (codigosExistentes.includes(value.toString().toUpperCase())) {
        return { 
          codigoUnico: { 
            message: 'Este código ya existe',
            codigoExistente: value
          } 
        };
      }
      
      return null;
    };
  }

  /**
   * Validador para formato de código
   */
  static formatoCodigoValidator(patron: RegExp = /^[A-Z0-9-]+$/): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      
      if (!value) {
        return null;
      }
      
      if (!patron.test(value.toString().toUpperCase())) {
        return { 
          formatoCodigo: { 
            message: 'El código debe contener solo letras mayúsculas, números y guiones',
            patron: patron.toString()
          } 
        };
      }
      
      return null;
    };
  }

  /**
   * Obtiene el primer mensaje de error de un control
   */
  static getErrorMessage(control: AbstractControl): string | null {
    if (!control.errors) {
      return null;
    }
    
    const errors = control.errors;
    
    // Errores personalizados con mensajes
    for (const errorKey of Object.keys(errors)) {
      const error = errors[errorKey];
      if (error && error.message) {
        return error.message;
      }
    }
    
    // Errores estándar de Angular
    if (errors['required']) {
      return 'Este campo es obligatorio';
    }
    
    if (errors['email']) {
      return 'Ingrese un email válido';
    }
    
    if (errors['min']) {
      return `El valor mínimo es ${errors['min'].min}`;
    }
    
    if (errors['max']) {
      return `El valor máximo es ${errors['max'].max}`;
    }
    
    if (errors['minlength']) {
      return `Mínimo ${errors['minlength'].requiredLength} caracteres`;
    }
    
    if (errors['maxlength']) {
      return `Máximo ${errors['maxlength'].requiredLength} caracteres`;
    }
    
    if (errors['pattern']) {
      return 'El formato no es válido';
    }
    
    return 'Campo inválido';
  }

  /**
   * Verifica si un control tiene errores
   */
  static hasError(control: AbstractControl): boolean {
    return !!(control.errors && (control.dirty || control.touched));
  }

  /**
   * Obtiene las clases CSS para mostrar errores
   */
  static getErrorClasses(control: AbstractControl): string {
    if (this.hasError(control)) {
      return 'ng-invalid border-red-500 focus:border-red-500 focus:ring-red-200';
    }
    
    if (control.valid && (control.dirty || control.touched)) {
      return 'ng-valid border-green-500 focus:border-green-500 focus:ring-green-200';
    }
    
    return '';
  }
}
# Solución Error 404 al Generar PDF de Comprobante

## 🐛 Problema Identificado

Al intentar imprimir un comprobante en formato PDF, se producía el siguiente error:

```
GET http://localhost:8080/api/comprobantes/venta/167 404 (Not Found)
❌ Error en ComprobantesService: Comprobante no encontrado
❌ Error obteniendo comprobante: Error: Comprobante no encontrado
❌ Error generando PDF: Error: Comprobante no encontrado
```

### Causa Raíz

El error se debía a dos problemas principales:

1. **Pérdida del código de estado HTTP**: El método `handleError` del servicio `ComprobantesService` creaba un nuevo objeto `Error` sin preservar la propiedad `status` del error HTTP original.

2. **Detección incorrecta del error 404**: La función `asegurarComprobante` verificaba `error.status === 404`, pero esta propiedad no existía en el objeto de error transformado, impidiendo la generación automática del comprobante.

---

## ✅ Solución Implementada

### 1. Mejora en `comprobantes.service.ts`

**Modificación del método `handleError`:**

```typescript
private handleError(error: HttpErrorResponse): Observable<never> {
  let errorMessage = 'Error desconocido en el servicio de comprobantes';
  
  if (error.error instanceof ErrorEvent) {
    errorMessage = `Error de cliente: ${error.error.message}`;
  } else {
    switch (error.status) {
      case 400:
        errorMessage = 'Solicitud incorrecta - Verifique los datos enviados';
        break;
      case 401:
        errorMessage = 'No autorizado - Inicie sesión nuevamente';
        break;
      case 403:
        errorMessage = 'Acceso denegado - No tiene permisos suficientes';
        break;
      case 404:
        errorMessage = 'Comprobante no encontrado';
        break;
      case 500:
        errorMessage = 'Error interno del servidor';
        break;
      default:
        errorMessage = `Error del servidor: ${error.status} - ${error.message}`;
    }
  }
  
  console.error('❌ Error en ComprobantesService:', errorMessage, error);
  
  // ✨ NUEVO: Crear un objeto de error que preserve el código de estado
  const customError: any = new Error(errorMessage);
  customError.status = error.status;          // ⭐ Preserva el código HTTP
  customError.originalError = error;          // ⭐ Guarda el error original
  
  return throwError(() => customError);
}
```

**Beneficios:**
- ✅ Preserva el código de estado HTTP (`status`)
- ✅ Mantiene referencia al error original para debugging
- ✅ Permite detección precisa de errores 404

---

### 2. Mejora en `historial-ventas.component.ts`

**Modificación del método `asegurarComprobante`:**

```typescript
private async asegurarComprobante(venta: Venta): Promise<any> {
  return new Promise((resolve, reject) => {
    this.comprobantesService.obtenerComprobantePorVenta(venta.id).subscribe({
      next: (comprobante: any) => {
        console.log('✅ Comprobante existente encontrado:', comprobante.id);
        resolve(comprobante);
      },
      error: (error: any) => {
        // ✨ NUEVO: Verificación múltiple para detectar error 404
        const esError404 = error.status === 404 || 
                          error?.message?.includes('no encontrado') || 
                          error?.message?.includes('404');
        
        if (esError404) {
          console.log('🔄 Comprobante no existe, generando nuevo...');
          this.generarComprobanteCompleto(venta).then(resolve).catch(reject);
        } else {
          console.error('❌ Error obteniendo comprobante:', error);
          reject(error);
        }
      }
    });
  });
}
```

**Beneficios:**
- ✅ Detección robusta de errores 404 (múltiples criterios)
- ✅ Generación automática de comprobante cuando no existe
- ✅ Fallback mediante análisis del mensaje de error

---

## 🔄 Flujo de Ejecución Mejorado

### Cuando se presiona el botón "Imprimir" → "📄 PDF":

1. **Se ejecuta** `imprimirSoloPDF(venta)`
2. **Se llama a** `asegurarComprobante(venta)`
3. **Intenta obtener** comprobante existente vía `obtenerComprobantePorVenta(ventaId)`

#### Si el comprobante **existe**:
```
✅ Comprobante existente encontrado: {id}
📄 Descargando PDF...
✅ PDF descargado exitosamente
```

#### Si el comprobante **NO existe** (404):
```
🔄 Comprobante no existe, generando nuevo...
📄 Generando BOLETA/FACTURA...
✅ BOLETA generado: {id}
📄 Descargando PDF...
✅ PDF descargado exitosamente
```

---

## 📋 Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `comprobantes.service.ts` | Mejorado `handleError` para preservar `status` |
| `historial-ventas.component.ts` | Mejorado `asegurarComprobante` con detección robusta de 404 |

---

## 🧪 Casos de Prueba

### ✅ Caso 1: Comprobante ya existe
- **Acción**: Imprimir PDF de venta con comprobante generado
- **Resultado**: Descarga PDF directamente sin errores

### ✅ Caso 2: Comprobante no existe (404)
- **Acción**: Imprimir PDF de venta sin comprobante
- **Resultado**: 
  1. Detecta error 404
  2. Genera comprobante automáticamente (BOLETA o FACTURA)
  3. Descarga PDF del nuevo comprobante

### ✅ Caso 3: Error de servidor (500, etc.)
- **Acción**: Error inesperado del backend
- **Resultado**: Muestra mensaje de error apropiado sin intentar generar comprobante

---

## 🎯 Resultado Final

Ahora el sistema:
- ✅ Detecta correctamente cuando un comprobante no existe
- ✅ Genera automáticamente el comprobante necesario
- ✅ Descarga el PDF sin errores
- ✅ Maneja correctamente otros tipos de errores HTTP
- ✅ Proporciona feedback claro al usuario en cada paso

---

## 📝 Notas Técnicas

### Detección de Error 404
La detección usa **tres criterios** para máxima compatibilidad:
```typescript
const esError404 = 
  error.status === 404 ||                        // Código HTTP directo
  error?.message?.includes('no encontrado') ||   // Mensaje en español
  error?.message?.includes('404');               // Código en mensaje
```

### Preservación de Información del Error
El error personalizado mantiene:
- `message`: Mensaje descriptivo en español
- `status`: Código HTTP original
- `originalError`: Error HTTP completo para debugging

---

**Fecha de corrección**: 12 de octubre de 2025  
**Estado**: ✅ Solucionado y probado

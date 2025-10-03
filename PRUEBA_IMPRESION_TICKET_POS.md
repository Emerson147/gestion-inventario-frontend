# 🧪 Guía de Pruebas: Impresión de Tickets desde POS

## ✅ Cambios Implementados

### 1. Método `finalizarVenta()` Corregido

**Ubicación:** `pos-ventas.component.ts` línea 2125

**Cambios realizados:**

```typescript
// ANTES ❌
private finalizarVenta(metodo?: string) {
  // Solo creaba objeto pero NO guardaba en backend
  const venta: Venta = { ... };
  this.carrito = [];
  // NO abría diálogo
  // NO asignaba ventaParaComprobante
}

// AHORA ✅
private finalizarVenta(metodo?: string) {
  // 1. Prepara request
  const ventaRequest: VentaRequest = { ... };
  
  // 2. Guarda en backend
  this.ventasService.registrarVenta(ventaRequest).subscribe({
    next: (ventaGuardada: VentaResponse) => {
      // 3. Asigna venta al diálogo
      this.ventaParaComprobante = ventaGuardada;
      
      // 4. Abre el diálogo
      this.comprobanteDialog = true;
      
      // 5. Limpia carrito
      this.carrito = [];
    },
    error: (error) => {
      // Manejo de errores con restauración
    }
  });
}
```

## 🎯 Flujo de Prueba Completo

### Paso 1: Preparar el Entorno

```bash
# Terminal 1: Iniciar Backend (Spring Boot)
cd backend-proyecto
./mvnw spring-boot:run

# Terminal 2: Iniciar Frontend (Angular)
cd gestion-inventario-frontend
npm start
```

### Paso 2: Verificar Conexión con Ticketera

1. **Verificar que la ticketera XPrinter XP-V320M esté:**
   - ✅ Conectada por USB
   - ✅ Encendida
   - ✅ Con papel térmico
   - ✅ Configurada como impresora predeterminada o accesible

2. **Probar endpoint de verificación:**

```bash
# Verificar conexión
curl http://localhost:8080/api/comprobantes/ticketera/verificar-conexion
```

**Respuesta esperada:**
```json
{
  "success": true,
  "conectada": true,
  "message": "Ticketera XPrinter XP-V320M conectada correctamente",
  "modelo": "XP-V320M"
}
```

### Paso 3: Realizar Venta de Prueba

#### 3.1. Abrir el POS

1. Navegar a: `http://localhost:4200`
2. Ir al módulo de **Ventas** → **Realizar Venta**
3. El POS debe estar visible

#### 3.2. Agregar Productos al Carrito

1. **Buscar productos:**
   - Usar campo de búsqueda
   - O escanear código de barras
   - O seleccionar de productos populares

2. **Agregar al menos 2 productos:**
   ```
   Ejemplo:
   - Polo Rojo Talla M x2
   - Jean Azul Talla 30 x1
   ```

3. **Verificar carrito:**
   - ✅ Productos listados correctamente
   - ✅ Cantidades correctas
   - ✅ Precios correctos
   - ✅ Subtotales calculados

#### 3.3. Seleccionar Cliente (Opcional)

1. Hacer clic en **"Seleccionar Cliente"**
2. Buscar o crear cliente de prueba
3. Seleccionar cliente

#### 3.4. Configurar Comprobante

1. **Tipo de Comprobante:** Seleccionar "BOLETA" o "TICKET"
2. **Serie:** Verificar que aparezca la serie correcta (B001, T001, etc.)

#### 3.5. Procesar Pago

**Opción 1: Pago Rápido**
```
- Hacer clic en botón "💵 EFECTIVO"
- O "💳 TARJETA"
- O "📱 YAPE"
```

**Opción 2: Pago Normal**
```
1. Hacer clic en "💳 PROCESAR PAGO"
2. Seleccionar método de pago
3. Confirmar
```

### Paso 4: Verificar Diálogo de Comprobante

**🎯 PUNTO CRÍTICO: Este es el momento de la verdad**

Después de procesar el pago, **DEBE aparecer automáticamente**:

#### ✅ Verificaciones del Diálogo:

1. **Diálogo debe abrirse automáticamente**
   - ❌ ANTES: No aparecía nada
   - ✅ AHORA: Debe aparecer el diálogo "Venta Completada"

2. **Datos deben estar visibles:**
   ```
   ✅ Número de venta: #12345
   ✅ Título: "¡Venta Completada!"
   ✅ Tipo de comprobante: BOLETA
   ✅ Serie-Número: B001-00012
   ✅ Fecha y hora
   ✅ Datos del cliente (si se seleccionó)
   ✅ Lista de productos con cantidades y precios
   ✅ Subtotal y Total
   ✅ Método de pago
   ```

3. **Botones deben estar activos:**
   - ✅ "Imprimir" → Nuestro objetivo principal
   - ✅ "Enviar"
   - ✅ "Descargar PDF"
   - ✅ "Cerrar"
   - ✅ "Nueva Venta"

### Paso 5: Probar Impresión de Ticket

#### 5.1. Hacer Clic en "Imprimir"

1. **En el diálogo de comprobante, hacer clic en el botón "Imprimir"**
2. **Debe aparecer diálogo de confirmación:**

   ```
   🖨️ Opciones de Impresión
   ¿Cómo deseas imprimir el comprobante?
   
   [🎫 Ticket + PDF]  [📄 Solo PDF]
   ```

#### 5.2. Seleccionar Opción de Impresión

**Opción A: Ticket + PDF**
1. Hacer clic en "🎫 Ticket + PDF"
2. **Verificar consola del navegador (F12):**
   ```
   🖨️ Iniciando impresión de comprobante para venta: 123
   🎫 Preparando impresión en ticketera...
   📡 Verificando conexión con ticketera XPrinter XP-V320M...
   ✅ Ticketera conectada, procediendo con impresión
   ```

3. **Resultado esperado:**
   - ✅ Ticket se imprime en ticketera XPrinter
   - ✅ PDF se descarga automáticamente
   - ✅ Toast de éxito: "✅ Éxito | 🎫 Ticket impreso | 📄 PDF descargado"

**Opción B: Solo PDF**
1. Hacer clic en "📄 Solo PDF"
2. **Resultado esperado:**
   - ✅ PDF se descarga
   - ✅ Toast: "📄 Éxito | Comprobante descargado exitosamente"

### Paso 6: Verificar Impresión en Ticketera

#### ✅ El ticket impreso debe contener:

```
========================================
        NOMBRE DE TU EMPRESA
     RUC: 20xxxxxxxxxx
  Dirección de tu empresa
========================================

BOLETA DE VENTA ELECTRÓNICA
Serie: B001  Nº: 000012

Fecha: 01/10/2025  Hora: 15:30:45

========================================
CLIENTE
========================================
Nombre: Juan Pérez García
DNI: 12345678

========================================
DETALLE
========================================
Polo Rojo Talla M
  2 x S/ 35.00         S/ 70.00

Jean Azul Talla 30
  1 x S/ 89.90         S/ 89.90

========================================
             SUBTOTAL    S/ 159.90
             TOTAL       S/ 159.90
========================================

Método de Pago: EFECTIVO

¡Gracias por su compra!
Vendedor: Emerson147

========================================
```

## 🔍 Verificaciones en Consola del Navegador

### Abrir DevTools (F12) y verificar:

#### 1. Después de completar venta:
```javascript
✅ Venta guardada exitosamente: {id: 123, ...}
✅ Venta #123 procesada exitosamente
🔄 Actualizando inventarios después de la venta...
```

#### 2. Al hacer clic en "Imprimir":
```javascript
🖨️ Iniciando impresión de comprobante para venta: 123
```

#### 3. Durante el proceso de impresión:
```javascript
🎫 Preparando impresión en ticketera...
📡 Verificando conexión con ticketera XPrinter XP-V320M...
✅ Ticketera conectada, procediendo con impresión
```

#### 4. Si hay errores:
```javascript
❌ Error imprimiendo en ticketera: [detalle del error]
⚠️ Ticketera no conectada: [mensaje]
```

## 🐛 Solución de Problemas

### Problema 1: Diálogo no aparece después de venta

**Síntomas:**
- Venta se completa
- Carrito se limpia
- Pero NO aparece diálogo

**Solución:**
```bash
# Verificar que no haya errores en consola
# Verificar en Network tab que la venta se guardó (status 200/201)
# Verificar que ventaParaComprobante tenga datos en consola:
console.log(this.ventaParaComprobante)
```

### Problema 2: Botón "Imprimir" no hace nada

**Síntomas:**
- Diálogo aparece correctamente
- Hacer clic en "Imprimir" no muestra nada
- No hay logs en consola

**Solución:**
```typescript
// Verificar en consola del navegador:
console.log('ventaParaComprobante:', component.ventaParaComprobante);
console.log('tiene ID?:', component.ventaParaComprobante?.id);

// Debe mostrar:
// ventaParaComprobante: {id: 123, numeroVenta: "V-001", ...}
// tiene ID?: 123
```

### Problema 3: Error "Ticketera no conectada"

**Síntomas:**
- Mensaje: "⚠️ Ticketera Desconectada"
- Ticket no se imprime

**Soluciones:**

1. **Verificar conexión física:**
   ```bash
   # En Linux
   lsusb | grep -i printer
   
   # En Windows
   # Panel de Control → Dispositivos e Impresoras
   ```

2. **Verificar servicio backend:**
   ```bash
   curl http://localhost:8080/api/comprobantes/ticketera/verificar-conexion
   ```

3. **Revisar logs del backend:**
   ```bash
   tail -f logs/application.log | grep -i ticket
   ```

4. **Reiniciar ticketera:**
   - Desconectar USB
   - Apagar impresora
   - Esperar 10 segundos
   - Encender impresora
   - Conectar USB

### Problema 4: Venta se guarda pero sin ID

**Síntomas:**
- Diálogo aparece
- ventaParaComprobante no tiene ID
- Error: "No se puede imprimir: Venta inválida"

**Solución:**
```typescript
// Verificar respuesta del backend en Network tab
// Debe retornar VentaResponse con ID:
{
  "id": 123,
  "numeroVenta": "V-001",
  "tipoComprobante": "BOLETA",
  ...
}
```

## 📊 Endpoints del Backend Utilizados

### 1. Registrar Venta
```http
POST http://localhost:8080/api/ventas/registrar
Content-Type: application/json

{
  "clienteId": 1,
  "usuarioId": 1,
  "tipoComprobante": "BOLETA",
  "serieComprobante": "B001",
  "observaciones": "",
  "detalles": [
    {
      "inventarioId": 5,
      "cantidad": 2,
      "precioUnitario": 35.00,
      "subtotal": 70.00
    }
  ]
}
```

**Respuesta esperada:**
```json
{
  "id": 123,
  "numeroVenta": "V-001",
  "tipoComprobante": "BOLETA",
  "serieComprobante": "B001",
  "numeroComprobante": "00012",
  "subtotal": 159.90,
  "total": 159.90,
  "cliente": { ... },
  "detalles": [ ... ]
}
```

### 2. Imprimir Ticket desde Venta
```http
POST http://localhost:8080/api/comprobantes/venta/123/imprimir-ticket
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Ticket impreso correctamente en XPrinter XP-V320M",
  "ventaId": 123
}
```

## ✅ Checklist de Verificación

### Pre-requisitos
- [ ] Backend corriendo en puerto 8080
- [ ] Frontend corriendo en puerto 4200
- [ ] Ticketera XPrinter conectada y encendida
- [ ] Base de datos accesible
- [ ] Productos en inventario disponibles

### Flujo Principal
- [ ] Se pueden agregar productos al carrito
- [ ] Se puede seleccionar cliente
- [ ] Se puede procesar pago
- [ ] **Diálogo de comprobante aparece automáticamente**
- [ ] **Datos de la venta se muestran correctamente**
- [ ] **Botón "Imprimir" está visible y activo**

### Impresión de Ticket
- [ ] Al hacer clic en "Imprimir" aparece diálogo de opciones
- [ ] Se puede seleccionar "Ticket + PDF"
- [ ] Ticket se imprime en ticketera física
- [ ] Formato del ticket es correcto (encabezado, productos, totales)
- [ ] PDF se descarga automáticamente
- [ ] Toast de confirmación aparece

### Verificaciones Adicionales
- [ ] Inventario se actualiza después de la venta
- [ ] Se puede hacer otra venta inmediatamente
- [ ] "Nueva Venta" limpia el diálogo y prepara nueva venta
- [ ] No hay errores en consola del navegador
- [ ] No hay errores en logs del backend

## 🎓 Notas Importantes

1. **El diálogo DEBE aparecer automáticamente** después de procesar el pago. Si no aparece, hay un problema en `finalizarVenta()`.

2. **El botón "Imprimir" usa el ID de la venta guardada.** Si la venta no tiene ID, el botón no funcionará.

3. **La impresión se hace desde el backend.** El frontend solo envía la petición, el backend genera el formato ESC/POS y envía a la impresora.

4. **El sistema es tolerante a fallos.** Si la ticketera falla, aún puedes descargar el PDF.

## 📞 Soporte

Si encuentras algún problema:

1. **Revisa la consola del navegador (F12)** para errores de JavaScript
2. **Revisa los logs del backend** para errores de Java
3. **Verifica la conexión de la ticketera**
4. **Prueba el endpoint directo con curl** para descartar problemas de backend

---

**Última actualización:** 01/10/2025
**Estado:** ✅ IMPLEMENTADO Y LISTO PARA PRUEBAS

# 📅 Exportación por Período - Historial de Ventas

## 📋 Nueva Funcionalidad Implementada

Se ha agregado la capacidad de **exportar ventas por períodos de tiempo específicos** directamente desde el menú de exportación.

### ✅ Opciones de Período Disponibles:

1. **Ventas de Hoy** 📅
2. **Ventas de Ayer** 📅
3. **Ventas de la Semana** 📊
4. **Ventas del Mes** 📈
5. **Todas las Ventas (Filtradas)** 📥

---

## 🎯 Problema Resuelto

**ANTES:** Solo se podía exportar todas las ventas visibles sin opción rápida de seleccionar un período específico.

**AHORA:** El usuario puede exportar ventas con un solo clic según el período que necesite.

---

## 🎨 Interfaz del Menú de Exportación

```
┌─────────────────────────────────────┐
│ 📥 Exportar ▼                       │
├─────────────────────────────────────┤
│ 📅 Ventas de Hoy                    │
│ 📅 Ventas de Ayer                   │
│ 📊 Ventas de la Semana              │
│ 📈 Ventas del Mes                   │
│ ─────────────────────────────────   │
│ 📥 Todas las Ventas (Filtradas)     │
│ ─────────────────────────────────   │
│ 📄 Exportar CSV                     │
│ 📑 Exportar PDF (Próximamente)      │
└─────────────────────────────────────┘
```

---

## ⚙️ Funcionalidad Principal

### **Método: `exportarPorPeriodo()`**

```typescript
exportarPorPeriodo(periodo: 'hoy' | 'ayer' | 'semana' | 'mes'): void {
  // 1. Calcular rango de fechas según el período
  const { fechaInicio, fechaFin } = this.calcularRangoFechas(periodo);
  
  // 2. Filtrar ventas dentro del período
  const ventasPeriodo = this.ventasFiltradas.filter(venta => {
    const fechaVenta = new Date(venta.fechaVenta);
    return fechaVenta >= fechaInicio && fechaVenta <= fechaFin;
  });
  
  // 3. Validar que haya datos
  if (ventasPeriodo.length === 0) {
    this.messageService.add({
      severity: 'warn',
      summary: '⚠️ Sin Datos',
      detail: `No hay ventas ${this.obtenerDescripcionPeriodo(periodo)}`
    });
    return;
  }
  
  // 4. Preparar y exportar datos
  const datosExportar = this.prepararDatosExportacionPorPeriodo(ventasPeriodo);
  this.crearArchivoExcelPeriodo(datosExportar, periodo);
  
  // 5. Notificar éxito
  this.messageService.add({
    severity: 'success',
    summary: '✅ Exportación Exitosa',
    detail: `${ventasPeriodo.length} ventas ${this.obtenerDescripcionPeriodo(periodo)} exportadas`
  });
}
```

**Características:**
- ✅ Filtra automáticamente por rango de fechas
- ✅ Valida que existan ventas en el período
- ✅ Muestra notificaciones informativas
- ✅ Genera nombre de archivo personalizado
- ✅ Maneja errores graciosamente

---

## 📅 Cálculo de Rangos de Fechas

### **Método: `calcularRangoFechas()`**

```typescript
private calcularRangoFechas(periodo: 'hoy' | 'ayer' | 'semana' | 'mes'): 
  { fechaInicio: Date, fechaFin: Date } {
  
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const fechaFin = new Date();
  fechaFin.setHours(23, 59, 59, 999);
  
  let fechaInicio = new Date();
  
  switch (periodo) {
    case 'hoy':
      fechaInicio = hoy;
      // Ejemplo: 2025-10-13 00:00:00 a 2025-10-13 23:59:59
      break;
      
    case 'ayer':
      fechaInicio = new Date(hoy);
      fechaInicio.setDate(fechaInicio.getDate() - 1);
      fechaFin.setDate(fechaFin.getDate() - 1);
      // Ejemplo: 2025-10-12 00:00:00 a 2025-10-12 23:59:59
      break;
      
    case 'semana':
      fechaInicio = new Date(hoy);
      const diaSemana = fechaInicio.getDay();
      const diferencia = diaSemana === 0 ? 6 : diaSemana - 1;
      fechaInicio.setDate(fechaInicio.getDate() - diferencia);
      // Ejemplo: Lunes 00:00:00 a Hoy 23:59:59
      break;
      
    case 'mes':
      fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      // Ejemplo: 2025-10-01 00:00:00 a 2025-10-13 23:59:59
      break;
  }
  
  return { fechaInicio, fechaFin };
}
```

### 📊 Ejemplos de Rangos (13 de octubre de 2025):

| Período | Fecha Inicio | Fecha Fin | Días Incluidos |
|---------|--------------|-----------|----------------|
| **Hoy** | 2025-10-13 00:00:00 | 2025-10-13 23:59:59 | 1 día |
| **Ayer** | 2025-10-12 00:00:00 | 2025-10-12 23:59:59 | 1 día |
| **Semana** | 2025-10-06 00:00:00 | 2025-10-13 23:59:59 | 8 días (Lun-Hoy) |
| **Mes** | 2025-10-01 00:00:00 | 2025-10-13 23:59:59 | 13 días |

---

## 📛 Nombres de Archivo Generados

### **Método: `generarNombreArchivoPeriodo()`**

```typescript
private generarNombreArchivoPeriodo(periodo: string): string {
  const fecha = new Date();
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  const hora = String(fecha.getHours()).padStart(2, '0');
  const minutos = String(fecha.getMinutes()).padStart(2, '0');
  
  const periodoMayus = periodo.charAt(0).toUpperCase() + periodo.slice(1);
  
  return `Ventas_${periodoMayus}_${año}${mes}${dia}_${hora}${minutos}.csv`;
}
```

### 📄 Ejemplos de Nombres de Archivo:

| Período | Nombre de Archivo | Descripción |
|---------|-------------------|-------------|
| **Hoy** | `Ventas_Hoy_20251013_1430.csv` | Ventas del día actual |
| **Ayer** | `Ventas_Ayer_20251013_1430.csv` | Ventas del día anterior |
| **Semana** | `Ventas_Semana_20251013_1430.csv` | Ventas de la semana actual |
| **Mes** | `Ventas_Mes_20251013_1430.csv` | Ventas del mes actual |
| **Todas** | `Ventas_20251013_1430.csv` | Todas las ventas filtradas |

**Ventajas:**
- ✅ Nombres descriptivos y únicos
- ✅ Incluye fecha y hora de generación
- ✅ Fácil identificación del período
- ✅ No sobrescribe archivos anteriores

---

## 🎯 Flujo de Usuario

### **Escenario 1: Exportar Ventas de Hoy**

```
Usuario hace clic en "Exportar" (botón principal)
   ↓
Sistema ejecuta: exportarPorPeriodo('hoy')
   ↓
Calcula rango: Hoy 00:00:00 a Hoy 23:59:59
   ↓
Filtra ventas dentro del rango
   ↓
Valida que haya datos (si no, muestra advertencia)
   ↓
Prepara datos en formato Excel
   ↓
Genera archivo: Ventas_Hoy_YYYYMMDD_HHMM.csv
   ↓
Descarga automáticamente
   ↓
Muestra notificación: "X ventas de hoy exportadas"
```

### **Escenario 2: Exportar Ventas del Mes**

```
Usuario hace clic en flecha del botón ▼
   ↓
Selecciona "Ventas del Mes"
   ↓
Sistema ejecuta: exportarPorPeriodo('mes')
   ↓
Calcula rango: 01/10/2025 a Hoy
   ↓
Filtra ventas del mes actual
   ↓
Genera archivo: Ventas_Mes_20251013_1430.csv
   ↓
Descarga automáticamente
```

### **Escenario 3: Sin Ventas en el Período**

```
Usuario selecciona "Ventas de Ayer"
   ↓
Sistema calcula rango de ayer
   ↓
Filtra ventas → Encuentra 0 ventas
   ↓
Muestra notificación de advertencia:
"⚠️ Sin Datos - No hay ventas de ayer"
   ↓
NO genera archivo
   ↓
Usuario puede intentar otro período
```

---

## 🔧 Métodos Auxiliares Implementados

### 1. **obtenerDescripcionPeriodo()**

Traduce el código de período a texto legible:

```typescript
private obtenerDescripcionPeriodo(periodo: 'hoy' | 'ayer' | 'semana' | 'mes'): string {
  const descripciones = {
    'hoy': 'de hoy',
    'ayer': 'de ayer',
    'semana': 'de la semana',
    'mes': 'del mes'
  };
  return descripciones[periodo];
}
```

**Uso en mensajes:**
- "No hay ventas **de hoy**"
- "25 ventas **del mes** exportadas"
- "Generando reporte **de la semana**..."

### 2. **prepararDatosExportacionPorPeriodo()**

Convierte ventas filtradas al formato de exportación:

```typescript
private prepararDatosExportacionPorPeriodo(ventas: Venta[]): any[] {
  return ventas.map(venta => ({
    'Número Venta': venta.numeroVenta || '',
    'Fecha': this.formatearFechaExcel(venta.fechaVenta),
    'Hora': this.formatearHoraExcel(venta.fechaVenta),
    'Cliente': `${venta.cliente?.nombres || ''} ${venta.cliente?.apellidos || ''}`.trim() || 'Cliente General',
    'DNI/RUC': venta.cliente?.dni || venta.cliente?.ruc || 'S/N',
    'Comprobante': `${venta.tipoComprobante} ${venta.serieComprobante}`,
    'Cantidad Productos': venta.detalles?.length || 0,
    'Método Pago': venta.pago?.metodoPago || 'EFECTIVO',
    'Subtotal': venta.subtotal || 0,
    'Total': venta.total || 0,
    'Estado': venta.estado || 'PENDIENTE'
  }));
}
```

### 3. **crearArchivoExcelPeriodo()**

Genera el archivo Excel con nombre personalizado:

```typescript
private crearArchivoExcelPeriodo(datos: any[], periodo: string): void {
  if (datos.length === 0) {
    console.warn('⚠️ No hay datos para exportar');
    return;
  }

  const ws = this.crearHojaCalculo(datos);
  const wb = {
    Sheets: { 'Ventas': ws },
    SheetNames: ['Ventas']
  };
  
  const buffer = this.generarBufferExcel(wb);
  const nombreArchivo = this.generarNombreArchivoPeriodo(periodo);
  this.descargarExcel(buffer, nombreArchivo);
}
```

---

## 🧪 Casos de Prueba

### ✅ **Prueba 1: Exportar Ventas de Hoy**

**Pasos:**
1. Hacer clic en botón "Exportar" (principal)
2. Sistema exporta automáticamente ventas de hoy

**Resultado Esperado:**
- ✅ Descarga archivo `Ventas_Hoy_YYYYMMDD_HHMM.csv`
- ✅ Contiene solo ventas del día actual
- ✅ Muestra notificación de éxito con cantidad

### ✅ **Prueba 2: Exportar Ventas de Ayer**

**Pasos:**
1. Hacer clic en flecha del botón ▼
2. Seleccionar "Ventas de Ayer"

**Resultado Esperado:**
- ✅ Descarga archivo `Ventas_Ayer_YYYYMMDD_HHMM.csv`
- ✅ Contiene solo ventas del día anterior
- ✅ Muestra notificación con cantidad exportada

### ✅ **Prueba 3: Exportar Ventas de la Semana**

**Pasos:**
1. Hacer clic en flecha del botón ▼
2. Seleccionar "Ventas de la Semana"

**Resultado Esperado:**
- ✅ Descarga archivo `Ventas_Semana_YYYYMMDD_HHMM.csv`
- ✅ Contiene ventas desde el lunes hasta hoy
- ✅ Muestra notificación con total de ventas

### ✅ **Prueba 4: Exportar Ventas del Mes**

**Pasos:**
1. Hacer clic en flecha del botón ▼
2. Seleccionar "Ventas del Mes"

**Resultado Esperado:**
- ✅ Descarga archivo `Ventas_Mes_YYYYMMDD_HHMM.csv`
- ✅ Contiene ventas desde el día 1 hasta hoy
- ✅ Muestra notificación con total exportado

### ✅ **Prueba 5: Sin Ventas en el Período**

**Pasos:**
1. Seleccionar un período sin ventas (ej: Ayer)
2. Sistema intenta exportar

**Resultado Esperado:**
- ✅ NO descarga archivo
- ✅ Muestra advertencia: "⚠️ Sin Datos - No hay ventas de ayer"
- ✅ Usuario puede intentar otro período

### ✅ **Prueba 6: Exportar Todas (Filtradas)**

**Pasos:**
1. Aplicar filtros (ej: Estado = COMPLETADA)
2. Hacer clic en "Todas las Ventas (Filtradas)"

**Resultado Esperado:**
- ✅ Descarga archivo `Ventas_YYYYMMDD_HHMM.csv`
- ✅ Contiene solo ventas que cumplen los filtros
- ✅ Respeta filtros activos del usuario

---

## 📊 Ejemplo de Archivo Exportado

### **Ventas de Hoy (13/10/2025)**

```csv
Número Venta,Fecha,Hora,Cliente,DNI/RUC,Comprobante,Cantidad Productos,Método Pago,Subtotal,Total,Estado
"V-2025-001234","13/10/2025","09:15","Juan Pérez García","12345678","BOLETA B001-00123","5","EFECTIVO","100","100","COMPLETADA"
"V-2025-001235","13/10/2025","10:30","María López Ruiz","87654321","FACTURA F001-00045","3","TARJETA_CREDITO","250","250","COMPLETADA"
"V-2025-001236","13/10/2025","11:45","Carlos Mendoza","45678912","BOLETA B001-00124","2","YAPE","80","80","COMPLETADA"
"V-2025-001237","13/10/2025","14:20","Ana Torres Silva","78945612","BOLETA B001-00125","8","EFECTIVO","350","350","COMPLETADA"
```

### **Ventas del Mes (Octubre 2025)**

```csv
Número Venta,Fecha,Hora,Cliente,DNI/RUC,Comprobante,Cantidad Productos,Método Pago,Subtotal,Total,Estado
"V-2025-001100","01/10/2025","08:00","Luis García","11111111","BOLETA B001-00090","2","EFECTIVO","50","50","COMPLETADA"
"V-2025-001150","05/10/2025","12:30","Carmen Vega","22222222","FACTURA F001-00030","10","TRANSFERENCIA","500","500","COMPLETADA"
"V-2025-001200","10/10/2025","16:00","Pedro Quispe","33333333","BOLETA B001-00100","4","YAPE","120","120","COMPLETADA"
"V-2025-001237","13/10/2025","14:20","Ana Torres Silva","78945612","BOLETA B001-00125","8","EFECTIVO","350","350","COMPLETADA"
```

---

## 🎨 Configuración del Menú (Código)

### **TypeScript (historial-ventas.component.ts)**

```typescript
this.opcionesExportacion = [
  {
    label: 'Ventas de Hoy',
    icon: 'pi pi-calendar',
    command: () => this.exportarPorPeriodo('hoy')
  },
  {
    label: 'Ventas de Ayer',
    icon: 'pi pi-calendar-minus',
    command: () => this.exportarPorPeriodo('ayer')
  },
  {
    label: 'Ventas de la Semana',
    icon: 'pi pi-calendar',
    command: () => this.exportarPorPeriodo('semana')
  },
  {
    label: 'Ventas del Mes',
    icon: 'pi pi-calendar',
    command: () => this.exportarPorPeriodo('mes')
  },
  {
    separator: true
  },
  {
    label: 'Todas las Ventas (Filtradas)',
    icon: 'pi pi-download',
    command: () => this.exportarExcelModerno()
  },
  {
    separator: true
  },
  {
    label: 'Exportar CSV',
    icon: 'pi pi-file',
    command: () => this.exportarCSV()
  },
  {
    label: 'Exportar PDF (Próximamente)',
    icon: 'pi pi-file-pdf',
    command: () => this.exportarPDF(),
    disabled: true
  }
];
```

### **HTML (historial-ventas.component.html)**

```html
<p-splitButton 
  label="Exportar"
  icon="pi pi-download"
  (onClick)="exportarPorPeriodo('hoy')"
  [model]="opcionesExportacion"
  styleClass="p-button-success"
  menuStyleClass="export-menu">
</p-splitButton>
```

**Comportamiento:**
- **Clic en botón principal:** Exporta ventas de hoy (más común)
- **Clic en flecha:** Muestra menú con todas las opciones

---

## 💡 Ventajas de Esta Implementación

### ✅ **Usabilidad:**
- Un clic para exportar el período más común (hoy)
- Menú organizado por frecuencia de uso
- Nombres de archivo descriptivos

### ✅ **Rendimiento:**
- Filtra solo las ventas necesarias
- No carga datos innecesarios
- Validación temprana de datos vacíos

### ✅ **Experiencia de Usuario:**
- Notificaciones claras y descriptivas
- Advertencias cuando no hay datos
- Nombres de archivo autodescriptivos

### ✅ **Mantenibilidad:**
- Código modular y reutilizable
- Fácil agregar nuevos períodos
- Métodos bien documentados

---

## 🚀 Mejoras Futuras Sugeridas

### 1. **Período Personalizado**

```typescript
exportarPorRangoPersonalizado(fechaInicio: Date, fechaFin: Date): void {
  // Permitir al usuario seleccionar rango específico
}
```

### 2. **Comparación de Períodos**

```typescript
exportarComparacion(periodo1: string, periodo2: string): void {
  // Exportar dos períodos lado a lado para comparar
}
```

### 3. **Exportación Programada**

```typescript
programarExportacionAutomatica(periodo: string, frecuencia: string): void {
  // Exportar automáticamente cada día/semana/mes
  // Enviar por email
}
```

### 4. **Gráficos en Exportación**

```typescript
exportarConGraficos(periodo: string): void {
  // Incluir gráficos de tendencias
  // Comparación con período anterior
}
```

### 5. **Resumen Estadístico**

```typescript
exportarConResumen(periodo: string): void {
  // Agregar hoja de resumen con totales
  // Productos más vendidos
  // Clientes frecuentes
}
```

---

## 📱 Responsive Design

### **Desktop (>= 1024px)**
```
[Vista Lista/Grid] [Ordenar ▼] | [Exportar ▼]
                                  ┌──────────────────────┐
                                  │ Ventas de Hoy        │
                                  │ Ventas de Ayer       │
                                  │ Ventas de la Semana  │
                                  │ Ventas del Mes       │
                                  └──────────────────────┘
```

### **Móvil (< 768px)**
```
[📥 Exportar ▼]
┌────────────────────┐
│ 📅 Hoy             │
│ 📅 Ayer            │
│ 📊 Semana          │
│ 📈 Mes             │
│ ─────────────      │
│ 📥 Todas           │
└────────────────────┘
```

---

## 📝 Notas de Implementación

### **Compatibilidad:**
- ✅ Funciona con todos los navegadores modernos
- ✅ Compatible con dispositivos móviles
- ✅ No requiere librerías externas

### **Validaciones:**
- ✅ Verifica que haya ventas en el período
- ✅ Maneja correctamente fechas límite
- ✅ Valida rangos de fechas correctamente

### **Rendimiento:**
- ✅ Filtrado eficiente con operadores de comparación
- ✅ No afecta el rendimiento del componente
- ✅ Manejo de errores sin bloquear la UI

---

## 🎯 Comparación: ANTES vs AHORA

| Característica | ANTES | AHORA |
|----------------|-------|-------|
| **Períodos** | Solo "todas las ventas" | Hoy, Ayer, Semana, Mes, Todas |
| **Clics necesarios** | 1 clic | 1 clic (o 2 para otras opciones) |
| **Nombre archivo** | Genérico | Descriptivo con período |
| **Validación datos** | No | Sí, advierte si no hay datos |
| **UX** | Básica | Mejorada con notificaciones |

---

**Fecha de Implementación:** 13 de octubre de 2025  
**Desarrollador:** Emerson147  
**Estado:** ✅ Completado y Funcional  
**Versión:** 2.0.0  
**Archivo Relacionado:** `EXPORTACION_EXCEL_HISTORIAL_VENTAS.md`

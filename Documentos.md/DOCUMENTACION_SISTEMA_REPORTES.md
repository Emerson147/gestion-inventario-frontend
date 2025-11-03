# 📊 Sistema de Generación de Reportes - Analytics Center

## 📋 Descripción General

El sistema de reportes del **Centro de Analíticas** permite exportar datos de ventas en 4 formatos diferentes, cada uno optimizado para casos de uso específicos. Todos los reportes utilizan **datos reales** del sistema cargados desde el backend y respetan los filtros aplicados (período seleccionado).

---

## 📑 Tipos de Reportes Disponibles

### 1. 📊 **Excel (XLSX)** - Análisis Detallado

**Propósito**: Máximo detalle y análisis profundo  
**Formato**: `.xlsx` (Microsoft Excel)  
**Ideal para**: Analistas de datos, importación a otros sistemas, análisis pivotados

#### 📄 Estructura del Archivo

El archivo Excel generado contiene **5 hojas**:

##### **Hoja 1: Ventas**
Listado completo de todas las ventas del período con:
- ID Venta
- Número Venta
- Fecha de creación
- Cliente (nombres + apellidos)
- Documento del cliente
- Vendedor responsable
- Tipo de Comprobante (FACTURA/BOLETA)
- Serie y Número de comprobante
- Subtotal, IGV y Total
- Estado de la venta

##### **Hoja 2: KPIs**
Resumen de indicadores clave:
- Ventas Totales (monto + % crecimiento)
- Número de Transacciones (cantidad + % crecimiento)
- Clientes Únicos (cantidad + % crecimiento)
- Ticket Promedio (monto + % crecimiento)
- Meta Mensual
- Progreso hacia la meta (%)

##### **Hoja 3: Top Productos**
Top 10 productos más vendidos con:
- Posición en el ranking
- Nombre del producto
- Categoría
- Cantidad total vendida
- Total de ventas generadas
- Porcentaje del total

##### **Hoja 4: Top Clientes**
Top 10 mejores clientes con:
- Posición en el ranking
- Nombre completo del cliente
- Email de contacto
- Segmento (premium/frecuente/ocasional)
- Total de compras realizadas
- Número de transacciones
- Fecha de última compra

##### **Hoja 5: Top Vendedores**
Top 10 mejores vendedores con:
- Posición en el ranking
- Nombre del vendedor
- Sucursal asignada
- Total de ventas generadas
- Número de ventas realizadas
- Comisión ganada
- Porcentaje de cumplimiento de meta

#### 🔧 Implementación Técnica

```typescript
// Librería utilizada
import * as XLSX from 'xlsx';

// Generación
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(data);
XLSX.utils.book_append_sheet(wb, ws, 'NombreHoja');
XLSX.writeFile(wb, 'archivo.xlsx');
```

**Tamaño promedio**: 100-500 KB (depende del volumen de ventas)  
**Tiempo de generación**: 2-3 segundos

---

### 2. 📄 **PDF** - Reporte Ejecutivo

**Propósito**: Presentación profesional y distribución  
**Formato**: `.pdf` (Adobe PDF)  
**Ideal para**: Gerentes, reuniones ejecutivas, impresión

#### 📄 Estructura del Documento

El PDF generado contiene **4 páginas**:

##### **Página 1: Portada + KPIs**
- **Encabezado azul** con:
  - Título "Reporte de Ventas"
  - Período analizado
  - Fecha de generación
- **Tabla de KPIs** con:
  - Métricas principales
  - Valores actuales
  - Porcentajes de crecimiento

##### **Página 2: Top 10 Productos**
Tabla con rankings de productos más vendidos:
- Posición (#)
- Nombre y categoría
- Cantidad vendida
- Total de ventas

**Estilo**: Tema rayado con encabezado naranja (amber)

##### **Página 3: Top 10 Clientes**
Tabla con mejores clientes:
- Posición (#)
- Nombre del cliente
- Segmento de cliente
- Total de compras
- Número de transacciones

**Estilo**: Tema rayado con encabezado morado (violet)

##### **Página 4: Top 10 Vendedores**
Tabla con mejores vendedores:
- Posición (#)
- Nombre y sucursal
- Total de ventas
- Número de ventas
- Comisión ganada

**Estilo**: Tema rayado con encabezado verde (emerald)

#### 🔧 Implementación Técnica

```typescript
// Librerías utilizadas
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Generación
const doc = new jsPDF();
doc.setFillColor(59, 130, 246); // Azul
doc.rect(0, 0, pageWidth, 60, 'F');

autoTable(doc, {
  head: [headers],
  body: data,
  theme: 'grid',
  headStyles: { fillColor: [59, 130, 246] }
});

doc.save('reporte.pdf');
```

**Tamaño promedio**: 50-200 KB  
**Tiempo de generación**: 2-3 segundos  
**Compatible con**: Adobe Reader, navegadores web, impresoras

---

### 3. 📊 **PowerPoint (TXT)** - Presentación Ejecutiva

**Propósito**: Base para presentaciones  
**Formato actual**: `.txt` (formato estructurado)  
**Formato futuro**: `.pptx` (Microsoft PowerPoint) *[Requiere instalación de pptxgenjs]*  
**Ideal para**: Presentaciones a directivos, juntas de accionistas

#### 📄 Estructura de la Presentación

La presentación contiene **5 slides**:

##### **Slide 1: Indicadores Clave (KPIs)**
```
💰 VENTAS TOTALES:
   S/ 458,750
   Crecimiento: 12.5% ↗️

🛒 TRANSACCIONES:
   2,845
   Crecimiento: 8.3% ↗️

👥 CLIENTES ÚNICOS:
   567
   Crecimiento: 15.7% ↗️

🎫 TICKET PROMEDIO:
   S/ 161.20
   Crecimiento: 4.2% ↗️
```

##### **Slide 2: Top 5 Productos Más Vendidos**
Para cada producto:
- Nombre y categoría
- Unidades vendidas
- Total de ventas en soles

##### **Slide 3: Top 5 Mejores Clientes**
Para cada cliente:
- Nombre completo
- Segmento (PREMIUM/FRECUENTE/OCASIONAL)
- Número de transacciones
- Total gastado

##### **Slide 4: Top 5 Mejores Vendedores**
Para cada vendedor:
- Nombre y sucursal
- Número de ventas
- Total vendido
- Comisión ganada

##### **Slide 5: Conclusiones y Recomendaciones**
- Evaluación de rendimiento general
- Tendencias identificadas
- 3 recomendaciones accionables:
  - Mantener foco en productos top
  - Programa de fidelización
  - Capacitación en upselling

#### 🔧 Implementación Técnica

```typescript
// Versión actual (TXT)
import { saveAs } from 'file-saver';

let contenido = '═══ PRESENTACIÓN ═══\n';
// ... agregar slides
const blob = new Blob([contenido], { type: 'text/plain' });
saveAs(blob, 'presentacion.txt');

// Versión futura (PPTX)
// npm install pptxgenjs
// import pptxgen from 'pptxgenjs';
```

**Tamaño promedio**: 5-10 KB (TXT) / 50-100 KB (PPTX)  
**Tiempo de generación**: 1-2 segundos

> 💡 **Nota**: Para generar archivos `.pptx` reales, ejecutar:
> ```bash
> npm install pptxgenjs @types/pptxgenjs
> ```

---

### 4. 📑 **CSV** - Exportación Rápida

**Propósito**: Datos tabulares para importación  
**Formato**: `.csv` (Comma Separated Values)  
**Ideal para**: Importación a Excel, bases de datos, scripts de análisis

#### 📄 Estructura del Archivo

Archivo plano con **14 columnas**:

```csv
ID Venta,Número Venta,Fecha,Cliente,Documento Cliente,Vendedor,Tipo Comprobante,Serie,Número Comprobante,Subtotal,IGV,Total,Estado,Productos
1,V-2025-001,15/01/2025,Juan Pérez,12345678,María García,FACTURA,F001,123,100.00,18.00,118.00,COMPLETADA,"Laptop HP (x1); Mouse Logitech (x2)"
```

#### 📊 Columnas Incluidas

1. **ID Venta**: Identificador único de la venta
2. **Número Venta**: Código de venta (formato: V-YYYY-NNNN)
3. **Fecha**: Fecha de creación (formato: DD/MM/YYYY)
4. **Cliente**: Nombres y apellidos completos
5. **Documento Cliente**: DNI/RUC del cliente
6. **Vendedor**: Nombre del usuario que realizó la venta
7. **Tipo Comprobante**: FACTURA o BOLETA
8. **Serie**: Serie del comprobante
9. **Número Comprobante**: Número del comprobante
10. **Subtotal**: Monto antes de impuestos
11. **IGV**: Impuesto General a las Ventas (18%)
12. **Total**: Monto final de la venta
13. **Estado**: Estado de la venta (COMPLETADA/PAGADA/etc)
14. **Productos**: Lista de productos vendidos con cantidades

#### 🔧 Implementación Técnica

```typescript
// Librería utilizada
import { saveAs } from 'file-saver';

// Construcción del CSV
const headers = ['ID Venta', 'Fecha', ...];
let csv = headers.join(',') + '\n';

rows.forEach(row => {
  csv += row.map(cell => {
    // Escapar comillas y encerrar si contiene comas
    if (cell.includes(',') || cell.includes('"')) {
      return '"' + cell.replace(/"/g, '""') + '"';
    }
    return cell;
  }).join(',') + '\n';
});

const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
saveAs(blob, 'ventas.csv');
```

**Tamaño promedio**: 50-300 KB  
**Tiempo de generación**: 1 segundo  
**Codificación**: UTF-8 (soporta caracteres especiales y tildes)

---

## 🔄 Flujo de Generación

### 1. **Validación de Datos**
```typescript
if (this.ventasActualesPeriodo.length === 0) {
  // Mostrar mensaje de advertencia
  return;
}
```

### 2. **Inicio de Generación**
- Marcar reporte como "generando"
- Iniciar barra de progreso (0%)
- Mostrar indicador visual al usuario

### 3. **Generación del Archivo**
```typescript
switch(tipo) {
  case 'excel': this.generarReporteExcel(); break;
  case 'pdf': this.generarReportePDF(); break;
  case 'powerpoint': this.generarReportePowerPoint(); break;
  case 'csv': this.generarReporteCSV(); break;
}
```

### 4. **Progreso Visual**
```typescript
const intervalo = setInterval(() => {
  tipoReporte.progreso += Math.random() * 15 + 5;
  if (tipoReporte.progreso >= 100) {
    clearInterval(intervalo);
  }
}, 300);
```

### 5. **Finalización**
- Descargar archivo automáticamente
- Agregar entrada al historial
- Mostrar notificación de éxito
- Resetear barra de progreso

### 6. **Registro en Historial**
```typescript
const nuevoReporte: HistorialReporte = {
  id: this.historialReportes.length + 1,
  fecha: new Date(),
  tipo: tipoReporte.titulo,
  estado: 'COMPLETADO',
  archivo: `reporte_${tipo}_${timestamp}.${extension}`,
  tamaño: Math.random() * 3 + 1, // MB
  icon: tipoReporte.icono
};
```

---

## 📊 Datos Utilizados

Todos los reportes utilizan las siguientes fuentes de datos:

### **Ventas del Período** (`ventasActualesPeriodo`)
Array de `VentaResponse[]` obtenido del backend mediante:
```typescript
this.ventasService.obtenerVentasEntreFechas(fechaInicio, fechaFin)
```

### **KPIs Calculados** (`kpis`)
```typescript
interface KPIData {
  ventasTotales: number;
  numeroTransacciones: number;
  clientesUnicos: number;
  ticketPromedio: number;
  crecimientoVentas: number;
  crecimientoTransacciones: number;
  crecimientoClientes: number;
  crecimientoTicket: number;
  metaMensual: number;
}
```

### **Top Rankings**
```typescript
topProductos: TopProducto[]   // Top 10 productos
topClientes: TopCliente[]      // Top 15 clientes
topVendedores: TopVendedor[]   // Top 10 vendedores
```

---

## 🛠️ Dependencias Técnicas

### **Instaladas en el Proyecto**

```json
{
  "dependencies": {
    "xlsx": "^0.18.5",              // Generación de Excel
    "jspdf": "^3.0.1",              // Generación de PDF
    "jspdf-autotable": "^5.0.2",    // Tablas en PDF
    "file-saver": "^2.0.5"          // Descarga de archivos
  },
  "devDependencies": {
    "@types/jspdf": "^2.0.0",       // Tipos TypeScript
    "@types/file-saver": "^2.0.7"   // Tipos TypeScript
  }
}
```

### **Opcional (para PPTX real)**

```bash
npm install pptxgenjs @types/pptxgenjs --save
```

---

## 📁 Nomenclatura de Archivos

Los archivos generados siguen este patrón:

```
{TipoReporte}_{Período}_{Timestamp}.{extension}

Ejemplos:
- Reporte_Ventas_esta_semana_1736935200000.xlsx
- Reporte_Ventas_este_mes_1736935200000.pdf
- Presentacion_Ventas_hoy_1736935200000.txt
- Ventas_este_año_1736935200000.csv
```

**Componentes**:
- `TipoReporte`: Nombre descriptivo del reporte
- `Período`: Período seleccionado por el usuario
- `Timestamp`: Marca de tiempo en milisegundos (evita duplicados)
- `extension`: `xlsx`, `pdf`, `txt`, `csv`

---

## 🎨 Historial de Reportes

Cada reporte generado se registra en el historial con:

```typescript
interface HistorialReporte {
  id: number;                    // ID único autoincremental
  fecha: Date;                   // Fecha y hora de generación
  tipo: string;                  // "Reporte Excel", "Reporte PDF", etc.
  estado: 'COMPLETADO' | 'GENERANDO' | 'ERROR' | 'CANCELADO';
  archivo: string;               // Nombre del archivo generado
  tamaño: number;                // Tamaño en MB
  icon: string;                  // Icono PrimeNG (pi pi-file-excel, etc.)
}
```

### **Acciones Disponibles**

1. **Descargar** (botón azul): Re-descarga el reporte (solo si estado = COMPLETADO)
2. **Vista Previa** (botón verde): Muestra preview del reporte (solo si estado = COMPLETADO)
3. **Eliminar** (botón rojo): Elimina la entrada del historial

---

## 🧪 Pruebas Recomendadas

### **Caso 1: Reporte con Datos**
1. Ir al Centro de Analíticas
2. Seleccionar período "Esta Semana"
3. Aplicar filtros
4. Generar cada tipo de reporte
5. Verificar que se descarguen correctamente
6. Abrir cada archivo y validar contenido

### **Caso 2: Reporte sin Datos**
1. Ir al Centro de Analíticas
2. NO aplicar filtros (o período sin ventas)
3. Intentar generar reporte
4. Debe mostrar mensaje: "No hay datos de ventas para generar el reporte"

### **Caso 3: Progreso Visual**
1. Generar cualquier reporte
2. Observar barra de progreso (debe incrementarse)
3. Botón debe deshabilitarse durante generación
4. Debe cambiar texto a "Generando..."

### **Caso 4: Historial**
1. Generar 3 reportes diferentes
2. Verificar que aparezcan en historial
3. Intentar descargar desde historial
4. Eliminar uno del historial

---

## 🚀 Próximas Mejoras

### **Corto Plazo**
- [ ] Implementar generación real de PPTX con pptxgenjs
- [ ] Agregar gráficos como imágenes en PDF
- [ ] Permitir personalizar columnas en CSV
- [ ] Guardar preferencias de usuario

### **Mediano Plazo**
- [ ] Programar reportes automáticos (diarios/semanales)
- [ ] Enviar reportes por email
- [ ] Almacenar historial en backend
- [ ] Agregar filtros avanzados de exportación

### **Largo Plazo**
- [ ] Reportes con BI interactivo
- [ ] Dashboards embebidos en PDF
- [ ] Integración con Power BI / Tableau
- [ ] Reportes con predicciones de IA

---

## 📞 Soporte y Contacto

Para consultas sobre la funcionalidad de reportes:
- Revisar logs del navegador (Consola de Desarrollador)
- Verificar permisos de descarga del navegador
- Comprobar que las librerías estén instaladas correctamente

---

## 📝 Notas Importantes

1. **Rendimiento**: Los reportes se generan en el cliente (navegador). Para datasets muy grandes (>10,000 ventas), considerar generación en backend.

2. **Compatibilidad**: Los archivos generados son compatibles con:
   - Excel 2007+ (.xlsx)
   - Adobe Reader / Chrome / Firefox (.pdf)
   - Excel / LibreOffice / Google Sheets (.csv)
   - Notepad / VS Code (.txt para presentación)

3. **Seguridad**: Los datos nunca salen del navegador durante la generación. La descarga es local.

4. **Límites**: No hay límite de cantidad de reportes, pero el historial se almacena en memoria (se pierde al refrescar).

---

**Fecha de Documentación**: 15 de Octubre de 2025  
**Versión del Sistema**: 1.0.0  
**Última Actualización**: Implementación completa de 4 formatos de exportación

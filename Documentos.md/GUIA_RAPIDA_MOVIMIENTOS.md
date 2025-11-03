# 🚀 GUÍA RÁPIDA DE INSTALACIÓN Y USO

## 📦 Paso 1: Instalar Dependencias

```bash
# Instalar librería XLSX para exportación Excel
npm install xlsx --save

# Verificar instalación
npm list xlsx
```

## ✅ Paso 2: Verificar Compilación

```bash
# Compilar proyecto
ng build

# O ejecutar en modo desarrollo
ng serve
```

## 🎯 Paso 3: Probar Funcionalidades

### 1. **Filtros de Fecha** 📅
1. Navega a `/admin/movimientos-inventario`
2. Selecciona un inventario de origen
3. Verás el panel "Filtros Avanzados"
4. Prueba los botones: "Hoy", "Esta Semana", "Este Mes"
5. O selecciona fechas manualmente en los calendarios

### 2. **Exportar a Excel** 📤
1. Asegúrate de tener movimientos filtrados
2. Click en botón "Exportar" (verde) en toolbar
3. Se descargará archivo: `Movimientos_Inventario_YYYY-MM-DD.xlsx`
4. Abre en Excel/Google Sheets y verifica:
   - 14 columnas de datos
   - Fila de totales al final
   - Hoja "Información" con metadata

### 3. **Ver Detalles** 👁️
1. En la tabla, busca columna "Acciones"
2. Click en botón "Ojo" (azul) de cualquier movimiento
3. Se abre sidebar a la derecha
4. Verifica toda la información se muestra correctamente
5. Prueba botones de acción rápida al final

### 4. **Duplicar Movimiento** 📋
1. Click en botón "Copiar" (verde) en acciones
2. Confirma en el diálogo
3. Se abre formulario con datos copiados
4. Nota el prefijo "[DUPLICADO]" en descripción
5. Modifica lo necesario y guarda

### 5. **Revertir Movimiento** 🔄
1. Click en botón "Replay" (naranja) en acciones
2. Lee el mensaje de confirmación
3. Confirma la operación
4. Se crea automáticamente movimiento inverso:
   - ENTRADA → SALIDA
   - SALIDA → ENTRADA
   - TRASLADO → TRASLADO (invierte origen/destino)
5. Revisa datos y confirma

### 6. **Ver Gráficos** 📊
1. Aplica filtros de fecha (opcional)
2. Click en "Ver Gráficos" en panel de filtros
3. Se abre diálogo con:
   - Gráfico de líneas multi-serie
   - 4 tarjetas de estadísticas
4. Interactúa con la leyenda (click para ocultar series)
5. Hover sobre el gráfico para ver tooltips

### 7. **Alertas de Stock** 🔔
1. Crea un movimiento de tipo "SALIDA"
2. Ingresa cantidad que deje stock < 5 unidades
3. Al guardar, verás:
   - Toast naranja con advertencia
   - Sonido de alerta (si navegador permite)
4. El movimiento se guarda normalmente

### 8. **Imprimir Ticket** 🖨️
1. Click en botón "Imprimir" (gris) en acciones
2. Se abre ventana popup con ticket formateado
3. Diálogo de impresión aparece automáticamente
4. Opciones:
   - Impresora POS térmica (si disponible)
   - Guardar como PDF
   - Imprimir en papel normal
5. Ventana se cierra automáticamente

### 9. **Filtrar por Estado** 🏷️
1. En panel "Filtros Avanzados"
2. Usa selector "Estado"
3. Elige: COMPLETADO, PENDIENTE, REVERTIDO o ANULADO
4. Tabla se filtra automáticamente
5. Combina con filtros de fecha

## 🐛 Troubleshooting

### Problema: "Cannot find module 'xlsx'"
```bash
# Solución
npm install xlsx --save
ng serve --restart
```

### Problema: Gráficos no se visualizan
```bash
# Verificar Chart.js está instalado
npm list chart.js

# Si no está, instalar
npm install chart.js --save
```

### Problema: Impresión no funciona
```
1. Verifica que el navegador no bloquee popups
2. Permite ventanas emergentes para el sitio
3. Verifica configuración de impresora
```

### Problema: Audio no suena
```
- El navegador puede bloquear audio automático
- Es normal y esperado (función opcional)
- El sistema sigue funcionando sin audio
```

### Problema: Filtros no aplican
```
1. Verifica que inventario esté seleccionado primero
2. Asegúrate de haber aplicado los filtros
3. Click en "Limpiar" y vuelve a intentar
```

## 📱 Compatibilidad

### Navegadores Soportados
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+

### Impresoras Compatibles
- ✅ Impresoras térmicas POS (80mm)
- ✅ Impresoras de inyección
- ✅ Impresoras láser
- ✅ Exportación a PDF

### Resoluciones Probadas
- ✅ Desktop: 1920x1080 (Full HD)
- ✅ Laptop: 1366x768
- ✅ Tablet: 768x1024 (iPad)
- ✅ Mobile: 375x667 (iPhone)

## ⚡ Atajos de Teclado

| Acción | Atajo |
|--------|-------|
| Buscar en tabla | Ctrl + F |
| Nuevo movimiento | Ctrl + N |
| Actualizar | F5 |
| Cerrar diálogo | Esc |

## 📊 Ejemplos de Uso

### Caso 1: Reporte Mensual
```
1. Aplica filtro "Este Mes"
2. Click "Ver Gráficos"
3. Analiza tendencias
4. Click "Exportar" para Excel
5. Envía reporte a gerencia
```

### Caso 2: Corrección de Error
```
1. Encuentra movimiento erróneo
2. Click "Revertir"
3. Confirma operación
4. Crea nuevo movimiento correcto
```

### Caso 3: Operación Repetitiva
```
1. Encuentra movimiento similar
2. Click "Duplicar"
3. Modifica solo los campos necesarios
4. Guarda
5. Repite para múltiples items
```

## 🎓 Tips y Mejores Prácticas

### Exportación
- 📊 Usa filtros antes de exportar para reportes específicos
- 📅 Combina rango de fechas + estado para análisis detallado
- 📈 Exporta gráficos para presentaciones ejecutivas

### Gestión
- 🔄 Revierte movimientos en lugar de eliminar (trazabilidad)
- 🖨️ Imprime tickets para respaldo físico
- 🔔 Atiende alertas de stock crítico inmediatamente

### Productividad
- ⚡ Usa presets de fecha para acceso rápido
- 📋 Duplica movimientos recurrentes
- 👁️ Sidebar para revisión rápida sin editar

## 📞 Soporte

**¿Necesitas ayuda?**
- 📧 Email: soporte@inventario.com
- 💬 Chat en vivo: Lunes a Viernes 9am-6pm
- 📚 Documentación completa: Ver `MEJORAS_MOVIMIENTOS_INVENTARIO.md`

---

**¡Listo para usar! 🎉**

Todas las funcionalidades están operativas y listas para mejorar tu gestión de inventario.

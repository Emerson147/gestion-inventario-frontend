# 🚀 Guía de Inicio Rápido - Dashboard Profesional

## ⚡ Inicio Rápido (5 minutos)

### 1. Verificar que el Backend esté activo

```bash
# El backend debe estar corriendo en:
http://localhost:8080/api
```

### 2. Iniciar el Frontend

```bash
cd gestion-inventario-frontend
ng serve
```

### 3. Acceder al Dashboard

```
URL: http://localhost:4200/pages/dashboard
```

¡Eso es todo! El dashboard se cargará automáticamente con datos reales del sistema.

---

## 📋 Checklist de Verificación

### ✅ Backend
- [ ] API REST activa en puerto 8080
- [ ] Endpoints funcionando:
  - `/api/productos`
  - `/api/ventas`
  - `/api/almacenes`
  - `/api/usuarios`
  - `/api/inventarios`
  - `/api/movimientos`

### ✅ Frontend
- [ ] Angular 18+ instalado
- [ ] Dependencias instaladas (`npm install`)
- [ ] Compilación exitosa
- [ ] Sin errores TypeScript

### ✅ Datos
- [ ] Al menos 1 producto creado
- [ ] Al menos 1 almacén creado
- [ ] Al menos 1 usuario activo
- [ ] Datos de inventario disponibles

---

## 🎯 Funcionalidades Principales

### 1. Vista General

Al entrar al dashboard verás:

- **Header Premium** con animación de gradiente
- **6 KPIs Principales** con métricas en tiempo real
- **6 Cards de Métricas Básicas** clickeables
- **Widgets Adicionales** (ventas, productos, etc.)

### 2. Actualización Automática

El dashboard se actualiza cada **30 segundos** automáticamente.

**Manual**: Click en botón "Actualizar Ahora"

### 3. Navegación Rápida

Cada card es clickeable y te lleva a:

| Card | Destino |
|------|---------|
| Categorías | `/pages/producto` |
| Productos | `/pages/producto` |
| Ventas | `/pages/realizar-venta` |
| Almacenes | `/pages/almacen` |
| Usuarios | `/pages/usuario` |
| Ticket Promedio | `/pages/realizar-venta` |

---

## 🔧 Configuración

### Cambiar Intervalo de Actualización

En `admin-dashboard.component.ts`:

```typescript
// Cambiar de 30 a 60 segundos
this.dashboardService.iniciarActualizacionAutomatica(60);
```

### Personalizar Métricas Mostradas

En `dashboard.service.ts`, método `generarKPIs()`:

```typescript
// Agregar o quitar KPIs
generarKPIs(metrics: DashboardMetrics): KPIDashboard[] {
  return [
    // ... KPIs existentes
    {
      id: 'nuevo-kpi',
      titulo: 'Mi Métrica',
      valor: metrics.miValor,
      tipo: 'numero',
      // ... resto de propiedades
    }
  ];
}
```

### Modificar Colores de Cards

En `dashboard-widget.html`:

```html
<!-- Cambiar color del border -->
<div class="border-l-4 border-green-500">
  <!-- Cambiar a: border-blue-500, border-red-500, etc. -->
</div>

<!-- Cambiar color del icono -->
<div class="bg-gradient-to-br from-green-100 to-green-200">
  <i class="text-green-600"></i>
</div>
```

---

## 🐛 Solución de Problemas

### Problema 1: "Loading..." infinito

**Causa**: Backend no responde o datos vacíos

**Solución**:
```bash
# 1. Verificar backend
curl http://localhost:8080/api/productos

# 2. Ver consola del navegador (F12)
# Buscar errores de red o CORS

# 3. Verificar que existan datos en la BD
```

### Problema 2: Métricas en 0

**Causa**: No hay datos en el sistema

**Solución**:
1. Crear al menos 1 producto
2. Crear al menos 1 venta
3. Asegurar que haya inventario
4. Refrescar el dashboard

### Problema 3: Error CORS

**Causa**: Backend no permite peticiones desde frontend

**Solución** (en backend):
```java
@CrossOrigin(origins = "http://localhost:4200")
@RestController
public class TuController {
  // ...
}
```

### Problema 4: Error de compilación TypeScript

**Causa**: Tipos no coinciden

**Solución**:
```bash
# Limpiar y recompilar
rm -rf node_modules package-lock.json
npm install
ng serve
```

---

## 📊 Entendiendo las Métricas

### Métricas Financieras

**Valor Total Inventario**
- Cálculo: `Σ(cantidad × precioVenta)` por cada producto
- Actualización: En tiempo real
- Uso: Control de capital invertido

**Ventas Totales Hoy**
- Cálculo: `Σ(total)` de ventas del día actual
- Actualización: Cada venta nueva
- Uso: Seguimiento diario de ingresos

**Ticket Promedio**
- Cálculo: `ventasTotalesHoy / numeroVentas`
- Actualización: Después de cada venta
- Uso: Análisis de comportamiento de compra

### Métricas de Inventario

**Productos en Stock Crítico**
- Cálculo: `COUNT(cantidad ≤ stockMinimo)`
- Alerta: Cuando > 0
- Acción: Revisar reposición

**Productos Agotados**
- Cálculo: `COUNT(cantidad = 0)`
- Alerta: Crítica cuando > 0
- Acción: Urgente reposición

**Eficiencia Inventario**
- Cálculo: `(disponibles / total) × 100`
- Meta: > 80%
- Uso: Salud del inventario

### Métricas de Usuarios

**Usuarios Activos**
- Cálculo: `COUNT(activo = true)`
- Actualización: Al activar/desactivar
- Uso: Control de acceso

**Usuarios Nuevos**
- Cálculo: `COUNT(fechaCreacion > hace30dias)`
- Período: Últimos 30 días
- Uso: Crecimiento del equipo

---

## 🎨 Personalización Visual

### Cambiar Tema de Colores

Editar `dashboard-widget.html`:

```html
<!-- Esquema de color verde (default) -->
<div class="border-green-500">
  <div class="bg-green-100">
    <i class="text-green-600"></i>

<!-- Cambiar a esquema azul -->
<div class="border-blue-500">
  <div class="bg-blue-100">
    <i class="text-blue-600"></i>
```

### Agregar Card Nueva

1. En `dashboard-widget.html`, duplicar un card existente:

```html
<div class="col-span-12 lg:col-span-6 xl:col-span-4">
  <div class="card mb-0 hover:shadow-xl...">
    <!-- Contenido del card -->
  </div>
</div>
```

2. Actualizar datos en `dashboardwidget.ts`:

```typescript
data = {
  // ... propiedades existentes
  nuevaMetrica: 0
};
```

3. Actualizar cálculo en `dashboard.service.ts`:

```typescript
calcularMetricas(data: any): DashboardMetrics {
  // ... cálculos existentes
  const nuevaMetrica = // tu cálculo
  
  return {
    // ... métricas existentes
    nuevaMetrica
  };
}
```

---

## 📱 Responsive Testing

### Desktop (> 1280px)
```bash
# Todas las cards en una fila
# KPIs en 6 columnas
# Mejor visualización
```

### Tablet (768px - 1280px)
```bash
# Cards en 2 columnas
# KPIs en 3 columnas
# Buen balance
```

### Mobile (< 768px)
```bash
# Cards en 1 columna
# KPIs en 2 columnas
# Stack vertical
```

**Testing en Chrome DevTools:**
1. F12 → Toggle Device Toolbar (Ctrl+Shift+M)
2. Seleccionar dispositivo (iPhone, iPad, etc.)
3. Verificar layout y funcionalidad

---

## 🔐 Seguridad

### Tokens de Autenticación

El servicio usa automáticamente el token almacenado:

```typescript
// En auth.service.ts (ya implementado)
const token = localStorage.getItem('token');
headers.set('Authorization', `Bearer ${token}`);
```

### Permisos por Rol

Verificar permisos antes de mostrar datos sensibles:

```typescript
// En dashboard.component.ts
if (this.authService.hasRole('ADMIN')) {
  // Mostrar datos completos
} else {
  // Mostrar datos limitados
}
```

---

## 📈 Optimización de Performance

### Reducir Tamaño de Peticiones

En `dashboard.service.ts`:

```typescript
// Cambiar de 1000 a 100 registros por petición
productos: this.productoService.getProducts(0, 100)
```

### Desactivar Actualización Automática

En `admin-dashboard.component.ts`:

```typescript
ngOnInit() {
  this.cargarKPIs();
  
  // Comentar esta línea:
  // this.dashboardService.iniciarActualizacionAutomatica(30);
}
```

### Lazy Loading de Widgets

En `admin-dashboard.component.ts`:

```typescript
// Cargar widgets solo cuando sea necesario
@ViewChild('statsWidget') statsWidget?: StatsWidget;

cargarWidgets() {
  if (this.statsWidget) {
    this.statsWidget.cargarDatos();
  }
}
```

---

## 🧪 Testing Manual

### Checklist de Pruebas

1. **Carga Inicial**
   - [ ] Dashboard carga en < 3 segundos
   - [ ] Todas las métricas muestran valores
   - [ ] No hay errores en consola

2. **Actualización Automática**
   - [ ] Métricas se actualizan cada 30s
   - [ ] Hora de actualización cambia
   - [ ] Sin flickering visual

3. **Navegación**
   - [ ] Todos los cards son clickeables
   - [ ] Links llevan a páginas correctas
   - [ ] Back button funciona

4. **Responsive**
   - [ ] Mobile: 1 columna
   - [ ] Tablet: 2 columnas
   - [ ] Desktop: 4-6 columnas

5. **Estados**
   - [ ] Loading muestra spinner
   - [ ] Error muestra mensaje
   - [ ] Success muestra datos

---

## 📚 Comandos Útiles

### Desarrollo

```bash
# Servidor de desarrollo
ng serve

# Con live reload
ng serve --live-reload

# Específic puerto
ng serve --port 4201
```

### Build

```bash
# Build de producción
ng build --configuration production

# Build con análisis
ng build --stats-json
npm install -g webpack-bundle-analyzer
webpack-bundle-analyzer dist/stats.json
```

### Debugging

```bash
# Modo verbose
ng serve --verbose

# Ver configuración
ng config

# Limpiar caché
ng cache clean
```

---

## 🎓 Mejores Prácticas

### 1. Manejo de Errores

```typescript
// ✅ BIEN: Manejo específico
.pipe(
  catchError(error => {
    console.error('Error al cargar productos:', error);
    this.showError('No se pudieron cargar los productos');
    return of([]);
  })
)

// ❌ MAL: Sin manejo
.subscribe(data => this.productos = data);
```

### 2. Cleanup de Suscripciones

```typescript
// ✅ BIEN: Unsubscribe
private destroy$ = new Subject<void>();

ngOnInit() {
  this.service.data$
    .pipe(takeUntil(this.destroy$))
    .subscribe(data => this.data = data);
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}

// ❌ MAL: Memory leak
ngOnInit() {
  this.service.data$.subscribe(data => this.data = data);
}
```

### 3. TypeScript Strict

```typescript
// ✅ BIEN: Tipos explícitos
metrics: DashboardMetrics | null = null;

// ❌ MAL: any
metrics: any;
```

---

## 📞 Soporte

### Logs Útiles

El sistema ya incluye logs detallados:

```typescript
console.log('🚀 Inicializando Dashboard...');
console.log('✅ Métricas cargadas:', metrics);
console.log('❌ Error al cargar:', error);
```

### Debugging en Navegador

1. F12 → Console
2. Buscar mensajes con emojis
3. Ver stack trace de errores
4. Verificar Network tab

---

## 🎉 ¡Todo Listo!

Tu dashboard profesional está completamente configurado y listo para usar.

**Características implementadas:**
- ✅ 20+ métricas en tiempo real
- ✅ 6 KPIs principales
- ✅ 6 Cards de acceso rápido
- ✅ Actualización automática
- ✅ Diseño responsive
- ✅ Manejo robusto de errores
- ✅ Performance optimizado

**¡Disfruta tu nuevo dashboard! 🚀**

---

**Última actualización**: 19 de Octubre de 2025
**Versión**: 1.0.0
**Autor**: Sistema de Gestión de Inventario

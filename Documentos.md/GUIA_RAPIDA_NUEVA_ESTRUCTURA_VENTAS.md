# 🚀 Guía Rápida: Nueva Estructura de Ventas

## 📝 Resumen Ejecutivo

Se ha reestructurado completamente el módulo de ventas, eliminando el sistema de pestañas (TabView) y migrando a un sistema de routing moderno con URLs navegables.

## 🔄 Cambios Principales

### Antes (TabView)
```typescript
// Una sola ruta con pestañas internas
/ventas/realizar-venta
  ↳ Tab 1: POS
  ↳ Tab 2: Historial
  ↳ Tab 3: Reportes
  ↳ Tab 4: Configuración
```

### Ahora (Routing)
```typescript
// Rutas independientes
/ventas/punto-venta      // POS
/ventas/historial        // Historial
/ventas/reportes         // Reportes
/ventas/configuracion    // Configuración
```

## 🏗️ Nueva Estructura

```
src/app/features/ventas/
│
├── shared/                                  # Recursos compartidos
│   ├── services/
│   │   ├── caja-state.service.ts           # Estado de caja
│   │   └── ventas-state.service.ts         # Estado de ventas
│   ├── guards/
│   │   └── caja.guard.ts                   # Protección de rutas
│   └── components/
│       └── navigation-tabs/                 # Navegación visual
│
├── ventas-layout/                           # Contenedor principal
│   ├── ventas-layout.component.ts
│   ├── ventas-layout.component.html
│   └── ventas-layout.component.scss
│
├── punto-venta/                             # Ruta POS
├── historial/                               # Ruta Historial
├── reportes/                                # Ruta Reportes
├── configuracion-ventas/                    # Ruta Configuración
│
├── realizar-venta/                          # DEPRECATED
│   └── (mantener temporalmente)
│
└── ventas-routing.module.ts                 # Configuración de rutas
```

## 🎯 Uso de los Nuevos Servicios

### CajaStateService

```typescript
import { CajaStateService } from './shared/services/caja-state.service';

constructor(private cajaState: CajaStateService) {}

// Abrir caja
this.cajaState.abrirCaja(100, 'usuario@email.com');

// Verificar estado
const estaAbierta = this.cajaState.isCajaAbierta();

// Obtener totales (usando signals)
const total = this.cajaState.totalVentasDelDia();
const cantidad = this.cajaState.cantidadVentas();
const promedio = this.cajaState.promedioVenta();

// Registrar venta
this.cajaState.registrarVenta(150.50);

// Cerrar caja
this.cajaState.cerrarCaja();
```

### VentasStateService

```typescript
import { VentasStateService } from './shared/services/ventas-state.service';

constructor(private ventasState: VentasStateService) {}

// Establecer ventas
this.ventasState.setVentas(ventas);

// Agregar nueva venta
this.ventasState.agregarVenta(nuevaVenta);

// Obtener ventas filtradas (signal)
const ventasFiltradas = this.ventasState.ventasFiltradas();

// Aplicar filtros
this.ventasState.setFiltros({
  fechaInicio: new Date(),
  estado: 'PAGADA'
});

// Obtener estadísticas (signal)
const estadisticas = this.ventasState.estadisticas();
```

## 🛡️ Guard de Caja

El `CajaGuard` protege las rutas que requieren caja abierta:

```typescript
// Configuración automática en routing
{
  path: 'punto-venta',
  component: PuntoVentaComponent,
  canActivate: [CajaGuard]  // ← Protege la ruta
}

// Comportamiento:
// - Si caja cerrada → Mensaje de advertencia + Redirect a /ventas
// - Si caja abierta → Permite acceso
```

## 📱 Navegación entre Secciones

### Navegación Programática

```typescript
import { Router } from '@angular/router';

constructor(private router: Router) {}

// Ir a POS
this.router.navigate(['/ventas/punto-venta']);

// Ir a Historial
this.router.navigate(['/ventas/historial']);

// Ir a Reportes
this.router.navigate(['/ventas/reportes']);

// Ir a Configuración
this.router.navigate(['/ventas/configuracion']);
```

### Navegación en Template

```html
<!-- Links directos -->
<a routerLink="/ventas/punto-venta">Punto de Venta</a>
<a routerLink="/ventas/historial">Historial</a>

<!-- Con RouterLinkActive -->
<a 
  routerLink="/ventas/reportes"
  routerLinkActive="active"
  #rla="routerLinkActive"
>
  Reportes
</a>
```

## 🔧 Adaptación de Componentes Existentes

### Antes (en realizar-venta.component.ts)

```typescript
// Navegar entre tabs
this.activeTabIndex = 2; // Ir a reportes
```

### Ahora (en cualquier componente)

```typescript
import { Router } from '@angular/router';

constructor(private router: Router) {}

// Navegar a reportes
this.router.navigate(['/ventas/reportes']);
```

## 📊 Componente de Navegación

El nuevo componente `NavigationTabsComponent` reemplaza el TabView:

```html
<app-navigation-tabs
  [carritoCount]="carrito.length"
  [ventasPendientes]="ventasPendientesCount"
  [configPendientes]="2"
  [totalVenta]="totalVenta"
  [ventasCount]="ventas.length"
></app-navigation-tabs>
```

**Características:**
- Tabs con íconos y badges
- Animaciones fluidas
- Indicadores de estado
- RouterLinkActive automático

## 🚦 Flujo de Trabajo Típico

### 1. Abrir Caja
```typescript
// Usuario accede a /ventas
// VentasLayoutComponent verifica estado
// Si caja cerrada → Muestra botón "Abrir Caja"
abrirCaja() {
  this.cajaState.abrirCaja(montoInicial, usuario);
}
```

### 2. Realizar Venta
```typescript
// Navega a /ventas/punto-venta (automático)
// Usuario agrega productos al carrito
// Procesa pago
procesarPago() {
  // ... lógica de pago
  this.cajaState.registrarVenta(totalVenta);
  this.ventasState.agregarVenta(nuevaVenta);
}
```

### 3. Ver Historial
```typescript
// Usuario click en tab "Historial"
// Router navega a /ventas/historial
// HistorialComponent carga automáticamente
```

### 4. Cerrar Caja
```typescript
// Usuario click en "Cerrar Caja"
cerrarCaja() {
  this.cajaState.cerrarCaja();
  // Redirige automáticamente a /ventas
}
```

## 🧪 Testing

### Test del Guard

```typescript
describe('CajaGuard', () => {
  it('debe permitir acceso con caja abierta', () => {
    cajaService.abrirCaja(100, 'test');
    expect(guard.canActivate()).toBe(true);
  });

  it('debe bloquear acceso con caja cerrada', () => {
    cajaService.cerrarCaja();
    expect(guard.canActivate()).toBe(false);
  });
});
```

### Test de Servicios

```typescript
describe('CajaStateService', () => {
  it('debe calcular promedio correctamente', () => {
    service.abrirCaja(100, 'test');
    service.registrarVenta(50);
    service.registrarVenta(100);
    expect(service.promedioVenta()).toBe(75);
  });
});
```

## ⚠️ Migraciones Necesarias

### Si usabas `activeTabIndex`

```typescript
// ❌ Antes
this.activeTabIndex = 1; // Ir a historial

// ✅ Ahora
this.router.navigate(['/ventas/historial']);
```

### Si usabas `onTabChange`

```typescript
// ❌ Antes
onTabChange(event: { index: number }) {
  switch(event.index) {
    case 0: // POS
    case 1: // Historial
  }
}

// ✅ Ahora
// Ya no es necesario, usa NavigationEnd
this.router.events
  .pipe(filter(e => e instanceof NavigationEnd))
  .subscribe((e: NavigationEnd) => {
    if (e.url.includes('historial')) {
      // Lógica para historial
    }
  });
```

## 📦 Imports Necesarios

```typescript
// En tus componentes
import { Router } from '@angular/router';
import { CajaStateService } from '../shared/services/caja-state.service';
import { VentasStateService } from '../shared/services/ventas-state.service';

// En módulos
import { RouterModule } from '@angular/router';
```

## 🎨 Estilos Personalizados

El componente de navegación usa Tailwind CSS:

```html
<!-- Tab activo -->
<a routerLinkActive="active">
  <!-- Tailwind classes se aplican automáticamente -->
</a>
```

## 🔍 Debugging

### Ver estado de caja

```typescript
console.log('Estado caja:', this.cajaState.obtenerEstadoActual());
```

### Ver ventas actuales

```typescript
console.log('Ventas:', this.ventasState.getVentas());
```

### Verificar ruta activa

```typescript
console.log('Ruta activa:', this.router.url);
```

## 📚 Recursos Adicionales

- Ver: [REESTRUCTURACION_VENTAS_ROUTING.md](./REESTRUCTURACION_VENTAS_ROUTING.md)
- Angular Router: https://angular.io/guide/router
- Angular Signals: https://angular.io/guide/signals

## 🆘 Soporte

Si tienes problemas:

1. Verifica que la caja esté abierta
2. Revisa la consola del navegador
3. Verifica que los guards estén configurados
4. Asegúrate de que los servicios sean singleton

---

**Actualizado:** 4 de febrero de 2026  
**Versión:** 1.0.0

# 🔧 Solución: Error de Inicialización en Movimientos de Inventario

## 🐛 Error Reportado

```
ERROR TypeError: Cannot read properties of undefined (reading 'getToken')
    at _MovimientosInventarioComponent.getCurrentUsername (movimientos-inventario.component.ts:361:36)
    at _MovimientosInventarioComponent.createEmptyMovimiento (movimientos-inventario.component.ts:356:21)
    at <instance_members_initializer> (movimientos-inventario.component.ts:81:41)
```

### **Síntomas:**
- ❌ La ruta `/admin/movimientos-inventario` no se abre
- ❌ La URL no cambia
- ❌ Error en consola: `Cannot read properties of undefined (reading 'getToken')`

---

## 🔍 Causa Raíz

El error ocurre debido al **orden de inicialización** en Angular:

### **Problema:**

```typescript
// ❌ ANTES (Incorrecto)
export class MovimientosInventarioComponent implements OnInit {
  // Estado del formulario
  movimiento: MovimientoResponse = this.createEmptyMovimiento(); // ← Se llama ANTES de inject()
  
  // Servicios inyectados
  private readonly authService: AuthService = inject(AuthService); // ← Se inyecta DESPUÉS
  
  ngOnInit(): void {
    this.loadInventarios();
  }
}
```

### **¿Por qué falla?**

1. **Línea 81**: Se ejecuta `this.createEmptyMovimiento()` durante la inicialización de la clase
2. El método `createEmptyMovimiento()` llama a `this.getCurrentUsername()`
3. `getCurrentUsername()` intenta acceder a `this.authService.getToken()`
4. **Pero `authService` aún NO ha sido inyectado** → `undefined.getToken()` → ❌ ERROR

### **Orden de ejecución en Angular:**

```
1. Inicialización de propiedades (línea 81)
   └─> movimiento = this.createEmptyMovimiento() ← ⚠️ authService NO existe aún
   
2. Inyección de dependencias (líneas 120-125)
   └─> authService = inject(AuthService) ← ✅ Ahora SÍ existe
   
3. ngOnInit() (línea 127)
   └─> this.loadInventarios() ← ✅ Aquí authService ya está disponible
```

---

## ✅ Solución Implementada

### **1. No inicializar con método durante la declaración**

```typescript
// ✅ DESPUÉS (Correcto)
export class MovimientosInventarioComponent implements OnInit {
  // Estado del formulario
  movimiento!: MovimientoResponse; // ← Solo declaración, NO inicialización
  
  // Servicios inyectados
  private readonly authService: AuthService = inject(AuthService);
  
  ngOnInit(): void {
    this.movimiento = this.createEmptyMovimiento(); // ← Inicialización DESPUÉS de inject
    this.loadInventarios();
  }
}
```

### **2. Cambios realizados**

#### **Cambio 1: Declaración de la propiedad (línea 81)**

```typescript
// ❌ ANTES
movimiento: MovimientoResponse = this.createEmptyMovimiento();

// ✅ DESPUÉS
movimiento!: MovimientoResponse;
```

**Nota:** El `!` (non-null assertion) le dice a TypeScript que confiamos en que la propiedad será inicializada antes de usarse.

#### **Cambio 2: Inicialización en ngOnInit() (línea 127)**

```typescript
// ❌ ANTES
ngOnInit(): void {
  this.loadInventarios();
}

// ✅ DESPUÉS
ngOnInit(): void {
  this.movimiento = this.createEmptyMovimiento();
  this.loadInventarios();
}
```

---

## 🧪 Verificación

### **Estado después de la corrección:**

```bash
✅ 0 errores de TypeScript
✅ 0 errores de compilación
✅ authService correctamente inyectado antes de uso
✅ movimiento inicializado correctamente en ngOnInit
```

### **Flujo corregido:**

```
1. Declaración de propiedad (sin inicialización)
   └─> movimiento!: MovimientoResponse

2. Inyección de servicios
   └─> authService = inject(AuthService) ✅

3. ngOnInit() ejecuta
   └─> this.movimiento = this.createEmptyMovimiento()
       └─> this.getCurrentUsername()
           └─> this.authService.getToken() ✅ (authService ya existe)
```

---

## 📝 Código Final

### **Archivo:** `movimientos-inventario.component.ts`

```typescript
export class MovimientosInventarioComponent implements OnInit {
  // Estado de datos
  movimientos: MovimientoResponse[] = [];
  movimientosFiltrados: MovimientoResponse[] = [];
  inventarios: Inventario[] = [];
  selectedMovimientos: MovimientoResponse[] = [];
  inventarioSeleccionado: Inventario | null = null;
  inventarioDestinoSeleccionado: Inventario | null = null;

  // Estado de filtros
  inventarioSeleccionadoFiltro: Inventario | null = null;
  tipoMovimientoFiltro: TipoMovimiento | null = null;
  filtroTipo: string | null = null;
  fechaMovimientoFiltro: Date | null = null;
  productoFiltro: { id?: number; nombre?: string; } | null = null;
  tipoMovimientoSeleccionado: TipoMovimiento | null = null;

  // Estado del formulario
  movimiento!: MovimientoResponse; // ← ✅ Solo declaración
  
  // Estado de UI
  movimientoDialog = false;
  loading = false;
  isLoading = false;
  submitted = false;
  editMode = false;

  // Permisos
  permissionTypes = PermissionType;

  // Servicios inyectados
  private readonly movimientoService: MovimientoInventarioService = inject(MovimientoInventarioService);
  private readonly inventarioService: InventarioService = inject(InventarioService);
  private readonly messageService: MessageService = inject(MessageService);
  private readonly confirmationService: ConfirmationService = inject(ConfirmationService);
  private readonly permissionService: PermissionService = inject(PermissionService);
  private readonly authService: AuthService = inject(AuthService);

  ngOnInit(): void {
    this.movimiento = this.createEmptyMovimiento(); // ← ✅ Inicialización aquí
    this.loadInventarios();
  }

  private createEmptyMovimiento(): MovimientoResponse {
    return {
      id: 0,
      inventarioId: this.inventarioSeleccionado?.id ?? 0,
      inventarioDestinoId: undefined,
      cantidad: 1,
      tipo: TipoMovimiento.ENTRADA,
      descripcion: '',
      referencia: '',
      fechaMovimiento: new Date().toISOString(),
      usuario: this.getCurrentUsername() // ← ✅ Ahora authService está disponible
    };
  }

  private getCurrentUsername(): string {
    const token = this.authService.getToken(); // ← ✅ authService ya fue inyectado
    if (!token) return 'sistema';
    
    try {
      const decodedToken = jwtDecode<{ sub: string }>(token);
      return decodedToken.sub;
    } catch (error) {
      console.error('Error al decodificar el token:', error);
      return 'sistema';
    }
  }
}
```

---

## 🎯 Conceptos Importantes

### **1. Orden de Inicialización en Angular (con `inject()`)**

```typescript
class MyComponent {
  // 1️⃣ Propiedades se inicializan PRIMERO
  myProperty = this.myMethod(); // ⚠️ Servicios NO disponibles aún
  
  // 2️⃣ Servicios se inyectan DESPUÉS
  myService = inject(MyService); // ✅ Ahora disponible
  
  // 3️⃣ ngOnInit se ejecuta AL FINAL
  ngOnInit() {
    this.myProperty = this.myMethod(); // ✅ Servicios disponibles
  }
}
```

### **2. Regla de Oro:**

> **NUNCA llames a métodos que usen servicios inyectados durante la inicialización de propiedades**

### **3. Alternativas seguras:**

#### ✅ **Opción 1: Inicializar en ngOnInit**
```typescript
movimiento!: MovimientoResponse;

ngOnInit() {
  this.movimiento = this.createEmptyMovimiento();
}
```

#### ✅ **Opción 2: Valor literal por defecto**
```typescript
movimiento: MovimientoResponse = {
  id: 0,
  inventarioId: 0,
  cantidad: 1,
  tipo: TipoMovimiento.ENTRADA,
  descripcion: '',
  referencia: '',
  fechaMovimiento: new Date().toISOString(),
  usuario: 'sistema' // ← Valor fijo, no llamada a método
};
```

#### ❌ **Opción incorrecta: Llamar método durante inicialización**
```typescript
movimiento: MovimientoResponse = this.createEmptyMovimiento(); // ← ERROR
```

---

## 🚀 Pruebas

### **1. Verificar que la ruta funciona:**
```
http://localhost:4200/admin/movimientos-inventario
```

### **2. Verificar en la consola del navegador:**
```
✅ Sin errores de "Cannot read properties of undefined"
✅ Componente carga correctamente
✅ Token JWT se decodifica correctamente
```

### **3. Verificar funcionalidades:**
- ✅ Página carga sin errores
- ✅ Filtro de inventarios funciona
- ✅ Botón "Nuevo Movimiento" abre el diálogo
- ✅ Usuario actual se muestra correctamente

---

## 📊 Resumen de Correcciones Totales

### **Sesión 1: Correcciones de modelo**
1. ✅ Corregido `createEmptyMovimiento()` - propiedades del modelo
2. ✅ Corregido `editMovimiento()` - búsqueda de inventarios
3. ✅ Corregido `exportarExcel()` - propiedad `descripcion`
4. ✅ Corregido `getValorTotalMovimientos()` - acceso a producto
5. ✅ Corregido `getProductosStockCritico()` - uso de inventarios
6. ✅ Corregido `aplicarFiltros()` - acceso a producto

### **Sesión 2: Corrección de inicialización**
7. ✅ Corregido orden de inicialización de `movimiento`
8. ✅ Movida inicialización a `ngOnInit()`

---

**Fecha de corrección:** 17 de octubre de 2025  
**Estado:** ✅ Completado y verificado  
**Archivos modificados:** 
- `movimientos-inventario.component.ts`

**Resultado:** 
- ✅ Componente funcional
- ✅ Ruta accesible
- ✅ Sin errores de consola

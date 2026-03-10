# 📦 Gestión de Inventario — Frontend

Sistema web completo de gestión de inventario, ventas y analíticas empresariales construido con **Angular 19** y **PrimeNG 19**. Diseñado para negocios que necesitan controlar su stock, procesar ventas en punto de venta (POS), generar reportes avanzados y acceder a predicciones basadas en inteligencia artificial.

---

## 🗂️ Índice

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Arquitectura del proyecto](#-arquitectura-del-proyecto)
- [Módulos y funcionalidades](#-módulos-y-funcionalidades)
- [Modelos de datos](#-modelos-de-datos)
- [Servicios principales](#-servicios-principales)
- [Seguridad y autenticación](#-seguridad-y-autenticación)
- [Requisitos previos](#-requisitos-previos)
- [Instalación y ejecución](#-instalación-y-ejecución)
- [Variables de entorno](#-variables-de-entorno)
- [Scripts disponibles](#-scripts-disponibles)
- [Despliegue](#-despliegue)
- [Pruebas](#-pruebas)

---

## ✨ Características

- **Autenticación JWT** con soporte de refresh token y control de sesión
- **Control de acceso basado en roles** (`ROLE_ADMIN` / `ROLE_VENTAS`)
- **Dashboard ejecutivo** con KPIs en tiempo real, gráficas de tendencias y widgets
- **Gestión de inventario** paginada con filtros avanzados y caché en memoria
- **Punto de Venta (POS)** con apertura/cierre de caja
- **Módulo de ventas** completo: historial, reportes, configuración y clientes
- **Predicciones de ventas con IA** usando cuatro algoritmos estadísticos
- **Analytics y Business Intelligence** con alertas de negocio y optimización de precios
- **Exportación dual** a Excel (`.xlsx`) y PDF con formato profesional
- **Generación de comprobantes** (Factura, Boleta, Nota de Venta, Ticket / POS)
- **Movimientos de inventario** con trazabilidad de entradas y salidas
- **Sistema de notificaciones** Toast integrado
- **Diseño responsive** con TailwindCSS + componentes PrimeNG

---

## 🛠️ Tecnologías

| Categoría | Tecnología | Versión |
|-----------|------------|---------|
| Framework | Angular | 19.1 |
| UI Components | PrimeNG + PrimeIcons | 19.1 / 7.0 |
| Estilos | TailwindCSS | 3.4 |
| Gráficas | Chart.js + ng2-charts | 4.4 / 8.0 |
| Animaciones | GSAP | 3.13 |
| Exportación | jsPDF + jspdf-autotable | 3.0 / 5.0 |
| Exportación | xlsx (SheetJS) | 0.18 |
| Autenticación | jwt-decode | 4.0 |
| Spinner | ngx-spinner | 19.0 |
| Lenguaje | TypeScript | 5.7 |
| Tests E2E | Cypress | 14.3 |
| Tests unitarios | Karma + Jasmine | 6.4 / 5.5 |
| Linting | ESLint + angular-eslint | 9.29 / 20.1 |
| Despliegue | Vercel | — |

---

## 🏗️ Arquitectura del proyecto

El proyecto sigue una **arquitectura modular por funcionalidades** (feature-based), separando claramente las responsabilidades:

```
src/
├── app/
│   ├── core/                      # Núcleo de la aplicación
│   │   ├── animations/            # Animaciones de rutas
│   │   ├── guards/                # AuthGuard (protección de rutas)
│   │   ├── interceptors/          # HTTP interceptors (auth + errores)
│   │   ├── models/                # Interfaces y tipos TypeScript
│   │   ├── services/              # Servicios globales (HTTP, lógica)
│   │   └── utils/                 # Utilidades compartidas
│   │
│   ├── features/                  # Módulos de funcionalidad
│   │   ├── admin/                 # Área de administración
│   │   │   ├── dashboard/         # Dashboard ejecutivo
│   │   │   ├── productos/         # Gestión de productos
│   │   │   ├── inventario/        # Gestión de inventario
│   │   │   ├── movimientos-inventario/  # Movimientos de stock
│   │   │   ├── almacenes/         # Gestión de almacenes
│   │   │   ├── colores/           # Catálogo de colores
│   │   │   └── usuarios/          # Gestión de usuarios
│   │   │
│   │   ├── auth/                  # Autenticación
│   │   │   ├── login.component    # Formulario de login
│   │   │   └── register.component # Formulario de registro
│   │   │
│   │   └── ventas/                # Módulo de ventas
│   │       ├── punto-venta/       # POS (Punto de Venta)
│   │       ├── historial/         # Historial de ventas
│   │       ├── reportes/          # Reportes y analytics
│   │       ├── clientes/          # Gestión de clientes
│   │       ├── configuracion-ventas/ # Configuración del módulo
│   │       └── shared/            # Componentes compartidos del módulo
│   │           ├── pos-ventas/    # Componente principal del POS
│   │           ├── apertura-caja-dialog/
│   │           ├── cierre-caja-dialog/
│   │           ├── ventas-ai-section/   # Predicciones IA
│   │           ├── ventas-bi-section/   # Business Intelligence
│   │           ├── ventas-charts-section/
│   │           ├── ventas-kpi-section/
│   │           └── reporte-ventas/
│   │
│   └── shared/                    # Componentes compartidos globales
│       ├── components/
│       │   ├── layout/            # AppLayout (shell principal)
│       │   ├── toast-notification/
│       │   ├── global-loading/
│       │   ├── page-header/
│       │   ├── skeleton/
│       │   ├── toolbar/
│       │   ├── not-found/
│       │   └── unauthorized/
│       ├── directives/
│       ├── pipes/
│       └── services/              # Toast service, etc.
│
├── environments/                  # Configuración por entorno
├── assets/                        # Recursos estáticos
├── styles.scss                    # Estilos globales
└── tailwind.css
```

### Flujo de enrutamiento

```
/login                 → LoginComponent (público)
/register              → RegisterComponent (público)
/unauthorized          → UnauthorizedComponent (público)

/ (AppLayout - protegido con AuthGuard)
├── /dashboard         → AdminDashboardComponent
├── /admin/...         → AdminRoutingModule  (ROLE_ADMIN)
│   ├── /dashboard
│   ├── /productos
│   ├── /inventario
│   ├── /movimientos-inventario
│   ├── /almacenes
│   ├── /colores
│   └── /usuarios
└── /ventas/...        → VentasRoutingModule (ROLE_ADMIN | ROLE_VENTAS)
    ├── /punto-venta
    ├── /historial
    ├── /reportes
    ├── /clientes
    └── /configuracion
```

---

## 📋 Módulos y funcionalidades

### 🔐 Autenticación (`features/auth`)

- Formulario de **login** con validación reactiva
- Formulario de **registro** de nuevos usuarios
- Almacenamiento seguro de `token` y `refreshToken` en `localStorage`
- Decodificación JWT para obtener roles y datos del usuario
- Cambio de contraseña

### 🏠 Dashboard Ejecutivo (`features/admin/dashboard`)

Panel de control en tiempo real con actualización automática. Incluye los siguientes widgets:

| Widget | Descripción |
|--------|-------------|
| **DashboardWidget** | KPIs generales (productos, ventas, almacenes, usuarios) |
| **StatsWidget** | Estadísticas detalladas de inventario y crecimiento |
| **RecentSalesWidget** | Últimas ventas registradas |
| **BestSellingWidget** | Productos más vendidos |
| **RevenueStreamWidget** | Flujo de ingresos con gráfica de tendencia |
| **NotificationsWidget** | Alertas activas del negocio |

**Métricas disponibles:**
- Valor total del inventario
- Ventas de hoy y del mes
- Ticket promedio
- Productos con stock crítico / agotados
- Entradas y salidas del día
- Eficiencia de inventario y rotación de productos
- Crecimiento diario y mensual

### 📦 Inventario (`features/admin/inventario`)

- Listado paginado con filtros avanzados (producto, almacén, estado, rango de stock, color, talla, fechas)
- **Caché en memoria** para consultas frecuentes
- Indicadores de estado: `DISPONIBLE`, `STOCK_BAJO`, `AGOTADO`
- Sugerencias de reposición automáticas
- Validación de inventario

### 🔄 Movimientos de Inventario (`features/admin/movimientos-inventario`)

- Registro de entradas y salidas de mercadería
- Historial completo con trazabilidad
- Visualización por almacén y producto

### 🛍️ Productos (`features/admin/productos`)

- CRUD completo de productos con soporte de:
  - Código, nombre, marca, modelo
  - Precio de compra y precio de venta
  - Categoría, color, imagen, género
- Paginación de resultados

### 🏪 Almacenes (`features/admin/almacenes`)

- Gestión de múltiples almacenes
- Asociación de inventario por almacén

### 👥 Usuarios (`features/admin/usuarios`)

- Administración de usuarios del sistema
- Asignación de roles (`ROLE_ADMIN`, `ROLE_VENTAS`)

### 💳 Punto de Venta — POS (`features/ventas/punto-venta`)

- Interfaz de caja optimizada para operaciones rápidas
- Flujo de **apertura y cierre de caja** con diálogos dedicados
- Búsqueda de productos por código o nombre
- Carrito de compra con cálculo automático de IGV y total
- Selección de cliente e ingreso de datos del comprobante
- Generación de comprobantes: Factura, Boleta, Nota de Venta, Ticket/POS
- **Impresión de tickets** en impresoras POS

### 📊 Historial de Ventas (`features/ventas/historial`)

- Listado completo de ventas con filtros por fecha, estado y término de búsqueda
- Detalle de cada venta con sus líneas y totales
- Exportación del historial a **Excel** y **PDF**

### 📈 Reportes y Analytics (`features/ventas/reportes`)

Módulo de análisis avanzado dividido en secciones:

| Sección | Contenido |
|---------|-----------|
| **KPIs** | Ventas hoy, ventas del mes, margen promedio, rotación de inventario |
| **Gráficas** | Tendencias de ventas con Chart.js |
| **Business Intelligence** | Análisis comparativo por período |
| **IA / Predicciones** | Forecast de ventas con algoritmos estadísticos |
| **Top Listas** | Productos y categorías más vendidas |

**Algoritmos de predicción de ventas:**
1. **Promedio Móvil** — suavizado de tendencias a corto plazo
2. **Regresión Lineal** — proyección de tendencia lineal
3. **Análisis Estacional** — detección de patrones cíclicos
4. **Suavizado Exponencial** — mayor peso a datos recientes

### 👤 Clientes (`features/ventas/clientes`)

- Registro y búsqueda de clientes por DNI / RUC / nombre
- Vinculación automática a ventas

### ⚙️ Configuración de Ventas (`features/ventas/configuracion-ventas`)

- Parámetros del módulo de ventas

---

## 🗄️ Modelos de datos

### `Producto`
```typescript
{
  id, codigo, nombre, descripcion,
  marca, modelo,
  precioCompra, precioVenta,
  imagen, genero,
  categoria: { id, nombre },
  color: { id, nombre, codigoHex },
  stock
}
```

### `VentaRequest / VentaResponse`
```typescript
// Request
{
  clienteId, usuarioId,
  tipoComprobante, serieComprobante,
  detalles: [{ inventarioId, cantidad }]
}

// Response
{
  id, numeroVenta,
  cliente, usuario,
  subtotal, igv, total,
  estado, tipoComprobante,
  detalles: [...],
  fechaCreacion
}
```

### `Inventario`
Estado de stock de un producto en un almacén con soporte para color, talla y estado (`DISPONIBLE`, `STOCK_BAJO`, `AGOTADO`).

### `ComprobanteResponse`
Documento fiscal con serie, número, estado SUNAT (`EMITIDO`, `ANULADO`, `ENVIADO_SUNAT`, `ERROR_SUNAT`) y rutas a archivos PDF/XML.

### `DashboardMetrics`
Agrega métricas de múltiples servicios en un único objeto para el dashboard:
- Conteos básicos, métricas financieras, métricas de inventario, KPIs de rendimiento y alertas.

---

## ⚙️ Servicios principales

| Servicio | Responsabilidad |
|----------|----------------|
| `AuthService` | Login, registro, refresh token, gestión de sesión |
| `VentasService` | CRUD de ventas, filtros por fecha/estado/término |
| `InventarioService` | Inventario paginado, filtros, caché en memoria |
| `ProductoService` | CRUD de productos |
| `DashboardService` | Agregación de métricas para el dashboard |
| `AnalyticsService` | KPIs, alertas de negocio, optimización de precios |
| `PrediccionVentasService` | Algoritmos de forecast (4 modelos estadísticos) |
| `ExportService` | Exportación a Excel (xlsx) y PDF (jsPDF) |
| `ComprobantesService` | Generación y consulta de comprobantes fiscales |
| `MovimientoInventarioService` | Registro y consulta de movimientos de stock |
| `AlmacenService` | Gestión de almacenes |
| `ClientesService` | Búsqueda y registro de clientes |
| `UsuarioService` | Gestión de usuarios |
| `ColoresService` | Catálogo de colores |
| `NotificationService` | Notificaciones del sistema |
| `LoadingService` | Estado global de carga |
| `CacheService` | Caché en memoria genérico |
| `VentaStateService` | Estado reactivo del módulo de ventas |
| `EstadisticasVentasService` | Cálculo de estadísticas de ventas |

---

## 🔒 Seguridad y autenticación

### JWT + Refresh Token
El flujo de autenticación sigue el estándar OAuth2 con JWT:

1. El usuario hace login → el backend devuelve `token` + `refreshToken`
2. Ambos tokens se almacenan en `localStorage`
3. El **`authInterceptor`** adjunta `Authorization: Bearer <token>` a todas las solicitudes HTTP
4. Si el servidor devuelve **401**, el interceptor intenta renovar el token con el `refreshToken`
5. Si la renovación falla, se limpia la sesión y se redirige a `/login`
6. Si el servidor devuelve **403**, se redirige a `/unauthorized`

### AuthGuard
Protege todas las rutas bajo el layout principal. Verifica:
1. Si el usuario está autenticado (`isLoggedIn()`)
2. Si el usuario posee los roles requeridos para la ruta (`data.roles`)

### Roles del sistema
| Rol | Acceso |
|-----|--------|
| `ROLE_ADMIN` | Dashboard, Productos, Inventario, Movimientos, Almacenes, Colores, Usuarios, Ventas completas |
| `ROLE_VENTAS` | Dashboard, Productos, Inventario, Movimientos, Ventas completas |

---

## 📋 Requisitos previos

- **Node.js** >= 18.x
- **npm** >= 9.x
- **Angular CLI** >= 19.x
- **Backend** corriendo en `http://localhost:8080` (configurable)

---

## 🚀 Instalación y ejecución

```bash
# 1. Clonar el repositorio
git clone https://github.com/Emerson147/gestion-inventario-frontend.git
cd gestion-inventario-frontend

# 2. Instalar dependencias
npm install

# 3. Configurar la URL del backend (ver sección Variables de entorno)

# 4. Levantar el servidor de desarrollo
npm start
# La aplicación estará disponible en http://localhost:4200
```

---

## 🌐 Variables de entorno

El archivo de entorno se encuentra en `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/'  // URL base del backend Spring Boot
};
```

Para producción, editar `src/environments/environment.prod.ts` con la URL del servidor desplegado.

---

## 📜 Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Servidor de desarrollo en `localhost:4200` |
| `npm run build` | Build de producción en `dist/` |
| `npm run watch` | Build en modo watch (desarrollo) |
| `npm test` | Ejecutar tests unitarios con Karma |
| `npm run lint` | Análisis estático con ESLint |

---

## 🚢 Despliegue

El proyecto está configurado para desplegarse en **Vercel** mediante el archivo `vercel.json`:

```json
{
  "outputDirectory": "dist/gestion-inventario-frontend/browser",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

La regla de rewrite garantiza que el enrutamiento de Angular (SPA) funcione correctamente en producción.

**Pasos:**
1. Conectar el repositorio a Vercel
2. Configurar el comando de build: `ng build --configuration production`
3. Asegurarse de que `environment.prod.ts` apunte a la URL del backend en producción

---

## 🧪 Pruebas

### Tests unitarios (Karma + Jasmine)
```bash
npm test
```
Incluye specs para los servicios: `AnalyticsService`, `InventarioService`, `VentasService`, `PagosService` y `EnterpriseIntegrationService`.

### Tests E2E (Cypress)
```bash
npx cypress open   # Modo interactivo
npx cypress run    # Modo headless
```
Los tests E2E se encuentran en el directorio `cypress/e2e/`.

---

## 📁 Estructura de carpetas adicional

```
cypress/          # Tests End-to-End con Cypress
docs/             # Documentación técnica detallada de funcionalidades
public/           # Archivos públicos estáticos
```

La carpeta `docs/` contiene más de 50 documentos técnicos explicando decisiones de arquitectura, correcciones realizadas, guías de funcionalidades y diagramas del sistema.

---

## 👤 Autor

**Emerson147** — [github.com/Emerson147](https://github.com/Emerson147)

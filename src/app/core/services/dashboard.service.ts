import { Injectable, inject } from '@angular/core';
import {
  Observable,
  forkJoin,
  map,
  catchError,
  of,
  BehaviorSubject,
  interval,
} from 'rxjs';
import { ProductoService } from './producto.service';
import { AlmacenService } from './almacen.service';
import { UsuarioService } from './usuario.service';
import { VentasService } from './ventas.service';
import { InventarioService } from './inventario.service';
import { MovimientoInventarioService } from './movimiento-inventario.service';

/**
 * 📊 Interface para las métricas principales del dashboard
 */
export interface DashboardMetrics {
  // Métricas básicas de conteo
  totalCategorias: number;
  totalProductos: number;
  totalVentas: number;
  totalAlmacenes: number;
  usuariosActivos: number;

  // Métricas financieras
  valorTotalInventario: number;
  ventasTotalesHoy: number;
  ventasTotalesMes: number;
  ticketPromedio: number;

  // Métricas de inventario
  productosStockCritico: number;
  productosAgotados: number;
  entradasHoy: number;
  salidasHoy: number;

  // Métricas de rendimiento
  eficienciaInventario: number;
  rotacionProductos: number;
  crecimientoDiario: number;
  crecimientoMensual: number;

  // Análisis de usuarios
  usuariosNuevos: number;
  usuariosInactivos: number;

  // Alertas y estados
  alertasCriticas: number;
  alertasAdvertencia: number;
}

/**
 * 📈 Interface para tendencias y comparativas
 */
export interface TendenciaDashboard {
  periodo: string;
  ventas: number;
  inventario: number;
  movimientos: number;
}

/**
 * 🎯 Interface para KPIs destacados
 */
export interface KPIDashboard {
  id: string;
  titulo: string;
  valor: number;
  tipo: 'moneda' | 'numero' | 'porcentaje';
  tendencia: 'subida' | 'bajada' | 'neutral';
  porcentajeCambio: number;
  icon: string;
  color: string;
  descripcion: string;
}

/**
 * 🏆 Service centralizado para el Dashboard Principal
 * Consolida datos de múltiples servicios para proporcionar una vista unificada
 */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  // Inyección de servicios
  private productoService = inject(ProductoService);
  private almacenService = inject(AlmacenService);
  private usuarioService = inject(UsuarioService);
  private ventasService = inject(VentasService);
  private inventarioService = inject(InventarioService);
  private movimientosService = inject(MovimientoInventarioService);

  // Subjects para estado reactivo
  private metricsSubject = new BehaviorSubject<DashboardMetrics | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  // Observables públicos
  metrics$ = this.metricsSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();
  error$ = this.errorSubject.asObservable();

  /**
   * 🔄 Obtiene todas las métricas del dashboard de forma optimizada
   */
  obtenerMetricasCompletas(): Observable<DashboardMetrics> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    const hoy = this.getFechaActual();

    return forkJoin({
      productos: this.productoService.getProducts(0, 1000).pipe(
        map((response) => response.contenido || []),
        catchError(() => of([])),
      ),
      ventasHoy: this.ventasService
        .obtenerVentasPorFecha(hoy)
        .pipe(catchError(() => of([]))),
      ventasMes: this.ventasService
        .obtenerVentasEntreFechas(this.getFechaInicioMes(), hoy)
        .pipe(catchError(() => of([]))),
      almacenes: this.almacenService.getAlmacenes().pipe(
        map((response) =>
          Array.isArray(response) ? response : response.contenido || [],
        ),
        catchError(() => of([])),
      ),
      usuarios: this.usuarioService.getUsers(0, 1000).pipe(
        map((response) => response.contenido || []),
        catchError(() => of([])),
      ),
      inventarios: this.inventarioService.obtenerInventarios(0, 1000).pipe(
        map((response) => response.contenido || []),
        catchError(() => of([])),
      ),
      movimientos: this.movimientosService.getMovimientos(0, 1000).pipe(
        map((response) => response.contenido || []),
        catchError((error) => {
          console.warn(
            '⚠️ No se pudieron cargar movimientos (opcional):',
            error.message,
          );
          return of([]);
        }),
      ),
    }).pipe(
      map((data) => {
        const metrics = this.calcularMetricas(data);
        this.metricsSubject.next(metrics);
        this.loadingSubject.next(false);
        return metrics;
      }),
      catchError((error) => {
        console.error('❌ Error al obtener métricas del dashboard:', error);
        this.errorSubject.next('Error al cargar las métricas del dashboard');
        this.loadingSubject.next(false);
        return of(this.getMetricasVacias());
      }),
    );
  }

  /**
   * 📊 Calcula todas las métricas a partir de los datos obtenidos
   */
  private calcularMetricas(data: any): DashboardMetrics {
    const {
      productos,
      ventasHoy,
      ventasMes,
      almacenes,
      usuarios,
      inventarios,
      movimientos,
    } = data;

    // Extraer marcas únicas como categorías
    const marcasUnicas = new Set(productos.map((p: any) => p.marca));
    const totalCategorias = marcasUnicas.size;

    // Métricas básicas
    const totalProductos = productos.length;
    const totalVentas = ventasHoy.length;
    const totalAlmacenes = almacenes.length;
    const usuariosActivos = usuarios.filter((u: any) => u.activo).length;

    // Métricas financieras
    const valorTotalInventario = this.calcularValorTotalInventario(inventarios);
    const ventasTotalesHoy = this.calcularVentasTotales(ventasHoy);
    const ventasTotalesMes = this.calcularVentasTotales(ventasMes);
    const ticketPromedio = totalVentas > 0 ? ventasTotalesHoy / totalVentas : 0;

    // Métricas de inventario
    const productosStockCritico = this.contarStockCritico(inventarios);
    const productosAgotados = this.contarProductosAgotados(inventarios);
    const { entradas, salidas } = this.calcularMovimientosHoy(
      movimientos.content || [],
    );

    // Métricas de rendimiento
    const eficienciaInventario = this.calcularEficienciaInventario(inventarios);
    const rotacionProductos = this.calcularRotacion(ventasMes, inventarios);
    const crecimientoDiario = this.calcularCrecimiento(ventasHoy, 'diario');
    const crecimientoMensual = this.calcularCrecimiento(ventasMes, 'mensual');

    // Análisis de usuarios
    const usuariosNuevos = this.contarUsuariosNuevos(usuarios);
    const usuariosInactivos = usuarios.length - usuariosActivos;

    // Alertas
    const alertasCriticas =
      productosAgotados + this.contarAlertasCriticas(inventarios);
    const alertasAdvertencia = productosStockCritico;

    return {
      totalCategorias,
      totalProductos,
      totalVentas,
      totalAlmacenes,
      usuariosActivos,
      valorTotalInventario,
      ventasTotalesHoy,
      ventasTotalesMes,
      ticketPromedio,
      productosStockCritico,
      productosAgotados,
      entradasHoy: entradas,
      salidasHoy: salidas,
      eficienciaInventario,
      rotacionProductos,
      crecimientoDiario,
      crecimientoMensual,
      usuariosNuevos,
      usuariosInactivos,
      alertasCriticas,
      alertasAdvertencia,
    };
  }

  /**
   * 💰 Calcula el valor total del inventario
   */
  private calcularValorTotalInventario(inventarios: any[]): number {
    return inventarios.reduce((sum, inv) => {
      const precio = inv.producto?.precioVenta || 0;
      const cantidad = inv.cantidad || 0;
      return sum + precio * cantidad;
    }, 0);
  }

  /**
   * 💵 Calcula el total de ventas
   */
  private calcularVentasTotales(ventas: any[]): number {
    return ventas.reduce((sum, v) => sum + (v.total || 0), 0);
  }

  /**
   * ⚠️ Cuenta productos en stock crítico
   */
  private contarStockCritico(inventarios: any[]): number {
    return inventarios.filter((inv) => {
      const stockMinimo = inv.stockMinimo || 10;
      const cantidad = inv.cantidad || 0;
      return cantidad > 0 && cantidad <= stockMinimo;
    }).length;
  }

  /**
   * 🚫 Cuenta productos agotados
   */
  private contarProductosAgotados(inventarios: any[]): number {
    return inventarios.filter((inv) => (inv.cantidad || 0) === 0).length;
  }

  /**
   * 📦 Calcula movimientos del día (entradas y salidas)
   */
  private calcularMovimientosHoy(movimientos: any[]): {
    entradas: number;
    salidas: number;
  } {
    // Si no hay movimientos disponibles, retornar 0
    if (!movimientos || movimientos.length === 0) {
      return { entradas: 0, salidas: 0 };
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const movimientosHoy = movimientos.filter((m) => {
      if (!m.fecha) return false;
      const fechaMov = new Date(m.fecha);
      fechaMov.setHours(0, 0, 0, 0);
      return fechaMov.getTime() === hoy.getTime();
    });

    const entradas = movimientosHoy
      .filter((m) => m.tipoMovimiento === 'ENTRADA')
      .reduce((sum, m) => sum + (m.cantidad || 0), 0);

    const salidas = movimientosHoy
      .filter((m) => m.tipoMovimiento === 'SALIDA')
      .reduce((sum, m) => sum + (m.cantidad || 0), 0);

    return { entradas, salidas };
  }

  /**
   * 📊 Calcula la eficiencia del inventario
   */
  private calcularEficienciaInventario(inventarios: any[]): number {
    if (inventarios.length === 0) return 0;

    const disponibles = inventarios.filter(
      (inv) => (inv.cantidad || 0) > 0,
    ).length;
    return (disponibles / inventarios.length) * 100;
  }

  /**
   * 🔄 Calcula la rotación de productos
   */
  private calcularRotacion(ventasMes: any[], inventarios: any[]): number {
    if (inventarios.length === 0) return 0;

    const totalVendido = ventasMes.reduce((sum, v) => {
      return sum + (v.detalles?.length || 0);
    }, 0);

    return totalVendido / inventarios.length;
  }

  /**
   * 📈 Calcula el crecimiento (simulado con datos reales)
   */
  private calcularCrecimiento(
    ventas: any[],
    tipo: 'diario' | 'mensual',
  ): number {
    // Por ahora retornamos un valor calculado basado en ventas
    // En el futuro se puede comparar con período anterior
    if (ventas.length === 0) return 0;

    const totalActual = this.calcularVentasTotales(ventas);
    const meta = tipo === 'diario' ? 5000 : 150000; // Metas ejemplo

    return (totalActual / meta - 1) * 100;
  }

  /**
   * 👥 Cuenta usuarios nuevos (últimos 30 días)
   */
  private contarUsuariosNuevos(usuarios: any[]): number {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 30);

    return usuarios.filter((u) => {
      if (!u.fechaCreacion) return false;
      return new Date(u.fechaCreacion) >= fechaLimite;
    }).length;
  }

  /**
   * 🚨 Cuenta alertas críticas adicionales
   */
  private contarAlertasCriticas(inventarios: any[]): number {
    // Productos con stock muy bajo (< 3 unidades)
    return inventarios.filter((inv) => {
      const cantidad = inv.cantidad || 0;
      return cantidad > 0 && cantidad < 3;
    }).length;
  }

  /**
   * 🎯 Genera KPIs destacados para el dashboard
   */
  generarKPIs(metrics: DashboardMetrics): KPIDashboard[] {
    return [
      {
        id: 'ventas-hoy',
        titulo: 'Ventas de Hoy',
        valor: metrics.ventasTotalesHoy,
        tipo: 'moneda',
        tendencia: metrics.crecimientoDiario >= 0 ? 'subida' : 'bajada',
        porcentajeCambio: metrics.crecimientoDiario,
        icon: 'pi-shopping-cart',
        color: '#10b981',
        descripcion: `${metrics.totalVentas} transacciones realizadas`,
      },
      {
        id: 'valor-inventario',
        titulo: 'Valor Inventario',
        valor: metrics.valorTotalInventario,
        tipo: 'moneda',
        tendencia: 'neutral',
        porcentajeCambio: 0,
        icon: 'pi-database',
        color: '#3b82f6',
        descripcion: `${metrics.totalProductos} productos en stock`,
      },
      {
        id: 'eficiencia',
        titulo: 'Eficiencia Stock',
        valor: metrics.eficienciaInventario,
        tipo: 'porcentaje',
        tendencia: metrics.eficienciaInventario >= 80 ? 'subida' : 'bajada',
        porcentajeCambio: metrics.eficienciaInventario - 80,
        icon: 'pi-chart-line',
        color: '#8b5cf6',
        descripcion: 'Productos disponibles vs total',
      },
      {
        id: 'alertas',
        titulo: 'Alertas Críticas',
        valor: metrics.alertasCriticas,
        tipo: 'numero',
        tendencia: metrics.alertasCriticas > 0 ? 'bajada' : 'subida',
        porcentajeCambio: -metrics.alertasCriticas,
        icon: 'pi-exclamation-triangle',
        color: '#ef4444',
        descripcion: `${metrics.productosAgotados} productos agotados`,
      },
      {
        id: 'ticket-promedio',
        titulo: 'Ticket Promedio',
        valor: metrics.ticketPromedio,
        tipo: 'moneda',
        tendencia: 'subida',
        porcentajeCambio: 5.2,
        icon: 'pi-wallet',
        color: '#f59e0b',
        descripcion: 'Valor promedio por venta',
      },
      {
        id: 'usuarios-activos',
        titulo: 'Usuarios Activos',
        valor: metrics.usuariosActivos,
        tipo: 'numero',
        tendencia: 'subida',
        porcentajeCambio: metrics.usuariosNuevos,
        icon: 'pi-users',
        color: '#06b6d4',
        descripcion: `${metrics.usuariosNuevos} nuevos este mes`,
      },
    ];
  }

  /**
   * 📅 Helpers para fechas
   */
  private getFechaActual(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getFechaInicioMes(): string {
    const fecha = new Date();
    fecha.setDate(1);
    return fecha.toISOString().split('T')[0];
  }

  /**
   * 🔧 Retorna métricas vacías por defecto
   */
  private getMetricasVacias(): DashboardMetrics {
    return {
      totalCategorias: 0,
      totalProductos: 0,
      totalVentas: 0,
      totalAlmacenes: 0,
      usuariosActivos: 0,
      valorTotalInventario: 0,
      ventasTotalesHoy: 0,
      ventasTotalesMes: 0,
      ticketPromedio: 0,
      productosStockCritico: 0,
      productosAgotados: 0,
      entradasHoy: 0,
      salidasHoy: 0,
      eficienciaInventario: 0,
      rotacionProductos: 0,
      crecimientoDiario: 0,
      crecimientoMensual: 0,
      usuariosNuevos: 0,
      usuariosInactivos: 0,
      alertasCriticas: 0,
      alertasAdvertencia: 0,
    };
  }

  /**
   * 🔄 Obtiene ventas recientes (últimas 5-10)
   */
  getVentasRecientes(): Observable<any[]> {
    return this.ventasService.obtenerVentasRecientes(10).pipe(
      map((response) => response || []),
      catchError(() => of([])),
    );
  }

  /**
   * 🏆 Obtiene productos más vendidos (Calculado desde historial de ventas)
   * Nota: Idealmente esto debería ser un endpoint de backend.
   */
  getProductosMasVendidos(): Observable<any[]> {
    // Obtenemos ventas del último mes para calcular best sellers
    const hoy = this.getFechaActual();
    const inicioImes = this.getFechaInicioMes();

    return this.ventasService.obtenerVentasEntreFechas(inicioImes, hoy).pipe(
      map((ventas) => {
        const productoMap = new Map<
          string,
          {
            nombre: string;
            cantidad: number;
            total: number;
            categoria: string;
          }
        >();

        ventas.forEach((venta) => {
          venta.detalles?.forEach((detalle: any) => {
            const id = detalle.producto?.id || detalle.producto?.nombre;
            if (!id) return;

            // Intentamos obtener categoría o marca como fallback
            const categoria =
              detalle.producto?.categoria?.nombre ||
              detalle.producto?.marca ||
              'General';

            const current = productoMap.get(id) || {
              nombre: detalle.producto?.nombre || 'Producto Desconocido',
              cantidad: 0,
              total: 0,
              categoria: categoria,
            };

            current.cantidad += detalle.cantidad;
            current.total += detalle.subtotal;
            productoMap.set(id, current);
          });
        });

        // Convertir a array y ordenar por cantidad
        return Array.from(productoMap.values())
          .sort((a, b) => b.cantidad - a.cantidad)
          .slice(0, 6); // Top 6
      }),
      catchError(() => of([])),
    );
  }

  /**
   * 📈 Obtiene datos para el gráfico de flujo de ingresos (Por categorías o tiempo)
   */
  getFlujoIngresos(): Observable<any> {
    const hoy = this.getFechaActual();
    const inicioAno = new Date(new Date().getFullYear(), 0, 1)
      .toISOString()
      .split('T')[0];

    return this.ventasService.obtenerVentasEntreFechas(inicioAno, hoy).pipe(
      map((ventas) => {
        // Agrupar por trimestres (Q1, Q2, Q3, Q4) y categorías
        const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
        const categoriasMap = new Map<string, number[]>();

        ventas.forEach((venta) => {
          // Usar fechaCreacion o fecha como fallback
          const fechaStr = venta.fechaCreacion || (venta as any).fecha;
          if (!fechaStr) return;

          const fecha = new Date(fechaStr);
          const mes = fecha.getMonth();
          const qIndex = Math.floor(mes / 3); // 0=Q1, 1=Q2, etc.

          venta.detalles?.forEach((detalle: any) => {
            // Intentamos obtener categoría o marca como fallback
            const cat =
              detalle.producto?.categoria?.nombre ||
              detalle.producto?.marca ||
              'General';

            if (!categoriasMap.has(cat)) {
              categoriasMap.set(cat, [0, 0, 0, 0]);
            }

            const currentData = categoriasMap.get(cat)!;
            currentData[qIndex] += detalle.subtotal;
          });
        });

        // Formatear para chart.js
        const datasets = Array.from(categoriasMap.entries()).map(
          ([label, data], index) => {
            // Colores Zen predefinidos rotativos
            const colors = [
              'rgba(99, 102, 241, 0.8)', // Indigo
              'rgba(16, 185, 129, 0.8)', // Emerald
              'rgba(245, 158, 11, 0.8)', // Amber
              'rgba(236, 72, 153, 0.8)', // Pink
              'rgba(6, 182, 212, 0.8)', // Cyan
            ];
            const color = colors[index % colors.length];

            return {
              type: 'bar',
              label,
              backgroundColor: color,
              data,
              barThickness: 32,
              borderRadius: {
                topLeft: 8,
                topRight: 8,
                bottomLeft: 0,
                bottomRight: 0,
              },
            };
          },
        );

        return {
          labels: quarters,
          datasets,
        };
      }),
      catchError(() => of({ labels: [], datasets: [] })),
    );
  }

  /**
   * 🔄 Inicia actualización automática de métricas
   */
  iniciarActualizacionAutomatica(intervaloSegundos: number = 30): void {
    interval(intervaloSegundos * 1000).subscribe(() => {
      this.obtenerMetricasCompletas().subscribe();
    });
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface KPIMetrics {
  ventasHoy: number;
  ventasMes: number;
  margenPromedio: number;
  productosAgotandose: number;
  crecimientoMensual: number;
  rotacionInventario: number;
}

export interface AlertaNegocio {
  id: number;
  tipo: 'MARGEN_BAJO' | 'PRECIO_COMPETENCIA' | 'STOCK_CRITICO' | 'OPORTUNIDAD_VENTA';
  mensaje: string;
  severidad: 'HIGH' | 'MEDIUM' | 'LOW';
  productoId?: number;
  accionRecomendada: string;
  fechaCreacion: Date;
}

export interface OptimizacionPrecio {
  productoId: number;
  precioActual: number;
  precioOptimizado: number;
  razon: string;
  impactoEstimado: number;
  confianza: number;
  selected?: boolean; // Para UI
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly apiUrl = `${environment.apiUrl}api/analytics`;

  constructor(private http: HttpClient) {}

  // Método real que puedes usar
  getKPIMetrics(): Observable<KPIMetrics> {
    // Por ahora simulamos datos, luego conectas con tu API real
    return of({
      ventasHoy: 15420,
      ventasMes: 245600,
      margenPromedio: 32.5,
      productosAgotandose: 8,
      crecimientoMensual: 12.3,
      rotacionInventario: 4.2
    });
  }

  getAlertasNegocio(): Observable<AlertaNegocio[]> {
    // Simulación - reemplaza con tu API
    return of([
      {
        id: 1,
        tipo: 'MARGEN_BAJO',
        mensaje: '5 productos tienen margen menor al 15%',
        severidad: 'HIGH',
        accionRecomendada: 'Revisar precios de compra o aumentar precios de venta',
        fechaCreacion: new Date()
      },
      {
        id: 2,
        tipo: 'OPORTUNIDAD_VENTA',
        mensaje: 'Productos electrónicos tienen alta demanda',
        severidad: 'MEDIUM',
        accionRecomendada: 'Considerar aumentar inventario de electrónicos',
        fechaCreacion: new Date()
      }
    ]);
  }

  optimizarPrecios(productos: any[]): Observable<OptimizacionPrecio[]> {
    // Simulación de IA - aquí integrarías tu servicio de ML real
    const optimizaciones = productos.map(producto => ({
      productoId: producto.id,
      precioActual: producto.precioVenta,
      precioOptimizado: producto.precioVenta * 1.05, // Ejemplo: +5%
      razon: 'Margen competitivo detectado',
      impactoEstimado: (producto.precioVenta * 0.05),
      confianza: 0.85
    }));

    return of(optimizaciones);
  }
}
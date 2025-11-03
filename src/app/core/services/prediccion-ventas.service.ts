import { Injectable } from '@angular/core';
import {
  ConfiguracionPrediccion,
  DatoVenta,
  EstadisticasHistoricas,
  InsightIA,
  ModeloEntrenado,
  PrediccionVentas,
  Recomendacion,
  ResultadoPrediccion
} from '../models/prediccion-ventas.model';

@Injectable({
  providedIn: 'root'
})
export class PrediccionVentasService {

  private modeloActual: ModeloEntrenado | null = null;

  constructor() { }

  /**
   * Genera predicciones basadas en datos históricos
   */
  generarPredicciones(
    datosHistoricos: DatoVenta[],
    configuracion: ConfiguracionPrediccion
  ): PrediccionVentas {
    
    if (datosHistoricos.length < 7) {
      throw new Error('Se requieren al menos 7 días de datos históricos');
    }

    // Ordenar datos por fecha
    const datosOrdenados = [...datosHistoricos].sort(
      (a, b) => a.fecha.getTime() - b.fecha.getTime()
    );

    // Calcular estadísticas
    const estadisticas = this.calcularEstadisticas(datosOrdenados);

    // Generar predicciones según algoritmo
    let predicciones: ResultadoPrediccion[];
    switch (configuracion.algoritmo) {
      case 'promedio-movil':
        predicciones = this.promedioMovil(datosOrdenados, configuracion);
        break;
      case 'regresion-lineal':
        predicciones = this.regresionLineal(datosOrdenados, configuracion, estadisticas);
        break;
      case 'estacional':
        predicciones = this.analisisEstacional(datosOrdenados, configuracion);
        break;
      case 'exponencial':
        predicciones = this.suavizadoExponencial(datosOrdenados, configuracion);
        break;
      default:
        predicciones = this.promedioMovil(datosOrdenados, configuracion);
    }

    // Calcular cambios proyectados
    const cambioSemanal = this.calcularCambioProyectado(predicciones, 7);
    const cambioMensual = this.calcularCambioProyectado(predicciones, 30);

    // Generar insights
    const insights = this.generarInsights(datosOrdenados, predicciones, estadisticas);

    // Generar recomendaciones
    const recomendaciones = this.generarRecomendaciones(datosOrdenados, predicciones, estadisticas);

    // Determinar tendencia
    const tendencia = estadisticas.tendenciaLineal.pendiente > 0 ? 'creciente' :
                     estadisticas.tendenciaLineal.pendiente < -0.01 ? 'decreciente' : 'estable';

    return {
      predicciones,
      proximaSemana: cambioSemanal,
      proximoMes: cambioMensual,
      confianza: Math.round(estadisticas.tendenciaLineal.r2 * 100),
      tendencia,
      insights,
      recomendaciones
    };
  }

  /**
   * Calcula estadísticas descriptivas
   */
  private calcularEstadisticas(datos: DatoVenta[]): EstadisticasHistoricas {
    const valores = datos.map(d => d.monto);
    
    // Promedio
    const promedio = valores.reduce((a, b) => a + b, 0) / valores.length;

    // Mediana
    const valoresOrdenados = [...valores].sort((a, b) => a - b);
    const medio = Math.floor(valoresOrdenados.length / 2);
    const mediana = valoresOrdenados.length % 2 === 0
      ? (valoresOrdenados[medio - 1] + valoresOrdenados[medio]) / 2
      : valoresOrdenados[medio];

    // Desviación estándar
    const varianza = valores.reduce((sum, val) => sum + Math.pow(val - promedio, 2), 0) / valores.length;
    const desviacionEstandar = Math.sqrt(varianza);

    // Coeficiente de variación
    const coeficienteVariacion = (desviacionEstandar / promedio) * 100;

    // Regresión lineal simple
    const n = datos.length;
    const sumX = datos.reduce((sum, _, i) => sum + i, 0);
    const sumY = valores.reduce((sum, val) => sum + val, 0);
    const sumXY = datos.reduce((sum, dato, i) => sum + (i * dato.monto), 0);
    const sumX2 = datos.reduce((sum, _, i) => sum + (i * i), 0);

    const pendiente = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercepto = (sumY - pendiente * sumX) / n;

    // Calcular R²
    const yMean = promedio;
    const ssTotal = valores.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
    const ssResidual = datos.reduce((sum, dato, i) => {
      const yPred = pendiente * i + intercepto;
      return sum + Math.pow(dato.monto - yPred, 2);
    }, 0);
    const r2 = 1 - (ssResidual / ssTotal);

    return {
      promedio,
      mediana,
      desviacionEstandar,
      varianza,
      coeficienteVariacion,
      tendenciaLineal: {
        pendiente,
        intercepto,
        r2: Math.max(0, Math.min(1, r2)) // Limitar entre 0 y 1
      }
    };
  }

  /**
   * Algoritmo: Promedio Móvil Simple
   */
  private promedioMovil(
    datos: DatoVenta[],
    config: ConfiguracionPrediccion
  ): ResultadoPrediccion[] {
    const predicciones: ResultadoPrediccion[] = [];
    const ventana = Math.min(config.ventanaTiempo, datos.length);
    
    // Calcular promedio de la ventana
    const ultimos = datos.slice(-ventana);
    const promedio = ultimos.reduce((sum, d) => sum + d.monto, 0) / ultimos.length;
    
    // Calcular desviación para intervalo de confianza
    const desviacion = Math.sqrt(
      ultimos.reduce((sum, d) => sum + Math.pow(d.monto - promedio, 2), 0) / ultimos.length
    );

    // Generar predicciones
    const ultimaFecha = datos[datos.length - 1].fecha;
    for (let i = 1; i <= config.periodoPrediccion; i++) {
      const fecha = new Date(ultimaFecha);
      fecha.setDate(fecha.getDate() + i);

      // Aplicar factor de tendencia leve
      const factorTendencia = 1 + (i * 0.001); // 0.1% por día
      const valorPredicho = promedio * factorTendencia;

      predicciones.push({
        fecha,
        valorPredicho,
        confianzaMin: valorPredicho - desviacion * 1.96,
        confianzaMax: valorPredicho + desviacion * 1.96,
        confianza: 75 - (i * 0.5) // Confianza disminuye con el tiempo
      });
    }

    return predicciones;
  }

  /**
   * Algoritmo: Regresión Lineal
   */
  private regresionLineal(
    datos: DatoVenta[],
    config: ConfiguracionPrediccion,
    estadisticas: EstadisticasHistoricas
  ): ResultadoPrediccion[] {
    const predicciones: ResultadoPrediccion[] = [];
    const { pendiente, intercepto } = estadisticas.tendenciaLineal;
    
    const ultimaFecha = datos[datos.length - 1].fecha;
    const n = datos.length;

    for (let i = 1; i <= config.periodoPrediccion; i++) {
      const fecha = new Date(ultimaFecha);
      fecha.setDate(fecha.getDate() + i);

      const valorPredicho = pendiente * (n + i) + intercepto;
      const margenError = estadisticas.desviacionEstandar * (1 + i * 0.05);

      predicciones.push({
        fecha,
        valorPredicho: Math.max(0, valorPredicho),
        confianzaMin: Math.max(0, valorPredicho - margenError * 1.96),
        confianzaMax: valorPredicho + margenError * 1.96,
        confianza: Math.max(50, 85 - (i * 1.5))
      });
    }

    return predicciones;
  }

  /**
   * Algoritmo: Análisis Estacional (patrones semanales)
   */
  private analisisEstacional(
    datos: DatoVenta[],
    config: ConfiguracionPrediccion
  ): ResultadoPrediccion[] {
    const predicciones: ResultadoPrediccion[] = [];
    
    // Calcular promedio por día de la semana
    const promediosPorDia: { [key: number]: number[] } = {};
    datos.forEach(dato => {
      const diaSemana = dato.fecha.getDay();
      if (!promediosPorDia[diaSemana]) {
        promediosPorDia[diaSemana] = [];
      }
      promediosPorDia[diaSemana].push(dato.monto);
    });

    const factoresEstacionales: { [key: number]: number } = {};
    const promedioGeneral = datos.reduce((sum, d) => sum + d.monto, 0) / datos.length;

    Object.keys(promediosPorDia).forEach(dia => {
      const valores = promediosPorDia[parseInt(dia)];
      const promedioDia = valores.reduce((sum, v) => sum + v, 0) / valores.length;
      factoresEstacionales[parseInt(dia)] = promedioDia / promedioGeneral;
    });

    // Generar predicciones
    const ultimaFecha = datos[datos.length - 1].fecha;
    for (let i = 1; i <= config.periodoPrediccion; i++) {
      const fecha = new Date(ultimaFecha);
      fecha.setDate(fecha.getDate() + i);
      const diaSemana = fecha.getDay();

      const factor = factoresEstacionales[diaSemana] || 1;
      const valorPredicho = promedioGeneral * factor * (1 + i * 0.002); // Ligera tendencia

      const desviacion = promedioGeneral * 0.15; // 15% de variación

      predicciones.push({
        fecha,
        valorPredicho,
        confianzaMin: valorPredicho - desviacion,
        confianzaMax: valorPredicho + desviacion,
        confianza: Math.max(60, 80 - (i * 0.8))
      });
    }

    return predicciones;
  }

  /**
   * Algoritmo: Suavizado Exponencial
   */
  private suavizadoExponencial(
    datos: DatoVenta[],
    config: ConfiguracionPrediccion
  ): ResultadoPrediccion[] {
    const predicciones: ResultadoPrediccion[] = [];
    const alpha = 0.3; // Factor de suavizado
    
    // Calcular valores suavizados
    let valorSuavizado = datos[0].monto;
    datos.forEach(dato => {
      valorSuavizado = alpha * dato.monto + (1 - alpha) * valorSuavizado;
    });

    // Calcular tendencia
    const tendencia = (datos[datos.length - 1].monto - datos[0].monto) / datos.length;

    const ultimaFecha = datos[datos.length - 1].fecha;
    for (let i = 1; i <= config.periodoPrediccion; i++) {
      const fecha = new Date(ultimaFecha);
      fecha.setDate(fecha.getDate() + i);

      const valorPredicho = valorSuavizado + (tendencia * i);
      const desviacion = valorSuavizado * 0.1 * Math.sqrt(i);

      predicciones.push({
        fecha,
        valorPredicho: Math.max(0, valorPredicho),
        confianzaMin: Math.max(0, valorPredicho - desviacion * 1.96),
        confianzaMax: valorPredicho + desviacion * 1.96,
        confianza: Math.max(55, 82 - (i * 1.2))
      });
    }

    return predicciones;
  }

  /**
   * Calcula cambio porcentual proyectado
   */
  private calcularCambioProyectado(predicciones: ResultadoPrediccion[], dias: number): number {
    if (predicciones.length === 0) return 0;

    const prediccionInicial = predicciones[0].valorPredicho;
    const prediccionFinal = predicciones[Math.min(dias - 1, predicciones.length - 1)].valorPredicho;

    return ((prediccionFinal - prediccionInicial) / prediccionInicial) * 100;
  }

  /**
   * Genera insights basados en datos
   */
  private generarInsights(
    historicos: DatoVenta[],
    predicciones: ResultadoPrediccion[],
    estadisticas: EstadisticasHistoricas
  ): InsightIA[] {
    const insights: InsightIA[] = [];

    // Insight de crecimiento
    const crecimiento = this.calcularCambioProyectado(predicciones, 7);
    insights.push({
      tipo: 'crecimiento',
      titulo: 'Crecimiento Esperado',
      descripcion: crecimiento > 0 ? 'Se espera crecimiento en ventas' : 'Se espera descenso en ventas',
      valor: Math.abs(Math.round(crecimiento)),
      icono: 'pi-arrow-up',
      color: crecimiento > 0 ? 'emerald' : 'red'
    });

    // Insight de tendencia
    insights.push({
      tipo: 'tendencia',
      titulo: 'Tendencia Mensual',
      descripcion: 'Proyección basada en análisis histórico',
      valor: Math.abs(Math.round(this.calcularCambioProyectado(predicciones, 30))),
      icono: 'pi-chart-line',
      color: 'blue'
    });

    // Insight de confianza
    const confianza = Math.round(estadisticas.tendenciaLineal.r2 * 100);
    insights.push({
      tipo: 'patron',
      titulo: 'Confianza del Modelo',
      descripcion: confianza > 70 ? 'Alta precisión' : 'Precisión moderada',
      valor: confianza,
      icono: 'pi-shield',
      color: 'violet'
    });

    return insights;
  }

  /**
   * Genera recomendaciones inteligentes
   */
  private generarRecomendaciones(
    historicos: DatoVenta[],
    predicciones: ResultadoPrediccion[],
    estadisticas: EstadisticasHistoricas
  ): Recomendacion[] {
    const recomendaciones: Recomendacion[] = [];
    const crecimiento = this.calcularCambioProyectado(predicciones, 7);

    // Recomendación de inventario
    if (crecimiento > 5) {
      recomendaciones.push({
        prioridad: 'alta',
        categoria: 'inventario',
        titulo: 'Incrementar stock productos alta rotación',
        descripcion: 'Se proyecta aumento del ' + Math.round(crecimiento) + '% en ventas',
        impactoEstimado: '+' + Math.round(crecimiento * 0.8) + '% en disponibilidad'
      });
    }

    // Recomendación de marketing
    if (estadisticas.tendenciaLineal.pendiente > 0) {
      recomendaciones.push({
        prioridad: 'media',
        categoria: 'marketing',
        titulo: 'Enfocar marketing en segmento premium',
        descripcion: 'La tendencia positiva indica receptividad del mercado',
        impactoEstimado: '+15% en conversión'
      });
    }

    // Recomendación de personal
    const ventasMaximas = Math.max(...predicciones.map(p => p.valorPredicho));
    const ventasActuales = historicos[historicos.length - 1].monto;
    if (ventasMaximas > ventasActuales * 1.2) {
      recomendaciones.push({
        prioridad: 'alta',
        categoria: 'personal',
        titulo: 'Optimizar horarios de personal',
        descripcion: 'Se esperan picos de demanda en los próximos días',
        impactoEstimado: '+20% en eficiencia'
      });
    }

    // Recomendación de estabilidad
    if (estadisticas.coeficienteVariacion > 30) {
      recomendaciones.push({
        prioridad: 'media',
        categoria: 'precio',
        titulo: 'Estabilizar precios promocionales',
        descripcion: 'Alta variabilidad en ventas detectada',
        impactoEstimado: '-' + Math.round(estadisticas.coeficienteVariacion / 2) + '% en variabilidad'
      });
    }

    return recomendaciones.slice(0, 3); // Máximo 3 recomendaciones
  }

  /**
   * Entrena el modelo con datos históricos
   */
  entrenarModelo(datos: DatoVenta[], algoritmo: string): ModeloEntrenado {
    const estadisticas = this.calcularEstadisticas(datos);
    
    this.modeloActual = {
      algoritmo,
      fechaEntrenamiento: new Date(),
      precision: Math.round(estadisticas.tendenciaLineal.r2 * 100),
      datosEntrenamiento: datos.length,
      parametros: {
        promedio: estadisticas.promedio,
        desviacion: estadisticas.desviacionEstandar,
        tendencia: estadisticas.tendenciaLineal
      }
    };

    return this.modeloActual;
  }

  /**
   * Obtiene el modelo actual entrenado
   */
  obtenerModeloActual(): ModeloEntrenado | null {
    return this.modeloActual;
  }

  /**
   * Exporta el modelo a JSON
   */
  exportarModelo(): string {
    if (!this.modeloActual) {
      throw new Error('No hay modelo entrenado para exportar');
    }

    return JSON.stringify(this.modeloActual, null, 2);
  }

  /**
   * Valida datos de entrada
   */
  validarDatos(datos: DatoVenta[]): { valido: boolean; errores: string[] } {
    const errores: string[] = [];

    if (!datos || datos.length === 0) {
      errores.push('No hay datos disponibles');
    }

    if (datos.length < 7) {
      errores.push('Se requieren al menos 7 días de datos históricos');
    }

    const datosInvalidos = datos.filter(d => !d.fecha || d.monto < 0);
    if (datosInvalidos.length > 0) {
      errores.push(`${datosInvalidos.length} registros con datos inválidos`);
    }

    return {
      valido: errores.length === 0,
      errores
    };
  }
}

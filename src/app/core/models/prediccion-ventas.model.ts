/**
 * Modelos para el sistema de predicciones de ventas
 * Basado en análisis estadístico y tendencias
 */

export interface DatoVenta {
  fecha: Date;
  monto: number;
  transacciones: number;
}

export interface ConfiguracionPrediccion {
  algoritmo: 'promedio-movil' | 'regresion-lineal' | 'estacional' | 'exponencial';
  ventanaTiempo: 7 | 14 | 30 | 60 | 90;
  variablesPredictivas: ('ventas' | 'transacciones' | 'ticket-promedio' | 'tendencia')[];
  periodoPrediccion: 7 | 14 | 30; // Días a predecir
}

export interface ResultadoPrediccion {
  fecha: Date;
  valorPredicho: number;
  confianzaMin: number;
  confianzaMax: number;
  confianza: number; // Porcentaje de confianza
}

export interface PrediccionVentas {
  predicciones: ResultadoPrediccion[];
  proximaSemana: number; // Porcentaje de cambio
  proximoMes: number; // Porcentaje de cambio
  confianza: number; // Confianza global del modelo
  tendencia: 'creciente' | 'decreciente' | 'estable';
  insights: InsightIA[];
  recomendaciones: Recomendacion[];
}

export interface InsightIA {
  tipo: 'crecimiento' | 'tendencia' | 'patron' | 'alerta';
  titulo: string;
  descripcion: string;
  valor: number;
  icono: string;
  color: string;
}

export interface Recomendacion {
  prioridad: 'alta' | 'media' | 'baja';
  categoria: 'inventario' | 'marketing' | 'personal' | 'precio';
  titulo: string;
  descripcion: string;
  impactoEstimado: string;
}

export interface ModeloEntrenado {
  algoritmo: string;
  fechaEntrenamiento: Date;
  precision: number;
  datosEntrenamiento: number;
  parametros: any;
}

export interface EstadisticasHistoricas {
  promedio: number;
  mediana: number;
  desviacionEstandar: number;
  varianza: number;
  coeficienteVariacion: number;
  tendenciaLineal: {
    pendiente: number;
    intercepto: number;
    r2: number; // Coeficiente de determinación
  };
}

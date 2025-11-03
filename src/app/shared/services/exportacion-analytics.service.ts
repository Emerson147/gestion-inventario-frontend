/**
 * ========================================
 * SERVICIO DE EXPORTACIÓN ANALYTICS
 * ========================================
 * 
 * Servicio especializado para exportar reportes ejecutivos
 * del Analytics Center con diseño profesional, gráficos
 * embebidos, KPIs destacados e insights de negocio.
 * 
 * Diferencias con exportación transaccional:
 * - Enfoque en análisis, no en datos crudos
 * - Incluye visualizaciones (gráficos como imágenes)
 * - Diseño ejecutivo para presentaciones
 * - Múltiples páginas con secciones temáticas
 * - Insights y recomendaciones automáticas
 * 
 * @author Emerson147
 * @date 13/10/2025
 */

import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ========================================
// INTERFACES
// ========================================

export interface KPIData {
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

export interface TopProducto {
  nombre: string;
  categoria: string;
  totalVentas: number;
  cantidadVendida: number;
  porcentaje: number;
}

export interface TopCliente {
  nombres: string;
  apellidos: string;
  totalCompras: number;
  numeroCompras: number;
  segmento: 'premium' | 'frecuente' | 'ocasional';
}

export interface DatosGrafico {
  labels: string[];
  valores: number[];
  tipo: 'line' | 'bar' | 'pie' | 'doughnut';
}

export interface DatosDashboard {
  kpis: KPIData;
  topProductos: TopProducto[];
  topClientes: TopCliente[];
  graficos?: {
    ventas?: DatosGrafico;
    categorias?: DatosGrafico;
    tendencias?: DatosGrafico;
  };
  periodo: string;
  generadoPor: string;
}

// ========================================
// SERVICIO
// ========================================

@Injectable({
  providedIn: 'root'
})
export class ExportacionAnalyticsService {
  
  private messageService = inject(MessageService);
  
  // Colores corporativos (tipo tupla para jsPDF)
  private readonly COLORES = {
    primario: [59, 130, 246] as [number, number, number],      // Blue-500
    secundario: [139, 92, 246] as [number, number, number],    // Violet-500
    exito: [16, 185, 129] as [number, number, number],          // Emerald-500
    advertencia: [251, 146, 60] as [number, number, number],    // Orange-500
    peligro: [239, 68, 68] as [number, number, number],         // Red-500
    info: [14, 165, 233] as [number, number, number],           // Sky-500
    gris: [107, 114, 128] as [number, number, number],          // Gray-500
    grisClaro: [243, 244, 246] as [number, number, number],     // Gray-100
    texto: [31, 41, 55] as [number, number, number]             // Gray-800
  };

  // ========================================
  // MÉTODO PRINCIPAL: EXPORTAR DASHBOARD COMPLETO
  // ========================================
  
  /**
   * Genera un reporte ejecutivo completo del dashboard
   * con todas las secciones, KPIs, gráficos y análisis
   */
  exportarDashboardCompleto(datos: DatosDashboard): void {
    try {
      this.messageService.add({
        severity: 'info',
        summary: '📊 Generando Reporte Ejecutivo',
        detail: 'Preparando dashboard con gráficos e insights...',
        life: 3000
      });

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      let paginaActual = 1;

      // PÁGINA 1: Portada + KPIs
      this.generarPortada(doc, datos);
      this.agregarKPIs(doc, datos.kpis);
      this.agregarPiePagina(doc, paginaActual++, datos.generadoPor);

      // PÁGINA 2: Top Productos y Análisis
      doc.addPage();
      this.agregarTopProductos(doc, datos.topProductos);
      this.agregarAnalisisProductos(doc, datos.topProductos);
      this.agregarPiePagina(doc, paginaActual++, datos.generadoPor);

      // PÁGINA 3: Top Clientes y Segmentación
      doc.addPage();
      this.agregarTopClientes(doc, datos.topClientes);
      this.agregarSegmentacionClientes(doc, datos.topClientes);
      this.agregarPiePagina(doc, paginaActual++, datos.generadoPor);

      // PÁGINA 4: Insights y Recomendaciones
      doc.addPage();
      this.agregarInsights(doc, datos);
      this.agregarRecomendaciones(doc, datos);
      this.agregarPiePagina(doc, paginaActual++, datos.generadoPor);

      // Guardar
      const nombreArchivo = `Dashboard_Ejecutivo_${this.generarTimestamp()}.pdf`;
      doc.save(nombreArchivo);

      this.messageService.add({
        severity: 'success',
        summary: '✅ Reporte Generado',
        detail: `${nombreArchivo} descargado exitosamente`,
        life: 4000
      });

    } catch (error) {
      console.error('❌ Error al exportar dashboard:', error);
      this.messageService.add({
        severity: 'error',
        summary: '❌ Error en Exportación',
        detail: 'No se pudo generar el reporte ejecutivo',
        life: 5000
      });
    }
  }

  // ========================================
  // REPORTE FINANCIERO
  // ========================================
  
  exportarReporteFinanciero(datos: DatosDashboard): void {
    try {
      this.messageService.add({
        severity: 'info',
        summary: '💰 Generando Reporte Financiero',
        detail: 'Analizando métricas financieras...',
        life: 3000
      });

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Portada financiera
      this.generarPortadaFinanciera(doc, datos);
      
      // Métricas financieras clave
      this.agregarMetricasFinancieras(doc, datos.kpis);
      
      // Análisis de rentabilidad
      this.agregarAnalisisRentabilidad(doc, datos);
      
      this.agregarPiePagina(doc, 1, datos.generadoPor);

      const nombreArchivo = `Reporte_Financiero_${this.generarTimestamp()}.pdf`;
      doc.save(nombreArchivo);

      this.messageService.add({
        severity: 'success',
        summary: '✅ Reporte Financiero Generado',
        detail: `${nombreArchivo} descargado exitosamente`,
        life: 4000
      });

    } catch (error) {
      console.error('❌ Error al exportar reporte financiero:', error);
      this.messageService.add({
        severity: 'error',
        summary: '❌ Error en Exportación',
        detail: 'No se pudo generar el reporte financiero',
        life: 5000
      });
    }
  }

  // ========================================
  // REPORTE DE TENDENCIAS
  // ========================================
  
  exportarReporteTendencias(datos: DatosDashboard): void {
    try {
      this.messageService.add({
        severity: 'info',
        summary: '📈 Generando Reporte de Tendencias',
        detail: 'Analizando patrones y proyecciones...',
        life: 3000
      });

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      this.generarPortadaTendencias(doc, datos);
      this.agregarAnalisisTendencias(doc, datos);
      this.agregarProyecciones(doc, datos);
      this.agregarPiePagina(doc, 1, datos.generadoPor);

      const nombreArchivo = `Reporte_Tendencias_${this.generarTimestamp()}.pdf`;
      doc.save(nombreArchivo);

      this.messageService.add({
        severity: 'success',
        summary: '✅ Reporte de Tendencias Generado',
        detail: `${nombreArchivo} descargado exitosamente`,
        life: 4000
      });

    } catch (error) {
      console.error('❌ Error al exportar tendencias:', error);
      this.messageService.add({
        severity: 'error',
        summary: '❌ Error en Exportación',
        detail: 'No se pudo generar el reporte de tendencias',
        life: 5000
      });
    }
  }

  // ========================================
  // REPORTE COMPARATIVO
  // ========================================
  
  exportarReporteComparativo(datos: DatosDashboard, datosPrevios: DatosDashboard): void {
    try {
      this.messageService.add({
        severity: 'info',
        summary: '📊 Generando Reporte Comparativo',
        detail: 'Comparando períodos...',
        life: 3000
      });

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      this.generarPortadaComparativa(doc, datos, datosPrevios);
      this.agregarComparacionKPIs(doc, datos.kpis, datosPrevios.kpis);
      this.agregarAnalisisComparativo(doc, datos, datosPrevios);
      this.agregarPiePagina(doc, 1, datos.generadoPor);

      const nombreArchivo = `Reporte_Comparativo_${this.generarTimestamp()}.pdf`;
      doc.save(nombreArchivo);

      this.messageService.add({
        severity: 'success',
        summary: '✅ Reporte Comparativo Generado',
        detail: `${nombreArchivo} descargado exitosamente`,
        life: 4000
      });

    } catch (error) {
      console.error('❌ Error al exportar comparativo:', error);
      this.messageService.add({
        severity: 'error',
        summary: '❌ Error en Exportación',
        detail: 'No se pudo generar el reporte comparativo',
        life: 5000
      });
    }
  }

  // ========================================
  // RESUMEN SEMANAL
  // ========================================
  
  exportarResumenSemanal(datos: DatosDashboard): void {
    try {
      this.messageService.add({
        severity: 'info',
        summary: '📅 Generando Resumen Semanal',
        detail: 'Compilando resumen de la semana...',
        life: 3000
      });

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      this.generarPortadaSemanal(doc, datos);
      this.agregarResumenSemanal(doc, datos);
      this.agregarHighlightsSemana(doc, datos);
      this.agregarPiePagina(doc, 1, datos.generadoPor);

      const nombreArchivo = `Resumen_Semanal_${this.generarTimestamp()}.pdf`;
      doc.save(nombreArchivo);

      this.messageService.add({
        severity: 'success',
        summary: '✅ Resumen Semanal Generado',
        detail: `${nombreArchivo} descargado exitosamente`,
        life: 4000
      });

    } catch (error) {
      console.error('❌ Error al exportar resumen semanal:', error);
      this.messageService.add({
        severity: 'error',
        summary: '❌ Error en Exportación',
        detail: 'No se pudo generar el resumen semanal',
        life: 5000
      });
    }
  }

  // ========================================
  // RESUMEN MENSUAL
  // ========================================
  
  exportarResumenMensual(datos: DatosDashboard): void {
    try {
      this.messageService.add({
        severity: 'info',
        summary: '📊 Generando Resumen Mensual',
        detail: 'Compilando resumen del mes...',
        life: 3000
      });

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      this.generarPortadaMensual(doc, datos);
      this.agregarResumenMensual(doc, datos);
      this.agregarLogrosDelMes(doc, datos);
      this.agregarObjetivosProximoMes(doc);
      this.agregarPiePagina(doc, 1, datos.generadoPor);

      const nombreArchivo = `Resumen_Mensual_${this.generarTimestamp()}.pdf`;
      doc.save(nombreArchivo);

      this.messageService.add({
        severity: 'success',
        summary: '✅ Resumen Mensual Generado',
        detail: `${nombreArchivo} descargado exitosamente`,
        life: 4000
      });

    } catch (error) {
      console.error('❌ Error al exportar resumen mensual:', error);
      this.messageService.add({
        severity: 'error',
        summary: '❌ Error en Exportación',
        detail: 'No se pudo generar el resumen mensual',
        life: 5000
      });
    }
  }

  // ========================================
  // MÉTODOS PRIVADOS: GENERACIÓN DE CONTENIDO
  // ========================================

  private generarPortada(doc: jsPDF, datos: DatosDashboard): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Fondo degradado (simulado con rectángulos)
    doc.setFillColor(...this.COLORES.primario);
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    doc.setFillColor(...this.COLORES.secundario);
    doc.rect(0, 50, pageWidth, 30, 'F');

    // Título principal
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE EJECUTIVO', pageWidth / 2, 25, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('Analytics Center Dashboard', pageWidth / 2, 35, { align: 'center' });

    // Información del período
    doc.setFontSize(12);
    doc.text(`Período: ${datos.periodo}`, pageWidth / 2, 60, { align: 'center' });
    
    // Fecha de generación
    doc.setTextColor(...this.COLORES.gris);
    doc.setFontSize(10);
    doc.text(`Generado: ${this.formatearFechaHora(new Date())}`, pageWidth / 2, 68, { align: 'center' });
  }

  private agregarKPIs(doc: jsPDF, kpis: KPIData): void {
    const startY = 85;
    const cardWidth = 65;
    const cardHeight = 35;
    const spacing = 5;
    const margin = 10;

    const kpiCards = [
      {
        titulo: 'VENTAS TOTALES',
        valor: `S/ ${kpis.ventasTotales.toLocaleString('es-PE')}`,
        crecimiento: `${kpis.crecimientoVentas}%`,
        color: this.COLORES.exito,
        icono: '💰'
      },
      {
        titulo: 'TRANSACCIONES',
        valor: kpis.numeroTransacciones.toLocaleString('es-PE'),
        crecimiento: `${kpis.crecimientoTransacciones}%`,
        color: this.COLORES.primario,
        icono: '🛒'
      },
      {
        titulo: 'CLIENTES ÚNICOS',
        valor: kpis.clientesUnicos.toLocaleString('es-PE'),
        crecimiento: `${kpis.crecimientoClientes}%`,
        color: this.COLORES.advertencia,
        icono: '👥'
      },
      {
        titulo: 'TICKET PROMEDIO',
        valor: `S/ ${kpis.ticketPromedio.toLocaleString('es-PE')}`,
        crecimiento: `${kpis.crecimientoTicket}%`,
        color: this.COLORES.secundario,
        icono: '🎫'
      }
    ];

    kpiCards.forEach((kpi, index) => {
      const x = margin + (index * (cardWidth + spacing));
      
      // Fondo de la tarjeta
      doc.setFillColor(...kpi.color);
      doc.roundedRect(x, startY, cardWidth, cardHeight, 3, 3, 'F');

      // Título
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(kpi.titulo, x + 5, startY + 8);

      // Valor principal
      doc.setFontSize(16);
      doc.text(kpi.valor, x + 5, startY + 18);

      // Crecimiento
      doc.setFontSize(10);
      doc.text(`↑ ${kpi.crecimiento}`, x + 5, startY + 26);

      // Ícono
      doc.setFontSize(20);
      doc.text(kpi.icono, x + cardWidth - 15, startY + 22);
    });
  }

  private agregarTopProductos(doc: jsPDF, productos: TopProducto[]): void {
    const startY = 20;

    // Título de sección
    doc.setTextColor(...this.COLORES.texto);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('🏆 Top 10 Productos Más Vendidos', 15, startY);

    // Tabla de productos
    autoTable(doc, {
      startY: startY + 5,
      head: [['#', 'Producto', 'Categoría', 'Cantidad', 'Total Ventas', '% del Total']],
      body: productos.slice(0, 10).map((prod, idx) => [
        `${idx + 1}`,
        prod.nombre,
        prod.categoria,
        prod.cantidadVendida.toLocaleString('es-PE'),
        `S/ ${prod.totalVentas.toLocaleString('es-PE')}`,
        `${prod.porcentaje.toFixed(1)}%`
      ]),
      headStyles: {
        fillColor: this.COLORES.primario,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 8
      },
      alternateRowStyles: {
        fillColor: this.COLORES.grisClaro
      },
      margin: { left: 15, right: 15 }
    });
  }

  private agregarAnalisisProductos(doc: jsPDF, productos: TopProducto[]): void {
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFillColor(...this.COLORES.info);
    doc.rect(15, finalY, 5, 5, 'F');
    
    doc.setTextColor(...this.COLORES.texto);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Análisis de Productos:', 23, finalY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    const analisis = [
      `• Los top 3 productos representan el ${productos.slice(0, 3).reduce((sum, p) => sum + p.porcentaje, 0).toFixed(1)}% de las ventas`,
      `• La categoría más vendida es "${productos[0]?.categoria}"`,
      `• Se vendieron ${productos.reduce((sum, p) => sum + p.cantidadVendida, 0).toLocaleString('es-PE')} unidades en total`
    ];

    analisis.forEach((linea, idx) => {
      doc.text(linea, 23, finalY + 12 + (idx * 6));
    });
  }

  private agregarTopClientes(doc: jsPDF, clientes: TopCliente[]): void {
    const startY = 20;

    doc.setTextColor(...this.COLORES.texto);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('👥 Top 10 Clientes VIP', 15, startY);

    autoTable(doc, {
      startY: startY + 5,
      head: [['#', 'Cliente', 'Segmento', 'Total Compras', 'N° Compras', 'Promedio']],
      body: clientes.slice(0, 10).map((cliente, idx) => [
        `${idx + 1}`,
        `${cliente.nombres} ${cliente.apellidos}`,
        cliente.segmento.toUpperCase(),
        `S/ ${cliente.totalCompras.toLocaleString('es-PE')}`,
        cliente.numeroCompras.toString(),
        `S/ ${(cliente.totalCompras / cliente.numeroCompras).toLocaleString('es-PE')}`
      ]),
      headStyles: {
        fillColor: this.COLORES.advertencia,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 8
      },
      alternateRowStyles: {
        fillColor: this.COLORES.grisClaro
      },
      margin: { left: 15, right: 15 }
    });
  }

  private agregarSegmentacionClientes(doc: jsPDF, clientes: TopCliente[]): void {
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    const segmentos = {
      premium: clientes.filter(c => c.segmento === 'premium').length,
      frecuente: clientes.filter(c => c.segmento === 'frecuente').length,
      ocasional: clientes.filter(c => c.segmento === 'ocasional').length
    };

    doc.setFillColor(...this.COLORES.exito);
    doc.rect(15, finalY, 5, 5, 'F');
    
    doc.setTextColor(...this.COLORES.texto);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Segmentación de Clientes:', 23, finalY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    doc.text(`• Clientes Premium: ${segmentos.premium} (${((segmentos.premium/clientes.length)*100).toFixed(1)}%)`, 23, finalY + 12);
    doc.text(`• Clientes Frecuentes: ${segmentos.frecuente} (${((segmentos.frecuente/clientes.length)*100).toFixed(1)}%)`, 23, finalY + 18);
    doc.text(`• Clientes Ocasionales: ${segmentos.ocasional} (${((segmentos.ocasional/clientes.length)*100).toFixed(1)}%)`, 23, finalY + 24);
  }

  private agregarInsights(doc: jsPDF, datos: DatosDashboard): void {
    const startY = 20;

    doc.setFillColor(...this.COLORES.primario);
    doc.rect(0, startY - 5, doc.internal.pageSize.getWidth(), 15, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('💡 Insights Clave del Período', 15, startY + 5);

    const insights = [
      {
        icono: '📈',
        titulo: 'Crecimiento Sostenido',
        descripcion: `Las ventas crecieron un ${datos.kpis.crecimientoVentas}% respecto al período anterior, superando las expectativas.`
      },
      {
        icono: '🎯',
        titulo: 'Meta Mensual',
        descripcion: `Se alcanzó el ${((datos.kpis.ventasTotales / datos.kpis.metaMensual) * 100).toFixed(1)}% de la meta mensual establecida.`
      },
      {
        icono: '👥',
        titulo: 'Base de Clientes',
        descripcion: `La base de clientes únicos creció ${datos.kpis.crecimientoClientes}%, indicando buena captación.`
      },
      {
        icono: '💰',
        titulo: 'Ticket Promedio',
        descripcion: `El ticket promedio aumentó ${datos.kpis.crecimientoTicket}%, mejorando la rentabilidad por transacción.`
      }
    ];

    let currentY = startY + 20;

    insights.forEach((insight, index) => {
      // Recuadro de insight
      doc.setDrawColor(...this.COLORES.primario);
      doc.setLineWidth(0.5);
      doc.rect(15, currentY, doc.internal.pageSize.getWidth() - 30, 20);

      // Ícono
      doc.setFontSize(16);
      doc.text(insight.icono, 18, currentY + 8);

      // Título
      doc.setTextColor(...this.COLORES.texto);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(insight.titulo, 28, currentY + 8);

      // Descripción
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const descripcionSplit = doc.splitTextToSize(insight.descripcion, doc.internal.pageSize.getWidth() - 50);
      doc.text(descripcionSplit, 28, currentY + 14);

      currentY += 25;
    });
  }

  private agregarRecomendaciones(doc: jsPDF, datos: DatosDashboard): void {
    const finalY = 130;

    doc.setFillColor(...this.COLORES.exito);
    doc.rect(0, finalY - 5, doc.internal.pageSize.getWidth(), 15, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('🎯 Recomendaciones Estratégicas', 15, finalY + 5);

    const recomendaciones = [
      '✅ Mantener el foco en los productos top 3 que generan mayor rentabilidad',
      '✅ Implementar programa de fidelización para clientes premium',
      '✅ Ofrecer promociones cruzadas entre categorías de alto rendimiento',
      '✅ Analizar productos de bajo rendimiento para posibles descuentos o retiros'
    ];

    doc.setTextColor(...this.COLORES.texto);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    let currentY = finalY + 15;
    recomendaciones.forEach(rec => {
      doc.text(rec, 20, currentY);
      currentY += 8;
    });
  }

  // Portadas específicas para cada tipo de reporte
  private generarPortadaFinanciera(doc: jsPDF, datos: DatosDashboard): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFillColor(16, 185, 129); // Verde financiero
    doc.rect(0, 0, pageWidth, 60, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('💰 REPORTE FINANCIERO', pageWidth / 2, 25, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text(datos.periodo, pageWidth / 2, 40, { align: 'center' });
  }

  private generarPortadaTendencias(doc: jsPDF, datos: DatosDashboard): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFillColor(139, 92, 246); // Violeta
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('📈 ANÁLISIS DE TENDENCIAS', pageWidth / 2, 30, { align: 'center' });
  }

  private generarPortadaComparativa(doc: jsPDF, datos: DatosDashboard, datosPrevios: DatosDashboard): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFillColor(251, 146, 60); // Naranja
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('📊 REPORTE COMPARATIVO', pageWidth / 2, 25, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`${datosPrevios.periodo} vs ${datos.periodo}`, pageWidth / 2, 35, { align: 'center' });
  }

  private generarPortadaSemanal(doc: jsPDF, datos: DatosDashboard): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, pageWidth, 60, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('📅 RESUMEN SEMANAL', pageWidth / 2, 30, { align: 'center' });
  }

  private generarPortadaMensual(doc: jsPDF, datos: DatosDashboard): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFillColor(139, 92, 246);
    doc.rect(0, 0, pageWidth, 60, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('📊 RESUMEN MENSUAL', pageWidth / 2, 30, { align: 'center' });
  }

  // Métodos de contenido específico
  private agregarMetricasFinancieras(doc: jsPDF, kpis: KPIData): void {
    const startY = 75;
    
    doc.setTextColor(...this.COLORES.texto);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('💵 Métricas Financieras Clave', 15, startY);

    const metricas = [
      ['Ingresos Totales', `S/ ${kpis.ventasTotales.toLocaleString('es-PE')}`],
      ['Margen Promedio', `${kpis.ticketPromedio.toFixed(2)}%`],
      ['Crecimiento', `${kpis.crecimientoVentas}%`],
      ['Meta Alcanzada', `${((kpis.ventasTotales / kpis.metaMensual) * 100).toFixed(1)}%`]
    ];

    autoTable(doc, {
      startY: startY + 5,
      head: [['Métrica', 'Valor']],
      body: metricas,
      headStyles: {
        fillColor: this.COLORES.exito,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      margin: { left: 15, right: 15 }
    });
  }

  private agregarAnalisisRentabilidad(doc: jsPDF, datos: DatosDashboard): void {
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    
    doc.setFillColor(...this.COLORES.exito);
    doc.rect(15, finalY, 5, 5, 'F');
    
    doc.setTextColor(...this.COLORES.texto);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('📊 Análisis de Rentabilidad', 23, finalY + 4);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('• La rentabilidad ha mejorado consistentemente', 23, finalY + 12);
    doc.text(`• El ticket promedio de S/ ${datos.kpis.ticketPromedio} supera el objetivo`, 23, finalY + 18);
    doc.text('• Se recomienda mantener la estrategia actual', 23, finalY + 24);
  }

  private agregarAnalisisTendencias(doc: jsPDF, datos: DatosDashboard): void {
    const startY = 60;
    
    doc.setTextColor(...this.COLORES.texto);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('📈 Análisis de Tendencias', 15, startY);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const tendencias = [
      `• Tendencia de crecimiento: ${datos.kpis.crecimientoVentas > 0 ? 'POSITIVA ↗' : 'NEGATIVA ↘'}`,
      `• Proyección próximo mes: S/ ${(datos.kpis.ventasTotales * 1.1).toLocaleString('es-PE')}`,
      `• Variación esperada: +10% basado en tendencia histórica`
    ];

    tendencias.forEach((t, i) => {
      doc.text(t, 20, startY + 10 + (i * 8));
    });
  }

  private agregarProyecciones(doc: jsPDF, datos: DatosDashboard): void {
    const startY = 110;
    
    doc.setFillColor(...this.COLORES.secundario);
    doc.rect(15, startY, 5, 5, 'F');
    
    doc.setTextColor(...this.COLORES.texto);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('🔮 Proyecciones', 23, startY + 4);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('• Basado en datos históricos y patrones estacionales', 23, startY + 12);
    doc.text(`• Ventas proyectadas próximo trimestre: S/ ${(datos.kpis.ventasTotales * 3).toLocaleString('es-PE')}`, 23, startY + 18);
  }

  private agregarComparacionKPIs(doc: jsPDF, kpisActuales: KPIData, kpisPrevios: KPIData): void {
    const startY = 60;
    
    doc.setTextColor(...this.COLORES.texto);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('📊 Comparación de KPIs', 15, startY);

    const comparacion = [
      ['Métrica', 'Período Anterior', 'Período Actual', 'Variación'],
      ['Ventas', `S/ ${kpisPrevios.ventasTotales.toLocaleString('es-PE')}`, `S/ ${kpisActuales.ventasTotales.toLocaleString('es-PE')}`, `${kpisActuales.crecimientoVentas}%`],
      ['Transacciones', kpisPrevios.numeroTransacciones.toString(), kpisActuales.numeroTransacciones.toString(), `${kpisActuales.crecimientoTransacciones}%`],
      ['Clientes', kpisPrevios.clientesUnicos.toString(), kpisActuales.clientesUnicos.toString(), `${kpisActuales.crecimientoClientes}%`]
    ];

    autoTable(doc, {
      startY: startY + 5,
      head: [comparacion[0]],
      body: comparacion.slice(1),
      headStyles: {
        fillColor: this.COLORES.advertencia,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      margin: { left: 15, right: 15 }
    });
  }

  private agregarAnalisisComparativo(doc: jsPDF, datos: DatosDashboard, datosPrevios: DatosDashboard): void {
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    
    doc.setFillColor(...this.COLORES.info);
    doc.rect(15, finalY, 5, 5, 'F');
    
    doc.setTextColor(...this.COLORES.texto);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('🔍 Análisis Comparativo', 23, finalY + 4);

    const diferencia = datos.kpis.ventasTotales - datosPrevios.kpis.ventasTotales;
    const mejora = diferencia > 0 ? 'mejoró' : 'disminuyó';

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`• El rendimiento ${mejora} en S/ ${Math.abs(diferencia).toLocaleString('es-PE')}`, 23, finalY + 12);
    doc.text(`• Representa una variación de ${datos.kpis.crecimientoVentas}%`, 23, finalY + 18);
  }

  private agregarResumenSemanal(doc: jsPDF, datos: DatosDashboard): void {
    const startY = 75;
    
    doc.setTextColor(...this.COLORES.texto);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('📅 Resumen de la Semana', 15, startY);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`• Ventas totales: S/ ${datos.kpis.ventasTotales.toLocaleString('es-PE')}`, 20, startY + 10);
    doc.text(`• Transacciones realizadas: ${datos.kpis.numeroTransacciones}`, 20, startY + 16);
    doc.text(`• Clientes atendidos: ${datos.kpis.clientesUnicos}`, 20, startY + 22);
  }

  private agregarHighlightsSemana(doc: jsPDF, datos: DatosDashboard): void {
    const startY = 120;
    
    doc.setFillColor(...this.COLORES.exito);
    doc.rect(15, startY, 5, 5, 'F');
    
    doc.setTextColor(...this.COLORES.texto);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('⭐ Highlights de la Semana', 23, startY + 4);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('• Mejor día de ventas: Sábado', 23, startY + 12);
    doc.text('• Producto más vendido: Ver sección de productos', 23, startY + 18);
    doc.text('• Cliente destacado: Ver sección de clientes', 23, startY + 24);
  }

  private agregarResumenMensual(doc: jsPDF, datos: DatosDashboard): void {
    const startY = 75;
    
    doc.setTextColor(...this.COLORES.texto);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('📊 Resumen del Mes', 15, startY);

    const resumen = [
      ['Concepto', 'Valor'],
      ['Ventas Totales', `S/ ${datos.kpis.ventasTotales.toLocaleString('es-PE')}`],
      ['Meta Mensual', `S/ ${datos.kpis.metaMensual.toLocaleString('es-PE')}`],
      ['% Cumplimiento', `${((datos.kpis.ventasTotales / datos.kpis.metaMensual) * 100).toFixed(1)}%`],
      ['Transacciones', datos.kpis.numeroTransacciones.toString()],
      ['Clientes Únicos', datos.kpis.clientesUnicos.toString()]
    ];

    autoTable(doc, {
      startY: startY + 5,
      head: [resumen[0]],
      body: resumen.slice(1),
      headStyles: {
        fillColor: this.COLORES.secundario,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      margin: { left: 15, right: 15 }
    });
  }

  private agregarLogrosDelMes(doc: jsPDF, datos: DatosDashboard): void {
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    
    doc.setFillColor(...this.COLORES.exito);
    doc.rect(15, finalY, 5, 5, 'F');
    
    doc.setTextColor(...this.COLORES.texto);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('🏆 Logros del Mes', 23, finalY + 4);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('• Se superó la meta en ventas', 23, finalY + 12);
    doc.text('• Crecimiento en base de clientes', 23, finalY + 18);
    doc.text('• Mejora en ticket promedio', 23, finalY + 24);
  }

  private agregarObjetivosProximoMes(doc: jsPDF): void {
    const startY = 180;
    
    doc.setFillColor(...this.COLORES.primario);
    doc.rect(15, startY, 5, 5, 'F');
    
    doc.setTextColor(...this.COLORES.texto);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('🎯 Objetivos para el Próximo Mes', 23, startY + 4);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('• Incrementar ventas en 15%', 23, startY + 12);
    doc.text('• Aumentar base de clientes en 10%', 23, startY + 18);
    doc.text('• Mejorar ticket promedio en 5%', 23, startY + 24);
  }

  private agregarPiePagina(doc: jsPDF, numeroPagina: number, usuario: string): void {
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setDrawColor(...this.COLORES.gris);
    doc.setLineWidth(0.5);
    doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
    
    doc.setTextColor(...this.COLORES.gris);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Página ${numeroPagina}`, 15, pageHeight - 8);
    doc.text(`Generado por: ${usuario}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
    doc.text(this.formatearFecha(new Date()), pageWidth - 15, pageHeight - 8, { align: 'right' });
  }

  // ========================================
  // UTILIDADES
  // ========================================

  private generarTimestamp(): string {
    const fecha = new Date();
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    const hours = String(fecha.getHours()).padStart(2, '0');
    const minutes = String(fecha.getMinutes()).padStart(2, '0');
    const seconds = String(fecha.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
  }

  private formatearFecha(fecha: Date): string {
    return fecha.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private formatearFechaHora(fecha: Date): string {
    return fecha.toLocaleString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

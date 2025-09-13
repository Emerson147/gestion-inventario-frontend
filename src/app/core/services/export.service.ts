import { Injectable } from '@angular/core';

export interface ExportOptions {
  filename?: string;
  sheetName?: string;
  includeHeaders?: boolean;
  dateFormat?: string;
  numberFormat?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  /**
   * Exporta datos a Excel con formato mejorado
   */
  async exportToExcel(data: any[], options: ExportOptions = {}): Promise<void> {
    if (!data || data.length === 0) {
      throw new Error('No hay datos para exportar');
    }

    try {
      const xlsx = await import('xlsx');
      
      const {
        filename = 'export',
        sheetName = 'Datos',
        includeHeaders = true,
        dateFormat = 'dd/mm/yyyy',
        numberFormat = '#,##0.00'
      } = options;

      // Procesar datos para el formato correcto
      const processedData = this.processDataForExport(data);
      
      // Crear worksheet
      const worksheet = xlsx.utils.json_to_sheet(processedData, {
        skipHeader: !includeHeaders
      });

      // Aplicar estilos y formato
      this.applyExcelStyles(worksheet, xlsx);

      // Ajustar ancho de columnas
      this.autoSizeColumns(worksheet, processedData);

      // Crear workbook
      const workbook = {
        Sheets: { [sheetName]: worksheet },
        SheetNames: [sheetName]
      };

      // Generar archivo
      const timestamp = new Date().toISOString().slice(0, 10);
      xlsx.writeFile(workbook, `${filename}_${timestamp}.xlsx`);

    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      throw new Error('Error al generar el archivo Excel');
    }
  }

  /**
   * Exporta datos a PDF con formato mejorado
   */
  async exportToPDF(data: any[], options: ExportOptions = {}): Promise<void> {
    if (!data || data.length === 0) {
      throw new Error('No hay datos para exportar');
    }

    try {
      const { jsPDF } = await import('jspdf');
      await import('jspdf-autotable');

      const {
        filename = 'export',
        includeHeaders = true
      } = options;

      const doc = new jsPDF();
      
      // Configurar documento
      doc.setFontSize(16);
      doc.text('Reporte de Inventario', 14, 20);
      
      doc.setFontSize(10);
      doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 30);

      // Procesar datos
      const processedData = this.processDataForExport(data);
      const headers = includeHeaders ? Object.keys(processedData[0] || {}) : [];
      const rows = processedData.map(item => Object.values(item));

      // Generar tabla
      (doc as any).autoTable({
        head: includeHeaders ? [headers] : [],
        body: rows,
        startY: 40,
        styles: {
          fontSize: 8,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: this.getColumnStyles(headers)
      });

      // Guardar archivo
      const timestamp = new Date().toISOString().slice(0, 10);
      doc.save(`${filename}_${timestamp}.pdf`);

    } catch (error) {
      console.error('Error al exportar a PDF:', error);
      throw new Error('Error al generar el archivo PDF');
    }
  }

  /**
   * Exporta datos a CSV
   */
  exportToCSV(data: any[], options: ExportOptions = {}): void {
    if (!data || data.length === 0) {
      throw new Error('No hay datos para exportar');
    }

    const {
      filename = 'export',
      includeHeaders = true
    } = options;

    try {
      const processedData = this.processDataForExport(data);
      const headers = Object.keys(processedData[0] || {});
      
      let csvContent = '';
      
      // Agregar headers si es necesario
      if (includeHeaders) {
        csvContent += headers.join(',') + '\n';
      }
      
      // Agregar datos
      processedData.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          // Escapar comillas y envolver en comillas si contiene comas
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
        csvContent += values.join(',') + '\n';
      });

      // Crear y descargar archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Error al exportar a CSV:', error);
      throw new Error('Error al generar el archivo CSV');
    }
  }

  /**
   * Procesa los datos para exportación
   */
  private processDataForExport(data: any[]): any[] {
    return data.map(item => {
      const processed: any = {};
      
      Object.keys(item).forEach(key => {
        let value = item[key];
        
        // Procesar fechas
        if (value instanceof Date) {
          value = value.toLocaleDateString();
        } else if (typeof value === 'string' && this.isDateString(value)) {
          value = new Date(value).toLocaleDateString();
        }
        
        // Procesar objetos anidados
        if (typeof value === 'object' && value !== null) {
          if (value.nombre) {
            value = value.nombre;
          } else if (value.codigo) {
            value = value.codigo;
          } else {
            value = JSON.stringify(value);
          }
        }
        
        // Limpiar el nombre de la clave
        const cleanKey = this.cleanHeaderName(key);
        processed[cleanKey] = value;
      });
      
      return processed;
    });
  }

  /**
   * Aplica estilos a la hoja de Excel
   */
  private applyExcelStyles(worksheet: any, xlsx: any): void {
    const range = xlsx.utils.decode_range(worksheet['!ref']!);
    
    // Aplicar estilos a headers
    for (let col = range.s.c; col <= range.e.c; col++) {
      const headerCell = xlsx.utils.encode_cell({ r: 0, c: col });
      if (worksheet[headerCell]) {
        worksheet[headerCell].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "2980B9" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        };
      }
    }

    // Aplicar bordes a todas las celdas
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = xlsx.utils.encode_cell({ r: row, c: col });
        if (worksheet[cellAddress]) {
          if (!worksheet[cellAddress].s) worksheet[cellAddress].s = {};
          worksheet[cellAddress].s.border = {
            top: { style: "thin", color: { rgb: "CCCCCC" } },
            bottom: { style: "thin", color: { rgb: "CCCCCC" } },
            left: { style: "thin", color: { rgb: "CCCCCC" } },
            right: { style: "thin", color: { rgb: "CCCCCC" } }
          };
        }
      }
    }
  }

  /**
   * Ajusta automáticamente el ancho de las columnas
   */
  private autoSizeColumns(worksheet: any, data: any[]): void {
    const colWidths: number[] = [];
    
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      
      headers.forEach((header, index) => {
        let maxWidth = header.length;
        
        data.forEach(row => {
          const cellValue = String(row[header] || '');
          maxWidth = Math.max(maxWidth, cellValue.length);
        });
        
        colWidths[index] = Math.min(maxWidth + 2, 50); // Máximo 50 caracteres
      });
    }
    
    worksheet['!cols'] = colWidths.map(width => ({ width }));
  }

  /**
   * Obtiene estilos de columna para PDF
   */
  private getColumnStyles(headers: string[]): any {
    const styles: any = {};
    
    headers.forEach((header, index) => {
      if (header.toLowerCase().includes('fecha')) {
        styles[index] = { cellWidth: 25 };
      } else if (header.toLowerCase().includes('cantidad') || header.toLowerCase().includes('precio')) {
        styles[index] = { halign: 'right', cellWidth: 20 };
      } else if (header.toLowerCase().includes('estado')) {
        styles[index] = { halign: 'center', cellWidth: 20 };
      }
    });
    
    return styles;
  }

  /**
   * Verifica si una cadena es una fecha
   */
  private isDateString(value: string): boolean {
    return !isNaN(Date.parse(value)) && value.includes('-');
  }

  /**
   * Limpia el nombre del header para exportación
   */
  private cleanHeaderName(key: string): string {
    const headerMap: { [key: string]: string } = {
      'id': 'ID',
      'serie': 'Serie',
      'cantidad': 'Cantidad',
      'estado': 'Estado',
      'fechaCreacion': 'Fecha Creación',
      'fechaActualizacion': 'Fecha Actualización',
      'producto': 'Producto',
      'color': 'Color',
      'talla': 'Talla',
      'almacen': 'Almacén'
    };
    
    return headerMap[key] || key.charAt(0).toUpperCase() + key.slice(1);
  }
}
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ComprobanteResponse {
  id: number;
  tipoDocumento: 'FACTURA' | 'BOLETA' | 'NOTA_VENTA' | 'TICKET';
  serie: string;
  numero: string;
  fechaEmision: string;
  codigoHash: string;
  subtotal: number;
  igv: number;
  total: number;
  estado: 'EMITIDO' | 'ANULADO' | 'ENVIADO_SUNAT' | 'ERROR_SUNAT';
  observaciones?: string;
  rutaArchivoPdf?: string;
  rutaArchivoXml?: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  venta: {
    id: number;
    numeroVenta: string;
    total: number;
  };
  cliente: {
    id: number;
    nombres: string;
    apellidos: string;
    dni?: string;
    ruc?: string;
  };
}

export interface ComprobanteRequest {
  ventaId: number;
  tipoDocumento: 'FACTURA' | 'BOLETA' | 'NOTA_VENTA' | 'TICKET';
  serie: string;
  observaciones?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ComprobantesService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}api/comprobantes`;

  constructor() {}

  /**
   * Genera un nuevo comprobante para una venta
   */
  generarComprobante(comprobanteRequest: ComprobanteRequest): Observable<ComprobanteResponse> {
    console.log('📄 Generando comprobante para venta:', comprobanteRequest.ventaId);
    return this.http.post<ComprobanteResponse>(`${this.API_URL}/generar`, comprobanteRequest)
      .pipe(
        tap(response => console.log('✅ Comprobante generado:', response)),
        catchError(this.handleError)
      );
  }

  /**
   * Obtiene un comprobante por su ID
   */
  obtenerComprobante(id: number): Observable<ComprobanteResponse> {
    console.log('📄 Obteniendo comprobante ID:', id);
    return this.http.get<ComprobanteResponse>(`${this.API_URL}/${id}`)
      .pipe(
        tap(response => console.log('✅ Comprobante obtenido:', response)),
        catchError(this.handleError)
      );
  }

  /**
   * Obtiene un comprobante por venta ID
   */
  obtenerComprobantePorVenta(ventaId: number): Observable<ComprobanteResponse> {
    const url = `${this.API_URL}/venta/${ventaId}`;
    console.log('📄 Obteniendo comprobante para venta ID:', ventaId);
    console.log('🔗 URL completa:', url);
    return this.http.get<ComprobanteResponse>(url)
      .pipe(
        tap(response => console.log('✅ Comprobante de venta obtenido:', response)),
        catchError(this.handleError)
      );
  }

  /**
   * Descarga el PDF de un comprobante
   */
  descargarPDF(comprobanteId: number): Observable<Blob> {
    console.log('🔽 Iniciando descarga PDF comprobante ID:', comprobanteId);
    
    const headers = new HttpHeaders({
      'Accept': 'application/pdf'
    });

    return this.http.get(`${this.API_URL}/${comprobanteId}/pdf`, {
      headers,
      responseType: 'blob',
      observe: 'body'
    }).pipe(
      tap(() => console.log('✅ PDF descargado exitosamente')),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Error descargando PDF:', error);
        return this.handleError(error);
      })
    );
  }

  /**
   * Descarga el XML de un comprobante
   */
  descargarXML(comprobanteId: number): Observable<Blob> {
    console.log('🔽 Iniciando descarga XML comprobante ID:', comprobanteId);
    
    const headers = new HttpHeaders({
      'Accept': 'application/xml'
    });

    return this.http.get(`${this.API_URL}/${comprobanteId}/xml`, {
      headers,
      responseType: 'blob',
      observe: 'body'
    }).pipe(
      tap(() => console.log('✅ XML descargado exitosamente')),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Error descargando XML:', error);
        return this.handleError(error);
      })
    );
  }

  /**
   * Anula un comprobante
   */
  anularComprobante(comprobanteId: number, motivo: string): Observable<ComprobanteResponse> {
    console.log('❌ Anulando comprobante ID:', comprobanteId, 'Motivo:', motivo);
    return this.http.put<ComprobanteResponse>(`${this.API_URL}/${comprobanteId}/anular`, null, {
      params: { motivo }
    }).pipe(
      tap(response => console.log('✅ Comprobante anulado:', response)),
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene el siguiente número disponible para un comprobante
   */
  obtenerSiguienteNumero(tipoDocumento: string, serie: string): Observable<string> {
    console.log('🔢 Obteniendo siguiente número para:', tipoDocumento, serie);
    return this.http.get<string>(`${this.API_URL}/siguiente-numero`, {
      params: { tipoDocumento, serie },
      responseType: 'text' as 'json'
    }).pipe(
      tap(numero => console.log('✅ Siguiente número:', numero)),
      catchError(this.handleError)
    );
  }

  /**
   * Lista todos los comprobantes
   */
  listarComprobantes(): Observable<ComprobanteResponse[]> {
    console.log('📋 Listando todos los comprobantes');
    return this.http.get<ComprobanteResponse[]>(this.API_URL)
      .pipe(
        tap(comprobantes => console.log('✅ Comprobantes listados:', comprobantes.length)),
        catchError(this.handleError)
      );
  }

  /**
   * Utilidad para descargar archivo desde blob
   */
  descargarArchivo(blob: Blob, nombreArchivo: string): void {
    console.log('💾 Descargando archivo:', nombreArchivo);
    
    try {
      // Crear URL del blob
      const url = window.URL.createObjectURL(blob);
      
      // Crear elemento de descarga temporal
      const link = document.createElement('a');
      link.href = url;
      link.download = nombreArchivo;
      link.style.display = 'none';
      
      // Agregar al DOM, hacer clic y remover
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpiar URL del blob
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Archivo descargado exitosamente:', nombreArchivo);
    } catch (error) {
      console.error('❌ Error descargando archivo:', error);
      throw error;
    }
  }

  /**
   * Manejo centralizado de errores
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Error desconocido en el servicio de comprobantes';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error de cliente: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      switch (error.status) {
        case 400:
          errorMessage = 'Solicitud incorrecta - Verifique los datos enviados';
          break;
        case 401:
          errorMessage = 'No autorizado - Inicie sesión nuevamente';
          break;
        case 403:
          errorMessage = 'Acceso denegado - No tiene permisos suficientes';
          break;
        case 404:
          errorMessage = 'Comprobante no encontrado';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          break;
        default:
          errorMessage = `Error del servidor: ${error.status} - ${error.message}`;
      }
    }
    
    console.error('❌ Error en ComprobantesService:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Envía un comprobante a imprimir en ticketera
   */
  imprimirEnTicketera(comprobanteId: number): Observable<any> {
    console.log('🎫 Enviando comprobante a ticketera ID:', comprobanteId);
    return this.http.post(`${this.API_URL}/${comprobanteId}/imprimir-ticket`, {})
      .pipe(
        tap(response => console.log('✅ Comprobante enviado a ticketera:', response)),
        catchError(this.handleError)
      );
  }

  /**
   * Imprime ticket directamente desde una venta (sin necesidad de comprobante)
   */
  imprimirTicketDesdeVenta(ventaId: number): Observable<any> {
    console.log('🎫 Imprimiendo ticket directo desde venta ID:', ventaId);
    return this.http.post(`${this.API_URL}/venta/${ventaId}/imprimir-ticket`, {})
      .pipe(
        tap(response => console.log('✅ Ticket impreso desde venta:', response)),
        catchError(this.handleError)
      );
  }

  /**
   * Obtiene la configuración de impresión disponible
   */
  obtenerConfiguracionImpresion(): Observable<any> {
    console.log('⚙️ Obteniendo configuración de impresión');
    return this.http.get(`${this.API_URL}/configuracion-impresion`)
      .pipe(
        tap(config => console.log('✅ Configuración de impresión:', config)),
        catchError(this.handleError)
      );
  }

  /**
   * Verifica la conexión con la ticketera
   */
  verificarConexionTicketera(): Observable<any> {
    console.log('📡 Verificando conexión con ticketera');
    return this.http.get(`${this.API_URL}/verificar-conexion`)
      .pipe(
        tap(response => console.log('✅ Estado de conexión:', response)),
        catchError(this.handleError)
      );
  }

  /**
   * Configura el puerto de la ticketera
   */
  configurarPuertoTicketera(puerto: string): Observable<any> {
    console.log('🔧 Configurando puerto ticketera:', puerto);
    return this.http.post(`${this.API_URL}/configurar-puerto`, { puerto })
      .pipe(
        tap(response => console.log('✅ Puerto configurado:', response)),
        catchError(this.handleError)
      );
  }

  /**
   * Obtiene los puertos disponibles para la ticketera
   */
  obtenerPuertosDisponibles(): Observable<any> {
    console.log('🔌 Obteniendo puertos disponibles');
    return this.http.get(`${this.API_URL}/puertos-disponibles`)
      .pipe(
        tap(response => console.log('✅ Puertos disponibles:', response)),
        catchError(this.handleError)
      );
  }

  /**
   * Imprime un ticket de prueba
   */
  imprimirTicketPrueba(): Observable<any> {
    console.log('🧪 Imprimiendo ticket de prueba');
    return this.http.post(`${this.API_URL}/imprimir-prueba`, {})
      .pipe(
        tap(response => console.log('✅ Ticket de prueba:', response)),
        catchError(this.handleError)
      );
  }

  /**
   * Corta el papel de la ticketera
   */
  cortarPapel(): Observable<any> {
    console.log('✂️ Cortando papel');
    return this.http.post(`${this.API_URL}/cortar-papel`, {})
      .pipe(
        tap(response => console.log('✅ Papel cortado:', response)),
        catchError(this.handleError)
      );
  }

  /**
   * Abre el cajón de dinero
   */
  abrirCajon(): Observable<any> {
    console.log('💰 Abriendo cajón de dinero');
    return this.http.post(`${this.API_URL}/abrir-cajon`, {})
      .pipe(
        tap(response => console.log('✅ Cajón abierto:', response)),
        catchError(this.handleError)
      );
  }

  /**
   * Obtiene vista previa del ticket sin imprimir
   */
  obtenerVistaPreviaTicket(comprobanteId: number): Observable<any> {
    console.log('👁️ Obteniendo vista previa ticket ID:', comprobanteId);
    return this.http.get(`${this.API_URL}/${comprobanteId}/vista-previa-ticket`)
      .pipe(
        tap(response => console.log('✅ Vista previa obtenida:', response)),
        catchError(this.handleError)
      );
  }
}
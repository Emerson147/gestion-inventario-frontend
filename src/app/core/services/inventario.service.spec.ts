import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { InventarioService, FiltrosInventario } from './inventario.service';
import { CacheService } from './cache.service';
import { NotificationService } from './notification.service';
import { environment } from '../../../environments/environment';
import { EstadoInventario } from '../models/inventario.model';

describe('InventarioService', () => {
  let service: InventarioService;
  let httpMock: HttpTestingController;
  let cacheService: jasmine.SpyObj<CacheService>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(() => {
    const cacheSpy = jasmine.createSpyObj('CacheService', ['get', 'set', 'clear']);
    const notificationSpy = jasmine.createSpyObj('NotificationService', [
      'showSuccess', 'showError', 'showStockAlert', 'showOutOfStockAlert'
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        InventarioService,
        { provide: CacheService, useValue: cacheSpy },
        { provide: NotificationService, useValue: notificationSpy }
      ]
    });

    service = TestBed.inject(InventarioService);
    httpMock = TestBed.inject(HttpTestingController);
    cacheService = TestBed.inject(CacheService) as jasmine.SpyObj<CacheService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('obtenerInventarios', () => {
    it('should return cached data when available', () => {
      const mockResponse = {
        contenido: [],
        numeroPagina: 0,
        tamañoPagina: 10,
        totalElementos: 0,
        totalPaginas: 0,
        ultima: true
      };

      cacheService.get.and.returnValue(mockResponse);

      service.obtenerInventarios().subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(cacheService.get).toHaveBeenCalled();
      });
    });

    it('should make HTTP request when no cache available', () => {
      const mockResponse = {
        contenido: [
          {
            id: 1,
            serie: 'INV001',
            cantidad: 10,
            estado: EstadoInventario.DISPONIBLE,
            fechaCreacion: '2024-01-01',
            fechaActualizacion: '2024-01-01',
            producto: null,
            color: null,
            talla: null,
            almacen: null
          }
        ],
        numeroPagina: 0,
        tamañoPagina: 10,
        totalElementos: 1,
        totalPaginas: 1,
        ultima: true
      };

      cacheService.get.and.returnValue(null);

      service.obtenerInventarios().subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(cacheService.set).toHaveBeenCalled();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}api/inventarios?page=0&size=10&sortBy=id&sortDir=asc`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('buscarInventarios', () => {
    it('should apply filters correctly', () => {
      const filtros: FiltrosInventario = {
        producto: 'test',
        estado: EstadoInventario.DISPONIBLE,
        stockMin: 5,
        stockMax: 100
      };

      const mockResponse = {
        contenido: [],
        numeroPagina: 0,
        tamañoPagina: 20,
        totalElementos: 0,
        totalPaginas: 0,
        ultima: true
      };

      cacheService.get.and.returnValue(null);

      service.buscarInventarios(filtros).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(req => 
        req.url.includes('/buscar') && 
        req.params.get('producto') === 'test' &&
        req.params.get('estado') === EstadoInventario.DISPONIBLE &&
        req.params.get('stockMin') === '5' &&
        req.params.get('stockMax') === '100'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('obtenerEstadisticas', () => {
    it('should return statistics', () => {
      const mockStats = {
        totalProductos: 100,
        valorTotalInventario: 50000,
        stockCritico: 5,
        productosAgotados: 2,
        rotacionPromedio: 3.5,
        movimientosDelMes: 150,
        eficienciaStock: 85.5,
        valorEnRiesgo: 7500
      };

      cacheService.get.and.returnValue(null);

      service.obtenerEstadisticas().subscribe(stats => {
        expect(stats).toEqual(mockStats);
        expect(cacheService.set).toHaveBeenCalled();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}api/inventarios/estadisticas`);
      expect(req.request.method).toBe('GET');
      req.flush(mockStats);
    });

    it('should return default stats on error', () => {
      cacheService.get.and.returnValue(null);

      service.obtenerEstadisticas().subscribe(stats => {
        expect(stats.totalProductos).toBe(0);
        expect(stats.valorTotalInventario).toBe(0);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}api/inventarios/estadisticas`);
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('obtenerSugerenciasReposicion', () => {
    it('should return array even if server returns object', () => {
      cacheService.get.and.returnValue(null);

      service.obtenerSugerenciasReposicion().subscribe(sugerencias => {
        expect(Array.isArray(sugerencias)).toBe(true);
        expect(sugerencias.length).toBe(0);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}api/inventarios/sugerencias-reposicion`);
      req.flush({}); // Servidor retorna objeto vacío
    });

    it('should return array when server returns array', () => {
      const mockSugerencias = [
        {
          id: 1,
          inventario: { id: 1, serie: 'INV001' },
          cantidadSugerida: 20,
          motivoReposicion: 'Stock bajo',
          prioridad: 'ALTA',
          fechaSugerencia: new Date()
        }
      ];

      cacheService.get.and.returnValue(null);

      service.obtenerSugerenciasReposicion().subscribe(sugerencias => {
        expect(Array.isArray(sugerencias)).toBe(true);
        expect(sugerencias.length).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}api/inventarios/sugerencias-reposicion`);
      req.flush(mockSugerencias);
    });
  });
});
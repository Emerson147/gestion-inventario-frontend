import { Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';

// PrimeNG Imports
import { TabViewModule } from 'primeng/tabview';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { CheckboxChangeEvent, CheckboxModule } from 'primeng/checkbox';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SliderModule } from 'primeng/slider';
import { ColorPickerModule } from 'primeng/colorpicker';
import { FileUploadModule } from 'primeng/fileupload';
import { CalendarModule } from 'primeng/calendar';
import { PasswordModule } from 'primeng/password';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { ChipModule } from 'primeng/chip';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { MultiSelectModule } from 'primeng/multiselect';
import { ConfirmationService, MessageService } from 'primeng/api';

// 🛡️ INTERFACES PARA CONFIGURACIÓN (manteniendo las tuyas)
export interface UsuarioSistema {
  id: number;
  username: string;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'VENDEDOR' | 'CAJERO' | 'SUPERVISOR';
  estado: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO';
  ultimoAcceso: Date;
  permisos: string[];
  avatar?: string;
  telefono?: string;
  sucursal: string;
}

export interface ConfiguracionNegocio {
  nombre: string;
  ruc: string;
  direccion: string;
  telefono: string;
  email: string;
  website?: string;
  logo?: string;
  slogan?: string;
  horarioApertura: string;
  horarioCierre: string;
  diasLaborales: string[];
  moneda: 'PEN' | 'USD' | 'EUR';
  idioma: 'es' | 'en';
  zonaHoraria: string;
}

export interface ConfiguracionImpresora {
  id: number;
  nombre: string;
  tipo: 'TERMICA' | 'LASER' | 'MATRIZ';
  ip?: string;
  puerto?: number;
  driver: string;
  tamanoPapel: '58mm' | '80mm' | 'A4';
  estado: 'CONECTADA' | 'DESCONECTADA' | 'ERROR';
  esDefault: boolean;
  ubicacion: string;
}

export interface ConfiguracionFiscal {
  emisorElectronico: boolean;
  certificadoDigital?: string;
  usuarioSol: string;
  claveSol: string;
  entornoSunat: 'PRODUCCION' | 'BETA';
  montoExonerado: boolean;
  serieFactura: string;
  serieBoleta: string;
  serieNota: string;
}

export interface TemaPersonalizado {
  nombre: string;
  colorPrimario: string;
  colorSecundario: string;
  colorAcento: string;
  colorFondo: string;
  fontFamily: string;
  logoUrl?: string;
  faviconUrl?: string;
  esOscuro: boolean;
}

export interface ConfiguracionBackup {
  backupAutomatico: boolean;
  frecuenciaBackup: 'DIARIO' | 'SEMANAL' | 'MENSUAL';
  horaBackup: string;
  ubicacionBackup: string;
  retencionDias: number;
  sincronizacionNube: boolean;
  servicioNube: 'GOOGLE_DRIVE' | 'DROPBOX' | 'AWS_S3';
}

interface FileUploadEvent {
  files: File[];
}

interface FileReaderEvent {
  target: {
    result: string | ArrayBuffer | null;
  } | null;
}

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TabViewModule,
    AccordionModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    DropdownModule,
    InputSwitchModule,
    CheckboxModule,
    RadioButtonModule,
    SliderModule,
    ColorPickerModule,
    FileUploadModule,
    CalendarModule,
    PasswordModule,
    ConfirmDialogModule,
    ToastModule,
    TooltipModule,
    ProgressBarModule,
    ChipModule,
    TagModule,
    TableModule,
    DialogModule,
    InputNumberModule,
    MultiSelectModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush // 🚀 Optimización de performance
})
export class ConfiguracionComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  
  // Variables principales actualizadas
  loading = false;
  guardando = false;
  currentUser = 'Emerson147';
  currentDateTime = '2025-07-12 23:33:31'; // Actualizado con la fecha actual
  
  // Sección activa
  seccionActiva = 0;
  
  // Usuarios del sistema
  usuarios: UsuarioSistema[] = [];
  usuarioSeleccionado: UsuarioSistema | null = null;
  mostrarFormularioUsuario = false;
  nuevoUsuario: UsuarioSistema = this.inicializarUsuario();
  
  // Configuración del negocio (manteniendo tu configuración)
  configNegocio: ConfiguracionNegocio = {
    nombre: 'EMPRESA EMERSON147 S.A.C.',
    ruc: '20123456789',
    direccion: 'Av. Principal 123, Lima, Perú',
    telefono: '+51 987 654 321',
    email: 'ventas@emerson147.com',
    website: 'www.emerson147.com',
    logo: '/assets/images/logo-empresa.png',
    slogan: 'Calidad y Excelencia en cada venta',
    horarioApertura: '08:00',
    horarioCierre: '20:00',
    diasLaborales: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    moneda: 'PEN',
    idioma: 'es',
    zonaHoraria: 'America/Lima'
  };
  
  // Impresoras
  impresoras: ConfiguracionImpresora[] = [];
  impresoraSeleccionada: ConfiguracionImpresora | null = null;
  mostrarFormularioImpresora = false;
  nuevaImpresora: Partial<ConfiguracionImpresora> = {}; // Agregado para el formulario
  
  // Configuración fiscal (manteniendo tu configuración)
  configFiscal: ConfiguracionFiscal = {
    emisorElectronico: true,
    usuarioSol: 'EMERSON147',
    claveSol: '****',
    entornoSunat: 'BETA',
    montoExonerado: false,
    serieFactura: 'F001',
    serieBoleta: 'B001',
    serieNota: 'N001'
  };
  
  // Personalización (manteniendo tu configuración)
  temaActual: TemaPersonalizado = {
    nombre: 'Tema Emerson147',
    colorPrimario: '#3b82f6',
    colorSecundario: '#1e40af',
    colorAcento: '#10b981',
    colorFondo: '#f8fafc',
    fontFamily: 'Inter',
    esOscuro: false
  };
  
  // Backup y sincronización (manteniendo tu configuración)
  configBackup: ConfiguracionBackup = {
    backupAutomatico: true,
    frecuenciaBackup: 'DIARIO',
    horaBackup: '02:00',
    ubicacionBackup: '/backups',
    retencionDias: 30,
    sincronizacionNube: false,
    servicioNube: 'GOOGLE_DRIVE'
  };
  
  // Variables de estado adicionales para el HTML optimizado
  testConexionImpresora = false;
  probandoConexion = false; // Agregado para el formulario de impresora
  backupEnProgreso = false;
  progresBackup = 0;
  
  // Opciones para dropdowns (manteniendo tus opciones)
  opcionesRol = [
    { label: 'Administrador', value: 'ADMIN', icon: 'pi pi-crown' },
    { label: 'Supervisor', value: 'SUPERVISOR', icon: 'pi pi-eye' },
    { label: 'Vendedor', value: 'VENDEDOR', icon: 'pi pi-user' },
    { label: 'Cajero', value: 'CAJERO', icon: 'pi pi-calculator' }
  ];
  
  opcionesEstado = [
    { label: 'Activo', value: 'ACTIVO', severity: 'success' },
    { label: 'Inactivo', value: 'INACTIVO', severity: 'warning' },
    { label: 'Suspendido', value: 'SUSPENDIDO', severity: 'danger' }
  ];
  
  opcionesMoneda = [
    { label: 'Soles (PEN)', value: 'PEN', icon: 'pi pi-money-bill' },
    { label: 'Dólares (USD)', value: 'USD', icon: 'pi pi-dollar' },
    { label: 'Euros (EUR)', value: 'EUR', icon: 'pi pi-euro' }
  ];
  
  // Opciones adicionales para impresoras (agregadas para el HTML optimizado)
  tiposImpresora = [
    { label: 'Térmica USB', value: 'TERMICA_USB' },
    { label: 'Térmica Red', value: 'TERMICA_RED' },
    { label: 'Láser', value: 'LASER' }
  ];
  
  tamanosPapel = [
    { label: '58mm', value: '58mm' },
    { label: '80mm', value: '80mm' },
    { label: 'A4', value: 'A4' }
  ];
  
  opcionesTipoImpresora = [
    { label: 'Térmica', value: 'TERMICA' },
    { label: 'Láser', value: 'LASER' },
    { label: 'Matriz de puntos', value: 'MATRIZ' }
  ];
  
  opcionesTamanoPapel = [
    { label: '58mm (Tickets)', value: '58mm' },
    { label: '80mm (Facturas)', value: '80mm' },
    { label: 'A4 (Reportes)', value: 'A4' }
  ];
  
  opcionesFrecuenciaBackup = [
    { label: 'Diario', value: 'DIARIO', icon: 'pi pi-calendar' },
    { label: 'Semanal', value: 'SEMANAL', icon: 'pi pi-calendar-plus' },
    { label: 'Mensual', value: 'MENSUAL', icon: 'pi pi-calendar-times' }
  ];
  
  opcionesServicioNube = [
    { label: 'Google Drive', value: 'GOOGLE_DRIVE', icon: 'pi pi-google' },
    { label: 'Dropbox', value: 'DROPBOX', icon: 'pi pi-cloud' },
    { label: 'Amazon S3', value: 'AWS_S3', icon: 'pi pi-server' }
  ];
  
  diasSemana = [
    { label: 'Lunes', value: 'Lunes', id: 1 },
    { label: 'Martes', value: 'Martes', id: 2 },
    { label: 'Miércoles', value: 'Miércoles', id: 3 },
    { label: 'Jueves', value: 'Jueves', id: 4 },
    { label: 'Viernes', value: 'Viernes', id: 5 },
    { label: 'Sábado', value: 'Sábado', id: 6 },
    { label: 'Domingo', value: 'Domingo', id: 7 }
  ];

  private confirmationService: ConfirmationService = inject(ConfirmationService);
  private messageService: MessageService = inject(MessageService);

  ngOnInit() {
    console.log(`🛡️ Panel de Configuración iniciado por ${this.currentUser} - ${this.currentDateTime}`);
    this.cargarDatosConfiguracion();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // 🚀 MÉTODOS DE TRACKING PARA OPTIMIZACIÓN (agregados)
  trackByUsuarioId(index: number, usuario: UsuarioSistema): number {
    return usuario.id;
  }

  trackByImpresoraId(index: number, impresora: ConfiguracionImpresora): number {
    return impresora.id;
  }

  trackByDiaId(index: number, dia: { id: number }): number {
    return dia.id;
  }

  // 🚀 MÉTODOS DE LAZY LOADING (agregados para optimización)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  cargarUsuariosLazy(event: { first?: number; rows?: number | null }) {
    this.loading = true;
    this.cdr.markForCheck();
    
    setTimeout(() => {
      // Simular carga paginada
      this.loading = false;
      this.cdr.markForCheck();
    }, 500);
  }

  // ✅ INICIALIZACIÓN Y CARGA DE DATOS (manteniendo tu lógica)
  cargarDatosConfiguracion(): void {
    this.loading = true;
    this.cdr.markForCheck();
    
    setTimeout(() => {
      this.cargarUsuarios();
      this.cargarImpresoras();
      this.loading = false;
      this.cdr.markForCheck();
    }, 1500);
  }

  cargarUsuarios(): void {
    this.usuarios = [
      {
        id: 1,
        username: 'emerson147',
        nombre: 'Emerson Admin',
        email: 'emerson@empresa.com',
        rol: 'ADMIN',
        estado: 'ACTIVO',
        ultimoAcceso: new Date('2025-07-12T23:35:00'),
        permisos: ['VENTAS', 'REPORTES', 'CONFIGURACION', 'USUARIOS'],
        avatar: 'EA',
        telefono: '+51 987 654 321',
        sucursal: 'Principal'
      },
      {
        id: 2,
        username: 'juan.perez',
        nombre: 'Juan Pérez',
        email: 'juan.perez@empresa.com',
        rol: 'VENDEDOR',
        estado: 'ACTIVO',
        ultimoAcceso: new Date('2025-07-12T18:30:00'),
        permisos: ['VENTAS'],
        avatar: 'JP',
        telefono: '+51 987 123 456',
        sucursal: 'Principal'
      },
      {
        id: 3,
        username: 'maria.garcia',
        nombre: 'María García',
        email: 'maria.garcia@empresa.com',
        rol: 'SUPERVISOR',
        estado: 'ACTIVO',
        ultimoAcceso: new Date('2025-07-12T20:15:00'),
        permisos: ['VENTAS', 'REPORTES'],
        avatar: 'MG',
        telefono: '+51 987 789 012',
        sucursal: 'Sucursal 2'
      }
    ];
  }

  cargarImpresoras(): void {
    this.impresoras = [
      {
        id: 1,
        nombre: 'Impresora Principal',
        tipo: 'TERMICA',
        ip: '192.168.1.100',
        puerto: 9100,
        driver: 'ESC/POS',
        tamanoPapel: '80mm',
        estado: 'CONECTADA',
        esDefault: true,
        ubicacion: 'Caja Principal'
      },
      {
        id: 2,
        nombre: 'Impresora Cocina',
        tipo: 'TERMICA',
        ip: '192.168.1.101',
        puerto: 9100,
        driver: 'ESC/POS',
        tamanoPapel: '58mm',
        estado: 'CONECTADA',
        esDefault: false,
        ubicacion: 'Área de Preparación'
      },
      {
        id: 3,
        nombre: 'Impresora Reportes',
        tipo: 'LASER',
        driver: 'Windows Driver',
        tamanoPapel: 'A4',
        estado: 'DESCONECTADA',
        esDefault: false,
        ubicacion: 'Oficina Administrativa'
      }
    ];
  }

  inicializarUsuario(): UsuarioSistema {
    return {
      id: 0,
      username: '',
      nombre: '',
      email: '',
      rol: 'VENDEDOR',
      estado: 'ACTIVO',
      ultimoAcceso: new Date(),
      permisos: [],
      telefono: '',
      sucursal: 'Principal'
    };
  }

  // ✅ GESTIÓN DE USUARIOS (manteniendo tu lógica)
  mostrarNuevoUsuario(): void {
    this.nuevoUsuario = this.inicializarUsuario();
    this.usuarioSeleccionado = null;
    this.mostrarFormularioUsuario = true;
    this.cdr.markForCheck();
  }

  editarUsuario(usuario: UsuarioSistema): void {
    this.usuarioSeleccionado = { ...usuario };
    this.nuevoUsuario = { ...usuario };
    this.mostrarFormularioUsuario = true;
    this.cdr.markForCheck();
  }

  guardarUsuario(): void {
    this.guardando = true;
    this.cdr.markForCheck();
    
    setTimeout(() => {
      if (this.usuarioSeleccionado) {
        // Editar usuario existente
        const index = this.usuarios.findIndex(u => u.id === this.usuarioSeleccionado!.id);
        if (index !== -1) {
          this.usuarios[index] = { ...this.nuevoUsuario };
          this.messageService.add({
            severity: 'success',
            summary: 'Usuario Actualizado',
            detail: `Usuario ${this.nuevoUsuario.nombre} actualizado correctamente`
          });
        }
      } else {
        // Crear nuevo usuario
        this.nuevoUsuario.id = Math.max(...this.usuarios.map(u => u.id)) + 1;
        this.usuarios.push({ ...this.nuevoUsuario });
        this.messageService.add({
          severity: 'success',
          summary: 'Usuario Creado',
          detail: `Usuario ${this.nuevoUsuario.nombre} creado correctamente`
        });
      }
      
      this.mostrarFormularioUsuario = false;
      this.guardando = false;
      this.cdr.markForCheck();
      console.log(`👤 Usuario gestionado por ${this.currentUser}:`, this.nuevoUsuario.nombre);
    }, 2000);
  }

  eliminarUsuario(usuario: UsuarioSistema): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar al usuario ${usuario.nombre}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.usuarios = this.usuarios.filter(u => u.id !== usuario.id);
        this.messageService.add({
          severity: 'warn',
          summary: 'Usuario Eliminado',
          detail: `Usuario ${usuario.nombre} eliminado del sistema`
        });
        this.cdr.markForCheck();
        console.log(`🗑️ Usuario eliminado por ${this.currentUser}:`, usuario.nombre);
      }
    });
  }

  // ✅ CONFIGURACIÓN DEL NEGOCIO (manteniendo tu lógica)
  guardarConfiguracionNegocio(): void {
    this.guardando = true;
    this.cdr.markForCheck();
    
    setTimeout(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Configuración Guardada',
        detail: 'Configuración del negocio actualizada correctamente'
      });
      this.guardando = false;
      this.cdr.markForCheck();
      console.log(`🏪 Configuración del negocio actualizada por ${this.currentUser}`);
    }, 2000);
  }

  // ✅ GESTIÓN DE IMPRESORAS (manteniendo tu lógica + nuevos métodos)
  testearConexionImpresora(impresora: ConfiguracionImpresora): void {
    this.testConexionImpresora = true;
    this.cdr.markForCheck();
    
    setTimeout(() => {
      const exito = Math.random() > 0.3; // 70% de probabilidad de éxito
      
      if (exito) {
        impresora.estado = 'CONECTADA';
        this.messageService.add({
          severity: 'success',
          summary: 'Conexión Exitosa',
          detail: `Impresora ${impresora.nombre} conectada correctamente`
        });
      } else {
        impresora.estado = 'ERROR';
        this.messageService.add({
          severity: 'error',
          summary: 'Error de Conexión',
          detail: `No se pudo conectar con ${impresora.nombre}`
        });
      }
      
      this.testConexionImpresora = false;
      this.cdr.markForCheck();
      console.log(`🖨️ Test de impresora ${impresora.nombre} por ${this.currentUser}: ${impresora.estado}`);
    }, 3000);
  }

  establecerImpresoraDefault(impresora: ConfiguracionImpresora): void {
    this.impresoras.forEach(i => i.esDefault = false);
    impresora.esDefault = true;
    
    this.messageService.add({
      severity: 'info',
      summary: 'Impresora por Defecto',
      detail: `${impresora.nombre} establecida como impresora principal`
    });
    this.cdr.markForCheck();
    console.log(`🖨️ Impresora por defecto cambiada por ${this.currentUser}:`, impresora.nombre);
  }

  // Nuevos métodos para el formulario de impresora
  probarConexionImpresora(): void {
    this.probandoConexion = true;
    this.cdr.markForCheck();
    
    setTimeout(() => {
      this.probandoConexion = false;
      this.messageService.add({
        severity: 'success',
        summary: 'Conexión Probada',
        detail: 'La impresora responde correctamente'
      });
      this.cdr.markForCheck();
    }, 2000);
  }

  guardarImpresora(): void {
    this.guardando = true;
    this.cdr.markForCheck();
    
    setTimeout(() => {
      const nuevaId = Math.max(...this.impresoras.map(i => i.id)) + 1;
      const impresora: ConfiguracionImpresora = {
        id: nuevaId,
        nombre: this.nuevaImpresora.nombre || 'Nueva Impresora',
        tipo: this.nuevaImpresora.tipo || 'TERMICA',
        ip: this.nuevaImpresora.ip,
        puerto: this.nuevaImpresora.puerto,
        driver: this.nuevaImpresora.driver || 'ESC/POS',
        tamanoPapel: this.nuevaImpresora.tamanoPapel || '80mm',
        estado: 'CONECTADA',
        esDefault: this.nuevaImpresora.esDefault || false,
        ubicacion: this.nuevaImpresora.ubicacion || 'Nueva Ubicación'
      };
      
      this.impresoras.push(impresora);
      this.mostrarFormularioImpresora = false;
      this.nuevaImpresora = {};
      this.guardando = false;
      
      this.messageService.add({
        severity: 'success',
        summary: 'Impresora Agregada',
        detail: `Impresora ${impresora.nombre} configurada correctamente`
      });
      this.cdr.markForCheck();
    }, 1000);
  }

  // Mostrar formulario para agregar nueva impresora
  mostrarNuevaImpresora(): void {
    this.nuevaImpresora = {};
    this.impresoraSeleccionada = null;
    this.mostrarFormularioImpresora = true;
    this.cdr.markForCheck();
  }

  // ✅ CONFIGURACIÓN FISCAL (manteniendo tu lógica)
  guardarConfiguracionFiscal(): void {
    this.guardando = true;
    this.cdr.markForCheck();
    
    setTimeout(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Configuración Fiscal Guardada',
        detail: 'Configuración SUNAT actualizada correctamente'
      });
      this.guardando = false;
      this.cdr.markForCheck();
      console.log(`💰 Configuración fiscal actualizada por ${this.currentUser}`);
    }, 2000);
  }

  // ✅ PERSONALIZACIÓN DE TEMA (manteniendo tu lógica + nuevos métodos)
  aplicarTema(): void {
    this.guardando = true;
    this.cdr.markForCheck();
    
    setTimeout(() => {
      // Aplicar estilos CSS personalizados
      document.documentElement.style.setProperty('--primary-color', this.temaActual.colorPrimario);
      document.documentElement.style.setProperty('--secondary-color', this.temaActual.colorSecundario);
      document.documentElement.style.setProperty('--accent-color', this.temaActual.colorAcento);
      
      this.messageService.add({
        severity: 'success',
        summary: 'Tema Aplicado',
        detail: 'Personalización aplicada correctamente'
      });
      this.guardando = false;
      this.cdr.markForCheck();
      console.log(`🎨 Tema personalizado aplicado por ${this.currentUser}`);
    }, 1500);
  }

  // Navegación desde breadcrumbs (placeholders, pueden integrar Router luego)
  irInicio(): void {
    console.log('Navegar a Inicio (breadcrumb)');
    // TODO: integrar con Router si se desea
  }

  irVentas(): void {
    console.log('Navegar a Ventas (breadcrumb)');
    // TODO: integrar con Router si se desea
  }

  aplicarTemaPreview(): void {
    // Aplicar temporalmente sin guardar
    document.documentElement.style.setProperty('--primary-color', this.temaActual.colorPrimario);
    document.documentElement.style.setProperty('--secondary-color', this.temaActual.colorSecundario);
    document.documentElement.style.setProperty('--accent-color', this.temaActual.colorAcento);
    
    this.messageService.add({
      severity: 'info',
      summary: 'Vista Previa',
      detail: 'Mostrando vista previa del tema'
    });
  }

  resetearTema(): void {
    this.temaActual = {
      nombre: 'Tema Emerson147',
      colorPrimario: '#3b82f6',
      colorSecundario: '#1e40af',
      colorAcento: '#10b981',
      colorFondo: '#f8fafc',
      fontFamily: 'Inter',
      esOscuro: false
    };
    this.aplicarTemaPreview();
    this.cdr.markForCheck();
  }

  // ✅ BACKUP Y SINCRONIZACIÓN (manteniendo tu lógica)
  ejecutarBackupManual(): void {
    this.backupEnProgreso = true;
    this.progresBackup = 0;
    this.cdr.markForCheck();
    
    const interval = setInterval(() => {
      this.progresBackup += Math.random() * 15;
      this.cdr.markForCheck();
      
      if (this.progresBackup >= 100) {
        this.progresBackup = 100;
        clearInterval(interval);
        
        setTimeout(() => {
          this.backupEnProgreso = false;
          this.progresBackup = 0;
          this.messageService.add({
            severity: 'success',
            summary: 'Backup Completado',
            detail: 'Respaldo de datos realizado exitosamente'
          });
          this.cdr.markForCheck();
          console.log(`💾 Backup manual ejecutado por ${this.currentUser}`);
        }, 500);
      }
    }, 200);
  }

  // ✅ UTILIDADES OPTIMIZADAS (manteniendo tu lógica + nuevos métodos)
  getRolIcon(rol: string): string {
    switch (rol) {
      case 'ADMIN': return 'pi pi-crown';
      case 'SUPERVISOR': return 'pi pi-eye';
      case 'VENDEDOR': return 'pi pi-user';
      case 'CAJERO': return 'pi pi-calculator';
      default: return 'pi pi-user';
    }
  }

  getRolClasses(rol: string): string {
    const roleClassMap: Record<string, string> = {
      'ADMIN': 'bg-red-100 text-red-800',
      'SUPERVISOR': 'bg-purple-100 text-purple-800',
      'CAJERO': 'bg-blue-100 text-blue-800',
      'VENDEDOR': 'bg-green-100 text-green-800'
    };
    return roleClassMap[rol] || 'bg-gray-100 text-gray-800';
  }

  getEstadoSeverity(estado: string): string {
    switch (estado) {
      case 'ACTIVO': return 'success';
      case 'INACTIVO': return 'warning';
      case 'SUSPENDIDO': return 'danger';
      default: return 'info';
    }
  }

  getEstadoImpresoraSeverity(estado: string): string {
    switch (estado) {
      case 'CONECTADA': return 'success';
      case 'DESCONECTADA': return 'warning';
      case 'ERROR': return 'danger';
      default: return 'info';
    }
  }

  getImpresoraTipoClasses(tipo: string): string {
    const tipoClassMap: Record<string, string> = {
      'TERMICA': 'bg-blue-600',
      'LASER': 'bg-purple-600',
      'MATRIZ': 'bg-green-600'
    };
    return tipoClassMap[tipo] || 'bg-gray-600';
  }

  formatearFechaUltimoAcceso(fecha: Date): string {
    const ahora = new Date();
    const diferencia = ahora.getTime() - fecha.getTime();
    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

    if (minutos < 1) return 'Ahora mismo';
    if (minutos < 60) return `Hace ${minutos} minutos`;
    if (horas < 24) return `Hace ${horas} horas`;
    return `Hace ${dias} días`;
  }

  onDiaLaboralChange(option: { label: string; value: string; }, $event: CheckboxChangeEvent) {
    if ($event.checked) {
      if (!this.configNegocio.diasLaborales.includes(option.value)) {
        this.configNegocio.diasLaborales.push(option.value);
      }
    } else {
      this.configNegocio.diasLaborales = this.configNegocio.diasLaborales.filter(day => day !== option.value);
    }
    this.cdr.markForCheck();
  }

  // ✅ EVENTOS DE ARCHIVO (manteniendo tu lógica)
  onUploadLogo(event: FileUploadEvent): void {
    const file = event.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: FileReaderEvent) => {
        if (e.target?.result) {
          this.configNegocio.logo = e.target.result as string;
          this.messageService.add({
            severity: 'success',
            summary: 'Logo Subido',
            detail: 'Logo de empresa actualizado correctamente'
          });
          this.cdr.markForCheck();
        }
      };
      reader.readAsDataURL(file);
    }
  }

  onUploadFavicon(event: FileUploadEvent): void {
    const file = event.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: FileReaderEvent) => {
        if (e.target?.result) {
          this.temaActual.faviconUrl = e.target.result as string;
          this.messageService.add({
            severity: 'success',
            summary: 'Favicon Subido',
            detail: 'Icono del sistema actualizado correctamente'
          });
          this.cdr.markForCheck();
        }
      };
      reader.readAsDataURL(file);
    }
  }

}
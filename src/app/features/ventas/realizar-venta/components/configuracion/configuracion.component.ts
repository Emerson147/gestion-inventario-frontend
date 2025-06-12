import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

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
import { ConfirmationService, MessageService } from 'primeng/api';

// 🛡️ INTERFACES PARA CONFIGURACIÓN
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
  igv: number;
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
    DialogModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.scss']
})
export class ConfiguracionComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Variables principales
  loading: boolean = false;
  guardando: boolean = false;
  currentUser: string = 'Emerson147';
  currentDateTime: string = '03/06/2025 07:40:10';
  
  // Sección activa
  seccionActiva: number = 0;
  
  // Usuarios del sistema
  usuarios: UsuarioSistema[] = [];
  usuarioSeleccionado: UsuarioSistema | null = null;
  mostrarFormularioUsuario: boolean = false;
  nuevoUsuario: UsuarioSistema = this.inicializarUsuario();
  
  // Configuración del negocio
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
  mostrarFormularioImpresora: boolean = false;
  
  // Configuración fiscal
  configFiscal: ConfiguracionFiscal = {
    emisorElectronico: true,
    usuarioSol: 'EMERSON147',
    claveSol: '****',
    entornoSunat: 'BETA',
    igv: 18,
    montoExonerado: false,
    serieFactura: 'F001',
    serieBoleta: 'B001',
    serieNota: 'N001'
  };
  
  // Personalización
  temaActual: TemaPersonalizado = {
    nombre: 'Tema Emerson147',
    colorPrimario: '#3b82f6',
    colorSecundario: '#1e40af',
    colorAcento: '#10b981',
    colorFondo: '#f8fafc',
    fontFamily: 'Inter',
    esOscuro: false
  };
  
  // Backup y sincronización
  configBackup: ConfiguracionBackup = {
    backupAutomatico: true,
    frecuenciaBackup: 'DIARIO',
    horaBackup: '02:00',
    ubicacionBackup: '/backups',
    retencionDias: 30,
    sincronizacionNube: false,
    servicioNube: 'GOOGLE_DRIVE'
  };
  
  // Variables de estado
  testConexionImpresora: boolean = false;
  backupEnProgreso: boolean = false;
  progresBackup: number = 0;
  
  // Opciones para dropdowns
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
    { label: 'Lunes', value: 'Lunes' },
    { label: 'Martes', value: 'Martes' },
    { label: 'Miércoles', value: 'Miércoles' },
    { label: 'Jueves', value: 'Jueves' },
    { label: 'Viernes', value: 'Viernes' },
    { label: 'Sábado', value: 'Sábado' },
    { label: 'Domingo', value: 'Domingo' }
  ];

  constructor(
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    console.log(`🛡️ Panel de Configuración iniciado por ${this.currentUser} - ${this.currentDateTime}`);
    this.cargarDatosConfiguracion();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ✅ INICIALIZACIÓN Y CARGA DE DATOS
  cargarDatosConfiguracion(): void {
    this.loading = true;
    
    setTimeout(() => {
      this.cargarUsuarios();
      this.cargarImpresoras();
      this.loading = false;
      console.log('📊 Datos de configuración cargados para Emerson147');
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
        ultimoAcceso: new Date('2025-06-03T07:35:00'),
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
        ultimoAcceso: new Date('2025-06-02T18:30:00'),
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
        ultimoAcceso: new Date('2025-06-02T20:15:00'),
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

  // ✅ GESTIÓN DE USUARIOS
  mostrarNuevoUsuario(): void {
    this.nuevoUsuario = this.inicializarUsuario();
    this.usuarioSeleccionado = null;
    this.mostrarFormularioUsuario = true;
  }

  editarUsuario(usuario: UsuarioSistema): void {
    this.usuarioSeleccionado = { ...usuario };
    this.nuevoUsuario = { ...usuario };
    this.mostrarFormularioUsuario = true;
  }

  guardarUsuario(): void {
    this.guardando = true;
    
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
        console.log(`🗑️ Usuario eliminado por ${this.currentUser}:`, usuario.nombre);
      }
    });
  }

  // ✅ CONFIGURACIÓN DEL NEGOCIO
  guardarConfiguracionNegocio(): void {
    this.guardando = true;
    
    setTimeout(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Configuración Guardada',
        detail: 'Configuración del negocio actualizada correctamente'
      });
      this.guardando = false;
      console.log(`🏪 Configuración del negocio actualizada por ${this.currentUser}`);
    }, 2000);
  }

  // ✅ GESTIÓN DE IMPRESORAS
  testearConexionImpresora(impresora: ConfiguracionImpresora): void {
    this.testConexionImpresora = true;
    
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
    console.log(`🖨️ Impresora por defecto cambiada por ${this.currentUser}:`, impresora.nombre);
  }

  // ✅ CONFIGURACIÓN FISCAL
  guardarConfiguracionFiscal(): void {
    this.guardando = true;
    
    setTimeout(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Configuración Fiscal Guardada',
        detail: 'Configuración SUNAT actualizada correctamente'
      });
      this.guardando = false;
      console.log(`💰 Configuración fiscal actualizada por ${this.currentUser}`);
    }, 2000);
  }

  // ✅ PERSONALIZACIÓN DE TEMA
  aplicarTema(): void {
    this.guardando = true;
    
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
      console.log(`🎨 Tema personalizado aplicado por ${this.currentUser}`);
    }, 1500);
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
    this.aplicarTema();
  }

  // ✅ BACKUP Y SINCRONIZACIÓN
  ejecutarBackupManual(): void {
    this.backupEnProgreso = true;
    this.progresBackup = 0;
    
    const interval = setInterval(() => {
      this.progresBackup += Math.random() * 15;
      
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
          console.log(`💾 Backup manual ejecutado por ${this.currentUser}`);
        }, 500);
      }
    }, 200);
  }

  // ✅ UTILIDADES
  getRolIcon(rol: string): string {
    switch (rol) {
      case 'ADMIN': return 'pi pi-crown';
      case 'SUPERVISOR': return 'pi pi-eye';
      case 'VENDEDOR': return 'pi pi-user';
      case 'CAJERO': return 'pi pi-calculator';
      default: return 'pi pi-user';
    }
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

  onDiaLaboralChange(_t218: { label: string; value: string; },$event: CheckboxChangeEvent) {
    throw new Error('Method not implemented.');
 }

  // ✅ EVENTOS DE ARCHIVO
  onUploadLogo(event: any): void {
    const file = event.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.configNegocio.logo = e.target.result;
        this.messageService.add({
          severity: 'success',
          summary: 'Logo Subido',
          detail: 'Logo de empresa actualizado correctamente'
        });
      };
      reader.readAsDataURL(file);
    }
  }

  onUploadFavicon(event: any): void {
    const file = event.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.temaActual.faviconUrl = e.target.result;
        this.messageService.add({
          severity: 'success',
          summary: 'Favicon Subido',
          detail: 'Icono del sistema actualizado correctamente'
        });
      };
      reader.readAsDataURL(file);
    }
  }
}
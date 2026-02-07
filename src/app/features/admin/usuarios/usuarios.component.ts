import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { PanelModule } from 'primeng/panel'; // 👈 Nuevo import
import { TooltipModule } from 'primeng/tooltip'; // 👈 Nuevo import
import { AvatarModule } from 'primeng/avatar'; // 👈 Nuevo import
import { AvatarGroupModule } from 'primeng/avatargroup'; // 👈 Nuevo import
import { ChipModule } from 'primeng/chip'; // 👈 Nuevo import
import { BadgeModule } from 'primeng/badge'; // 👈 Nuevo import
import { InputSwitchModule } from 'primeng/inputswitch'; // 👈 Nuevo import

import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { User } from '../../../core/models/user.model';
import { UsuarioService, PagedUserResponse } from '../../../core/services/usuario.service';
import { PermissionService, PermissionType } from '../../../core/services/permission.service';
import { AnimationService } from '../../../core/animations/animation.service';
import { Subject, firstValueFrom, finalize } from 'rxjs';
import { ToastNotificationComponent } from '../../../shared/components/toast-notification/toast-notification.component';
import { ToastService } from '../../../shared/services/toast.service';

interface ViewOption {
  label: string;
  value: 'table' | 'cards';
  icon: string;
}

interface RoleOption {
  label: string;
  value: string;
  description: string;
  icon: string;
  color: string;
}

interface StatusOption {
  label: string;
  value: boolean;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    CheckboxModule,
    ConfirmDialogModule,
    DialogModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    PasswordModule,
    SelectModule,
    SelectButtonModule,
    TableModule,
    TagModule,
    TextareaModule,
    ToastModule,
    ToolbarModule,
    PanelModule, // 👈 Nuevo import
    TooltipModule, // 👈 Nuevo import
    AvatarModule, // 👈 Nuevo import
    AvatarGroupModule, // 👈 Nuevo import
    ChipModule, // 👈 Nuevo import
    BadgeModule, // 👈 Nuevo import
    InputSwitchModule, // 👈 Nuevo import
    ToastNotificationComponent, // 👈 Toast notification
    HasPermissionDirective
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './usuarios.component.html',
  styles: [`
    :host ::ng-deep .user-dialog-header .p-dialog-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      color: white !important;
      border: none !important;
      padding: 1.5rem 1.5rem 0.5rem 1.5rem;
    }

    /* 👇 Nuevos estilos para el diseño moderno */
    :host ::ng-deep {
      /* Cards más elegantes */
      .p-card {
        border-radius: 16px !important;
        transition: all 0.3s ease !important;
      }
      
      /* Botones con sombras */
      .p-button {
        transition: all 0.3s ease !important;
      }
      
      .p-button:hover {
        transform: translateY(-1px);
      }
      
      /* Input fields más modernos */
      .p-inputtext,
      .p-dropdown,
      .p-select,
      .p-password input {
        border-radius: 8px !important;
        border: 1px solid #e5e7eb !important;
        transition: all 0.3s ease !important;
      }
      
      .p-inputtext:focus,
      .p-dropdown:focus,
      .p-select:focus,
      .p-password input:focus {
        border-color: #6366f1 !important;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1) !important;
      }

      /* Panel de filtros */
      .p-panel .p-panel-header {
        background: transparent !important;
        border: none !important;
        padding: 1rem !important;
      }

      .p-panel .p-panel-content {
        border: none !important;
        background: transparent !important;
      }

      /* Avatares modernos */
      .p-avatar {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        color: white !important;
      }
    }

    /* 👇 Utilidades CSS personalizadas */
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .line-clamp-3 {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .card-hover {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .card-hover:hover {
      transform: translateY(-4px);
    }

    /* Indicador de fortaleza de contraseña */
    .password-strength-indicator {
      height: 4px;
      border-radius: 2px;
      transition: all 0.3s ease;
    }
  `]
})
export class UsuariosComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('usuariosTable') usuariosTable!: ElementRef;

  // ========== DATOS Y ESTADO ==========
  users: User[] = [];
  usersFiltrados: User[] = [];
  selectedUsers: User[] = [];
  user: User = this.initUser();

  // ========== FILTROS ==========
  filtroTexto = '';
  filtroRol = '';
  filtroEstado: boolean | null = null;
  rolesDisponibles: string[] = [];

  // ========== FORMULARIO ==========
  mostrarPassword = false;
  passwordStrength = 0;

  // ========== ESTADO UI ==========
  userDialog = false;
  editMode = false;
  loading = false;
  submitted = false;
  currentView: 'table' | 'cards' = 'table';
  filtersCollapsed = true;

  // 👇 Nuevas propiedades para el diseño moderno
  filtrosPanelCollapsed = true;
  estadisticasDialog = false;
  detalleUsuarioDialog = false;
  usuarioDetalle: User | null = null;
  perfilDialog = false;

  // ========== CONFIGURACIÓN ==========
  viewOptions: ViewOption[] = [
    { label: 'Tabla', value: 'table', icon: 'pi pi-list' },
    { label: 'Tarjetas', value: 'cards', icon: 'pi pi-th-large' }
  ];

  roleOptions: RoleOption[] = [
    { 
      label: 'Administrador', 
      value: 'admin', 
      description: 'Acceso completo al sistema',
      icon: 'pi pi-crown',
      color: 'danger'
    },
    { 
      label: 'Ventas', 
      value: 'ventas', 
      description: 'Gestión de ventas y productos',
      icon: 'pi pi-shopping-cart',
      color: 'success'
    }
  ];

  statusOptions: StatusOption[] = [
    { label: 'Activo', value: true, icon: 'pi pi-check-circle', color: 'success' },
    { label: 'Inactivo', value: false, icon: 'pi pi-times-circle', color: 'danger' }
  ];

  // ========== PERMISOS ==========
  permissionTypes = PermissionType;
  private destroy$ = new Subject<void>();

  private readonly userService: UsuarioService = inject(UsuarioService);
  private readonly messageService: MessageService = inject(MessageService);
  private readonly confirmationService: ConfirmationService = inject(ConfirmationService);
  private readonly animationService: AnimationService = inject(AnimationService);
  private readonly permissionService: PermissionService = inject(PermissionService);
  readonly toastService = inject(ToastService);

  ngOnInit(): void {
    this.loadUsers();
  }

  onToastDismissed(id: string): void {
    this.toastService.dismiss(id);
  }

  ngAfterViewInit(): void {
    if (this.usuariosTable) {
      this.animationService.headerElementsEntrance([this.usuariosTable.nativeElement], {
        distance: 30,
        delay: 0.1
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========== NUEVOS MÉTODOS PARA EL DISEÑO MODERNO ==========

  /**
   * 👇 Calcula métricas del dashboard de usuarios
   */
  calcularMetricasUsuarios() {
    const total = this.users?.length || 0;
    const activos = this.users?.filter(u => u.activo).length || 0;
    const inactivos = total - activos;
    const admins = this.users?.filter(u => u.roles?.includes('admin')).length || 0;
    const ventas = this.users?.filter(u => u.roles?.includes('ventas')).length || 0;
    
    // Usuarios registrados en los últimos 30 días
    const treintaDiasAtras = new Date();
    treintaDiasAtras.setDate(treintaDiasAtras.getDate() - 30);
    const nuevosUsuarios = this.users?.filter(u => 
      u.fechaCreacion && new Date(u.fechaCreacion) > treintaDiasAtras
    ).length || 0;

    return {
      total,
      activos,
      inactivos,
      admins,
      ventas,
      nuevosUsuarios,
      porcentajeActivos: total > 0 ? Math.round((activos / total) * 100) : 0
    };
  }

  /**
   * 👇 Cuenta cuántos filtros están activos
   */
  getTotalFiltrosActivos(): number {
    let count = 0;
    if (this.filtroTexto?.trim()) count++;
    if (this.filtroRol) count++;
    if (this.filtroEstado !== null) count++;
    return count;
  }

  /**
   * 👇 Tracking para mejor performance en ngFor
   */
  trackByUsuario(index: number, usuario: User): number {
    return usuario.id || index;
  }

  /**
   * 👇 Maneja el toggle del panel de filtros
   */
  onFiltrosPanelToggle(event: { collapsed: boolean } | Event): void {
    if ('collapsed' in event) {
      this.filtrosPanelCollapsed = event.collapsed;
    }
  }

  /**
   * 👇 Muestra detalles del usuario en modal
   */
  verDetallesUsuario(usuario: User): void {
    this.usuarioDetalle = { ...usuario };
    this.detalleUsuarioDialog = true;
  }

  /**
   * 👇 Muestra estadísticas de usuarios
   */
  mostrarEstadisticas(): void {
    this.estadisticasDialog = true;
  }

  /**
   * 👇 Obtiene estadísticas detalladas
   */
  getEstadisticas() {
    const usuarios = this.users || [];
    const metricas = this.calcularMetricasUsuarios();
    
    // Análisis por roles
    const roleStats = this.roleOptions.map(role => ({
      ...role,
      count: usuarios.filter(u => u.roles?.includes(role.value)).length
    }));

    // Usuarios más recientes
    const usuariosRecientes = usuarios
      .filter(u => u.fechaCreacion)
      .sort((a, b) => new Date(b.fechaCreacion!).getTime() - new Date(a.fechaCreacion!).getTime())
      .slice(0, 5);

    return {
      ...metricas,
      roleStats,
      usuariosRecientes
    };
  }

  /**
   * 👇 Cambia el estado de un usuario rápidamente
   */
  toggleEstadoUsuario(usuario: User): void {
    if (!this.permissionService.canEdit('usuarios')) {
      this.showError('No tiene permisos para cambiar el estado de usuarios');
      return;
    }

    const nuevoEstado = !usuario.activo;
    const mensaje = nuevoEstado ? 'activar' : 'desactivar';
    
    this.confirmationService.confirm({
      message: `¿Desea ${mensaje} al usuario "${usuario.nombres} ${usuario.apellidos}"?`,
      header: `Confirmar ${mensaje} usuario`,
      icon: 'pi pi-question-circle',
      accept: () => {
        this.userService.updateUser(usuario.id!, { ...usuario, activo: nuevoEstado })
          .subscribe({
            next: () => {
              usuario.activo = nuevoEstado;
              this.showSuccess(`Usuario ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`);
            },
            error: (error) => this.handleError(error, `Error al ${mensaje} usuario`)
          });
      }
    });
  }

  /**
   * 👇 Exporta usuarios seleccionados
   */
  async exportarSeleccionados(): Promise<void> {
    if (!this.selectedUsers?.length) {
      this.showWarning('No hay usuarios seleccionados para exportar');
      return;
    }

    try {
      const xlsx = await import('xlsx');
      
      const dataToExport = this.selectedUsers.map(user => ({
        'ID': user.id || '',
        'Usuario': user.username || '',
        'Nombres': user.nombres || '',
        'Apellidos': user.apellidos || '',
        'Email': user.email || '',
        'Roles': this.getRoleLabel(user.roles || []),
        'Estado': this.getStatusLabel(user.activo),
        'Fecha Creación': user.fechaCreacion ? new Date(user.fechaCreacion).toLocaleString() : 'N/A',
        'Última Actualización': user.fechaActualizacion ? new Date(user.fechaActualizacion).toLocaleString() : 'N/A'
      }));
      
      const worksheet = xlsx.utils.json_to_sheet(dataToExport);
      const workbook = { Sheets: { 'Usuarios_Seleccionados': worksheet }, SheetNames: ['Usuarios_Seleccionados'] };
      const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
      this.guardarArchivo(excelBuffer, 'usuarios_seleccionados');
      
      this.showSuccess(`${this.selectedUsers.length} usuarios seleccionados exportados correctamente`);
    } catch (error) {
      this.handleError(error, 'Error al exportar usuarios seleccionados');
    }
  }

  /**
   * 👇 Genera avatar personalizado
   */
  getAvatarUrl(usuario: User | null): string {
    // Si no hay usuario, retornamos un avatar por defecto
    if (!usuario) {
      return 'https://ui-avatars.com/api/?name=?&background=667eea&color=fff&size=128&font-size=0.6';
    }
    
    // Si el usuario tiene avatar, lo usamos
    if (usuario.avatar) {
      return usuario.avatar;
    }
    
    // Generamos un avatar usando un servicio de avatares con las iniciales
    const initials = this.getInitials(usuario);
    return `https://ui-avatars.com/api/?name=${initials}&background=667eea&color=fff&size=128&font-size=0.6`;
  }

  /**
   * 👇 Cierra modales
   */
  hideDetalleUsuarioDialog(): void {
    this.detalleUsuarioDialog = false;
    this.usuarioDetalle = null;
  }

  hideEstadisticasDialog(): void {
    this.estadisticasDialog = false;
  }

  hidePerfilDialog(): void {
    this.perfilDialog = false;
  }

  // ========== MÉTODOS DE CARGA (Manteniendo funcionalidad original) ==========

  loadUsers(): void {
    this.loading = true;
    
    this.userService.getUsers().subscribe({
      next: (response: PagedUserResponse) => {
        this.users = response.contenido || [];  
        this.usersFiltrados = [...this.users];
        this.extractRoles();
      },
      error: (error) => {
        this.handleError(error, 'No se pudo cargar los usuarios');
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
  private extractRoles(): void {
    const rolesSet = new Set<string>();
    this.users.forEach(user => {
      if (user.roles && Array.isArray(user.roles)) {
        user.roles.forEach(role => rolesSet.add(role));
      }
    });
    this.rolesDisponibles = Array.from(rolesSet).sort();
  }

  // ========== FILTROS (Manteniendo funcionalidad original) ==========

  aplicarFiltros(): void {
    let usuarios = [...this.users];

    // Filtro por texto (nombres, apellidos, username, email)
    if (this.filtroTexto) {
      const texto = this.filtroTexto.toLowerCase();
      usuarios = usuarios.filter(user => 
        user.nombres?.toLowerCase().includes(texto) ||
        user.apellidos?.toLowerCase().includes(texto) ||
        user.username?.toLowerCase().includes(texto) ||
        user.email?.toLowerCase().includes(texto)
      );
    }

    // Filtro por rol
    if (this.filtroRol) {
      usuarios = usuarios.filter(user => 
        user.roles && user.roles.includes(this.filtroRol)
      );
    }

    // Filtro por estado
    if (this.filtroEstado !== null) {
      usuarios = usuarios.filter(user => user.activo === this.filtroEstado);
    }

    this.usersFiltrados = usuarios;
  }

  limpiarFiltros(): void {
    this.filtroTexto = '';
    this.filtroRol = '';
    this.filtroEstado = null;
    this.usersFiltrados = [...this.users];
    this.selectedUsers = [];
  }

  // ========== CRUD (Manteniendo funcionalidad original) ==========

  openNew(): void {
    if (!this.permissionService.canCreate('usuarios')) {
      this.showError('No tiene permisos para crear usuarios');
      return;
    }
    
    this.editMode = false;
    this.user = this.initUser();
    this.submitted = false;
    this.mostrarPassword = false;
    this.passwordStrength = 0;
    this.userDialog = true;

    this.animateDialogEntrance();
  }

  editUser(user: User): void {
    if (!this.permissionService.canEdit('usuarios')) {
      this.showError('No tiene permisos para editar usuarios');
      return;
    }
    
    this.editMode = true;
    this.user = { ...user, password: '' };
    this.submitted = false;
    this.mostrarPassword = false;
    this.passwordStrength = 0;
    this.userDialog = true;

    this.animateDialogEntrance();
  }

  saveUser(): void {
    this.submitted = true;
    
    if (!this.isValidUser()) {
      this.animateFormError();
      return;
    }
    
    this.loading = true;
    
    const saveOperation = this.editMode && this.user.id
      ? this.updateExistingUser()
      : this.createNewUser();
      
    saveOperation!
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.animateSuccess();
          this.hideDialog();
          this.loadUsers();
        },
        error: (error) => {
          this.animateError();
          this.handleError(error, 'Error al procesar el usuario');
        }
      });
  }

  private updateExistingUser() {
    if (!this.user.id) return;
    
    const userData = { ...this.user };
    if (this.editMode && (!userData.password || userData.password.trim() === '')) {
      delete userData.password;
    }
    
    return this.userService.updateUser(this.user.id, userData);
  }
  
  private createNewUser() {
    return this.userService.createUser(this.user);
  }

  deleteUser(user: User): void {
    if (!this.permissionService.canDelete('usuarios')) {
      this.showError('No tiene permisos para eliminar usuarios');
      return;
    }

    if (!user.id) return;
    
    this.confirmationService.confirm({
      message: `¿Está seguro que desea eliminar al usuario "${user.nombres} ${user.apellidos}"?`,
      header: 'Confirmar eliminación de usuario',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.loading = true;
        this.userService.deleteUser(user.id!)
          .pipe(finalize(() => this.loading = false))
          .subscribe({
            next: () => {
              this.showSuccess('Usuario eliminado correctamente');
              this.loadUsers();
              this.selectedUsers = [];
            },
            error: (error) => this.handleError(error, 'No se pudo eliminar el usuario')
          });
      }
    });
  }

  deleteSelectedUsers(): void {
    if (!this.permissionService.canDelete('usuarios')) {
      this.showError('No tiene permisos para eliminar usuarios');
      return;
    }

    if (!this.selectedUsers.length) return;
    
    this.confirmationService.confirm({
      message: `¿Está seguro que desea eliminar los ${this.selectedUsers.length} usuarios seleccionados?`,
      header: 'Confirmar eliminación múltiple',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.processMultipleDelete()
    });
  }

  // ========== VALIDACIONES (Manteniendo funcionalidad original) ==========

  private isValidUser(): boolean {
    if (!this.user.nombres?.trim()) {
      this.showError('El nombre es obligatorio');
      return false;
    }

    if (!this.user.apellidos?.trim()) {
      this.showError('Los apellidos son obligatorios');
      return false;
    }

    if (!this.user.username?.trim()) {
      this.showError('El nombre de usuario es obligatorio');
      return false;
    }

    if (!this.user.email?.trim()) {
      this.showError('El email es obligatorio');
      return false;
    }

    if (!this.isValidEmail(this.user.email)) {
      this.showError('El formato del email no es válido');
      return false;
    }

    if (!this.editMode && !this.user.password) {
      this.showError('La contraseña es obligatoria para nuevos usuarios');
      return false;
    }

    if (this.user.password && !this.isValidPassword(this.user.password)) {
      this.showError('La contraseña no cumple con los requisitos de seguridad');
      return false;
    }

    if (!this.user.roles || this.user.roles.length === 0) {
      this.showError('Debe asignar al menos un rol al usuario');
      return false;
    }

    return true;
  }

  public isValidEmail(email: string | undefined): boolean {
    if (!email) return false;
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return emailRegex.test(email);
  }

  public isValidPassword(password: string | undefined): boolean {
    if (!password) return false;
    // At least 8 characters, one uppercase, one lowercase, one number and one special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  calculatePasswordStrength(password: string): void {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[@#$%^&+=]/.test(password)) strength += 25;
    
    this.passwordStrength = Math.min(strength, 100);
  }

  getPasswordStrengthColor(): string {
    if (this.passwordStrength < 50) return 'danger';
    if (this.passwordStrength < 75) return 'warning';
    return 'success';
  }

  getPasswordStrengthText(): string {
    if (this.passwordStrength < 25) return 'Muy débil';
    if (this.passwordStrength < 50) return 'Débil';
    if (this.passwordStrength < 75) return 'Buena';
    if (this.passwordStrength < 100) return 'Fuerte';
    return 'Muy fuerte';
  }

  private async processMultipleDelete(): Promise<void> {
    this.loading = true;
    
    try {
      const deleteOperations = this.selectedUsers
        .filter(user => user.id)
        .map(user => firstValueFrom(this.userService.deleteUser(user.id!)));
        
      await Promise.all(deleteOperations);

      this.showSuccess(`${this.selectedUsers.length} usuarios eliminados correctamente`);
      this.loadUsers();
      this.selectedUsers = [];
    } catch (error) {
      this.handleError(error, 'No se pudieron eliminar algunos usuarios');
    } finally {
      this.loading = false;
    }
  }

  // ========== UTILIDADES (Manteniendo y expandiendo funcionalidad original) ==========

  hideDialog(): void {
    this.userDialog = false;
    this.submitted = false;
    this.user = this.initUser();
    this.mostrarPassword = false;
    this.passwordStrength = 0;
  }

  onGlobalFilter(dt: { filterGlobal: (value: string, matchMode: string) => void }, event: Event): void {
    const element = event.target as HTMLInputElement;
    dt.filterGlobal(element.value, 'contains');
  }

  getStatusLabel(status: boolean | string): string {
    const boolStatus = typeof status === 'string' 
      ? status.toLowerCase() === 'true' 
      : status;
    return boolStatus ? 'Activo' : 'Inactivo';
  }
  
  getStatusSeverity(status: boolean | string): "success" | "danger" {
    const boolStatus = typeof status === 'string' 
      ? status.toLowerCase() === 'true' 
      : status;
    return boolStatus ? "success" : "danger";
  }

  getRoleLabel(roles: string[]): string {
    if (!roles || roles.length === 0) return 'Sin rol';
    
    const roleLabels = roles.map(role => {
      const roleOption = this.roleOptions.find(r => r.value === role);
      return roleOption ? roleOption.label : role;
    });
    
    return roleLabels.join(', ');
  }

  getRoleColor(roles: string[]): string {
    if (!roles || roles.length === 0) return 'secondary';
    
    if (roles.includes('admin')) return 'danger';
    if (roles.includes('ventas')) return 'success';
    return 'info';
  }

  getRoleIcon(roles: string[]): string {
    if (!roles || roles.length === 0) return 'pi pi-user';
    
    if (roles.includes('admin')) return 'pi pi-crown';
    if (roles.includes('ventas')) return 'pi pi-shopping-cart';
    return 'pi pi-user';
  }

  getInitials(user: User | null): string {
    if (!user) {
      return '?';
    }
    const nombres = user.nombres || '';
    const apellidos = user.apellidos || '';
    return (nombres.charAt(0) + apellidos.charAt(0)).toUpperCase() || '?';
  }

  // ========== EXPORTACIÓN (Manteniendo y expandiendo funcionalidad original) ==========

  async exportarExcel(): Promise<void> {
    if (!this.usersFiltrados?.length) {
      this.showWarning('No hay datos para exportar');
      return;
    }

    try {
      const xlsx = await import('xlsx');
      
      const dataToExport = this.usersFiltrados.map(user => ({
        'ID': user.id || '',
        'Usuario': user.username || '',
        'Nombres': user.nombres || '',
        'Apellidos': user.apellidos || '',
        'Email': user.email || '',
        'Roles': this.getRoleLabel(user.roles || []),
        'Estado': this.getStatusLabel(user.activo),
        'Fecha Creación': user.fechaCreacion ? new Date(user.fechaCreacion).toLocaleString() : 'N/A',
        'Última Actualización': user.fechaActualizacion ? new Date(user.fechaActualizacion).toLocaleString() : 'N/A'
      }));
      
      const worksheet = xlsx.utils.json_to_sheet(dataToExport);
      const workbook = { Sheets: { 'Usuarios': worksheet }, SheetNames: ['Usuarios'] };
      const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
      this.guardarArchivo(excelBuffer, 'usuarios');
    } catch (error) {
      this.handleError(error, 'Error al exportar a Excel');
    }
  }

  private guardarArchivo(buffer: ArrayBuffer, fileName: string): void {
    const data = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(data);
    link.download = `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    link.click();
  }

  // ========== ANIMACIONES (Manteniendo funcionalidad original) ==========

  private animateDialogEntrance(): void {
    setTimeout(() => {
      const formFields = document.querySelectorAll('.p-dialog .flex.flex-col.gap-6 > div') as NodeListOf<HTMLElement>;
      if (formFields.length) {
        this.animationService.formFieldsEntrance(Array.from(formFields), {
          stagger: 0.1,
          direction: 'left',
          delay: 0.3
        });
      }
    }, 100);
  }

  private animateFormError(): void {
    const formElement = document.querySelector('.p-dialog .flex.flex-col.gap-6') as HTMLElement;
    if (formElement) {
      this.animationService.shakeElement(formElement, { intensity: 0.5 });
    }
  }

  private animateSuccess(): void {
    const saveButton = document.querySelector('.p-dialog-footer button:last-child') as HTMLElement;
    if (saveButton) {
      this.animationService.buttonSuccessAnimation(saveButton);
    }
  }

  private animateError(): void {
    const saveButton = document.querySelector('.p-dialog-footer button:last-child') as HTMLElement;
    if (saveButton) {
      this.animationService.buttonErrorAnimation(saveButton);
    }
  }

  // ========== INICIALIZACIÓN (Manteniendo funcionalidad original) ==========

  private initUser(): User {
    return {
      id: undefined,
      nombres: '',
      apellidos: '',
      username: '',
      email: '',
      password: '',
      activo: true,
      roles: ['usuario'],
      fechaCreacion: undefined,
      fechaActualizacion: undefined
    };
  }

  // ========== MENSAJES (Manteniendo funcionalidad original) ==========

  private showSuccess(message: string): void {
    this.toastService.success('Éxito', message);
  }

  private showWarning(message: string): void {
    this.toastService.warning('Advertencia', message);
  }

  private showError(message: string): void {
    this.toastService.error('Error', message);
  }

  private handleError(error: unknown, defaultMessage: string): void {
    console.error('Error:', error);
    let errorMessage = defaultMessage;
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null) {
      const errorObj = error as Record<string, unknown>;
      if (errorObj['error'] && typeof errorObj['error'] === 'object') {
        const nestedError = errorObj['error'] as Record<string, unknown>;
        if (nestedError['message'] && typeof nestedError['message'] === 'string') {
          errorMessage = nestedError['message'] as string;
        }
      }
    }
    
    this.toastService.error('Error', errorMessage);
  }

  async exportarEstadisticas(): Promise<void> {
    if (!this.users?.length) {
      this.showWarning('No hay datos para exportar estadísticas');
      return;
    }
  
    try {
      const xlsx = await import('xlsx');
      const stats = this.getEstadisticas();
      
      // Datos de resumen
      const resumenData = [
        ['ESTADÍSTICAS DE USUARIOS', ''],
        ['Total de Usuarios', stats.total],
        ['Usuarios Activos', stats.activos],
        ['Usuarios Inactivos', stats.inactivos],
        ['Porcentaje de Activos (%)', stats.porcentajeActivos],
        ['Administradores', stats.admins],
        ['Usuarios de Ventas', stats.ventas],
        ['Nuevos Usuarios (30 días)', stats.nuevosUsuarios],
        ['', ''],
        ['DISTRIBUCIÓN POR ROLES', ''],
        ...stats.roleStats.map(role => [role.label, role.count])
      ];
  
      // Datos de usuarios recientes
      const usuariosRecientesData = [
        ['USUARIOS RECIENTES', '', '', ''],
        ['Nombre Completo', 'Usuario', 'Email', 'Fecha Registro'],
        ...stats.usuariosRecientes.map(user => [
          `${user.nombres} ${user.apellidos}`,
          user.username,
          user.email,
          user.fechaCreacion ? new Date(user.fechaCreacion).toLocaleDateString() : 'N/A'
        ])
      ];
  
      // Crear hojas
      const resumenSheet = xlsx.utils.aoa_to_sheet(resumenData);
      const usuariosRecientesSheet = xlsx.utils.aoa_to_sheet(usuariosRecientesData);
      
      const workbook = {
        Sheets: {
          'Resumen': resumenSheet,
          'Usuarios Recientes': usuariosRecientesSheet
        },
        SheetNames: ['Resumen', 'Usuarios Recientes']
      };
  
      const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
      this.guardarArchivo(excelBuffer, 'estadisticas_usuarios');
      
      this.showSuccess('Estadísticas exportadas correctamente');
      this.hideEstadisticasDialog();
    } catch (error) {
      this.handleError(error, 'Error al exportar estadísticas');
    }
  }
  
  /**
   * Maneja errores de imagen en avatares
   */
  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.style.display = 'none';
    }
  }
  
  /**
   * Calcula el tiempo transcurrido desde el registro
   */
  getTiempoTranscurrido(fechaCreacion: string | undefined): string {
    if (!fechaCreacion) return 'Fecha no disponible';
    
    const fecha = new Date(fechaCreacion);
    const ahora = new Date();
    const diferencia = ahora.getTime() - fecha.getTime();
    
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    
    if (dias === 0) return 'Hoy';
    if (dias === 1) return 'Ayer';
    if (dias < 7) return `Hace ${dias} días`;
    if (dias < 30) return `Hace ${Math.floor(dias / 7)} semanas`;
    if (dias < 365) return `Hace ${Math.floor(dias / 30)} meses`;
    return `Hace ${Math.floor(dias / 365)} años`;
  }
  
  /**
   * Obtiene la clase CSS para el estado del usuario
   */
  getStatusClass(activo: boolean): string {
    return activo ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
  }
  
  /**
   * Obtiene el color de fondo para las cards según el rol
   */
  getRoleGradientClass(roles: string[]): string {
    if (!roles || roles.length === 0) return 'from-gray-500 to-gray-600';
    
    if (roles.includes('admin')) return 'from-red-500 to-red-600';
    if (roles.includes('ventas')) return 'from-green-500 to-green-600';
    return 'from-blue-500 to-blue-600';
  }
  
  /**
   * Valida si un usuario puede ser eliminado
   */
  canDeleteUser(): boolean {
    // No permitir eliminar al usuario actual (puedes agregar lógica adicional)
    // return usuario.username !== 'admin'; // Ejemplo: no eliminar admin
    return true; // Por ahora permitir eliminar todos
  }
  
  /**
   * Valida si el usuario actual tiene permisos de edición
   */
  canEditUsuarios(): boolean {
    return this.permissionService.canEdit('usuarios');
  }
  
  /**
   * Formatea el nombre completo del usuario
   */
  getNombreCompleto(usuario: User): string {
    return `${usuario.nombres || ''} ${usuario.apellidos || ''}`.trim();
  }
  
  /**
   * Obtiene información resumida del usuario para tooltips
   */
  getUsuarioResumen(usuario: User): string {
    const roles = this.getRoleLabel(usuario.roles || []);
    const estado = this.getStatusLabel(usuario.activo);
    return `${this.getNombreCompleto(usuario)}\nRoles: ${roles}\nEstado: ${estado}`;
  }
  
  /**
   * Búsqueda avanzada en usuarios
   */
  busquedaAvanzada(termino: string): void {
    if (!termino.trim()) {
      this.limpiarFiltros();
      return;
    }
  
    this.filtroTexto = termino;
    this.aplicarFiltros();
  }
  
  /**
   * Resetea el formulario de usuario
   */
  resetForm(): void {
    this.user = this.initUser();
    this.submitted = false;
    this.mostrarPassword = false;
    this.passwordStrength = 0;
  }
  
  /**
   * Valida formulario antes de enviar
   */
  validateForm(): boolean {
    return this.isValidUser();
  }
  
  /**
   * Obtiene sugerencias de username basado en nombre y apellido
   */
  generarSugerenciasUsername(): string[] {
    if (!this.user.nombres || !this.user.apellidos) return [];
    
    const nombres = this.user.nombres.toLowerCase().replace(/\s+/g, '');
    const apellidos = this.user.apellidos.toLowerCase().replace(/\s+/g, '');
    
    return [
      `${nombres.charAt(0)}${apellidos}`,
      `${nombres}${apellidos.charAt(0)}`,
      `${nombres}.${apellidos}`,
      `${apellidos}.${nombres}`,
      `${nombres}${apellidos}`.substring(0, 10)
    ];
  }
  
  /**
   * Copia email al portapapeles
   */
  async copiarEmail(email: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(email);
      this.showSuccess('Email copiado al portapapeles');
    } catch {
      this.showError('Error al copiar email');
    }
  }
  
  /**
   * Muestra modal de perfil de usuario
   */
  mostrarPerfil(usuario: User): void {
    this.usuarioDetalle = { ...usuario };
    this.perfilDialog = true;
  }
  
  /**
   * Obtiene el texto del botón de estado
   */
  getToggleEstadoText(activo: boolean): string {
    return activo ? 'Desactivar Usuario' : 'Activar Usuario';
  }
  
  /**
   * Obtiene el icono del botón de estado
   */
  getToggleEstadoIcon(activo: boolean): string {
    return activo ? 'pi pi-eye-slash' : 'pi pi-eye';
  }
  
  /**
   * Obtiene estadísticas avanzadas
   */
  getEstadisticasAvanzadas() {
    const usuarios = this.users || [];
    const hoy = new Date();
    const hace7Dias = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return {
      ...this.getEstadisticas(),
      usuariosUltimos7Dias: usuarios.filter(u => 
        u.fechaCreacion && new Date(u.fechaCreacion) > hace7Dias
      ).length,
      usuariosConEmail: usuarios.filter(u => u.email && u.email.trim()).length,
      usuariosMultipleRoles: usuarios.filter(u => u.roles && u.roles.length > 1).length,
      dominiosEmail: this.getTopDominiosEmail(usuarios),
      distribucionPorMes: this.getDistribucionPorMes(usuarios)
    };
  }
  
  /**
   * Obtiene los dominios de email más comunes
   */
  private getTopDominiosEmail(usuarios: User[]): { dominio: string, count: number }[] {
    const dominios = new Map<string, number>();
    
    usuarios.forEach(user => {
      if (user.email) {
        const dominio = user.email.split('@')[1];
        if (dominio) {
          dominios.set(dominio, (dominios.get(dominio) || 0) + 1);
        }
      }
    });
    
    return Array.from(dominios.entries())
      .map(([dominio, count]) => ({ dominio, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
  
  /**
   * Obtiene la distribución de registros por mes
   */
  private getDistribucionPorMes(usuarios: User[]): { mes: string, count: number }[] {
    const meses = new Map<string, number>();
    
    usuarios.forEach(user => {
      if (user.fechaCreacion) {
        const fecha = new Date(user.fechaCreacion);
        const mesKey = `${fecha.getFullYear()}-${fecha.getMonth() + 1}`;
        meses.set(mesKey, (meses.get(mesKey) || 0) + 1);
      }
    });
    
    return Array.from(meses.entries())
      .map(([mes, count]) => ({ mes, count }))
      .sort((a, b) => b.mes.localeCompare(a.mes))
      .slice(0, 6);
  }
}
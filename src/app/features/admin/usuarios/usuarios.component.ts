import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';
import { UsuarioService } from '../../../core/services/usuario.service';
import { ToolbarModule } from 'primeng/toolbar';
import { firstValueFrom } from 'rxjs';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TextareaModule } from 'primeng/textarea';
import { PasswordModule } from 'primeng/password';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from 'primeng/tag';
import { User } from '../../../core/models/user.model';


@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    IconFieldModule,
    InputIconModule,
    ToolbarModule,
    TableModule,
    ButtonModule,
    DialogModule,
    ToastModule,
    ConfirmDialogModule,
    FormsModule,
    InputTextModule,
    CardModule,
    TextareaModule,
    PasswordModule,
    SelectButtonModule,
    TagModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './usuarios.component.html'
})
export class UsuariosComponent implements OnInit {
  users: User[] = [];
  user: User = this.getEmptyUser();
  submitted = false;
  userDialog = false;
  editMode = false;
  selectedUsers: User[] = [];
  loading = false;
  cols = [
    { field: 'username', header: 'Usuario' },
    { field: 'nombres', header: 'Nombres' },
    { field: 'apellidos', header: 'Apellidos' },
    { field: 'email', header: 'Email' },
    { field: 'activo', header: 'Estado' },
    { field: 'roles', header: 'Rol' }
  ];

  roles = [
    { label: 'Administrador', value: 'admin' },
    { label: 'Ventas', value: 'ventas' }
  ];

  estados = [
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false }
  ]

  constructor(
    private userService: UsuarioService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) { }

  private getEmptyUser(): User {
    return {
      nombres: '',
      apellidos: '',
      username: '',
      email: '',
      password: '',
      roles: ['ventas'],
      activo: true
    };
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getUsers().subscribe({
      next: (response: any) => {
        if (response && response.contenido && Array.isArray(response.contenido)) {
          this.users = response.contenido;
        } else if (Array.isArray(response)) {
          this.users = response;
        } else {
          console.error('Formato de respuesta inesperado:', response);
          this.users = [];
        }
        
        console.log('Usuarios cargados:', this.users);
        this.loading = false;
      },
      error: (error: any) => {
        this.showError('No se pudieron cargar los usuarios', error);
        this.loading = false;
      }
    });
  }

  passwordIsValid(password: string): boolean {
    // Verifica que cumpla con los requisitos: número, minúscula, mayúscula y carácter especial
    const hasNumber = /[0-9]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasSpecial = /[@#$%^&+=]/.test(password);
    return hasNumber && hasLowercase && hasUppercase && hasSpecial;
  }

  openNew(): void {
    this.user = this.getEmptyUser();
    this.submitted = false;
    this.userDialog = true;
    this.editMode = false;
  }

  hideDialog(): void {
    this.userDialog = false;
    this.submitted = false;
  }

  editUser(user: User): void {
    console.log("🚀 ~ Usuario completo ~ editUser ~ user:", user)
    
    this.user = { 
      ...user, 
      password: '' };

      this.editMode = true;
      this.userDialog = true;
  }


  saveUser(): void {
    this.submitted = true;

    // Validaciones básicas
    if (!this.user.nombres || !this.user.apellidos || 
        !this.user.username || !this.user.email ) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario incompleto',
        detail: 'Por favor complete todos los campos requeridos correctamente'
      });
      return;
    }

    // Validación de contraseña en modo creación
    if (!this.editMode && !this.user.password) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario incompleto',
        detail: 'La contraseña es obligatoria para nuevos usuarios'
      });
      return;
    }

    // Validación de longitud y contenido de contraseña si hay password
    if (this.user.password) {
      if (this.user.password.length < 8) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Contraseña inválida',
          detail: 'La contraseña debe tener al menos 8 caracteres'
        });
        return;
      }

      if (!this.passwordIsValid(this.user.password)) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Contraseña inválida',
          detail: 'La contraseña debe contener al menos: un número, una minúscula, una mayúscula y un carácter especial'
        });
        return;
      }
    }

    // Si la contraseña está vacía en modo edición, la eliminamos
    const userData = { ...this.user };
    if (this.editMode && (!userData.password || userData.password.trim() === '')) {
      delete userData.password;
    }

    this.loading = true;

    if (this.editMode) {
      const userId = this.user.id;
      if (!userId) {
        this.showError('No se pudo determinar el ID del usuario');
        this.loading = false;
        return;
      }
      this.updateExistingUser(userId, userData);
    } else {
      this.createNewUser(userData);
    }
  }

  private updateExistingUser(userId: number, userData: any): void {
    this.userService.updateUser(userId, userData).subscribe({
      next: () => {
        this.showSuccess('Usuario actualizado correctamente');
        this.userDialog = false;
        this.loadUsers();
        this.loading = false;
      },
      error: (error: any) => {
        this.showError('Error al actualizar usuario', error);
        this.loading = false;
      }
    });
  }

  private createNewUser(userData: any): void {
   console.log('Datos antes de enviar:', JSON.stringify(userData));
   console.log('Tipo de roles:', typeof userData.roles);
   console.log('¿Es un array?', Array.isArray(userData.roles));
    this.userService.createUser(userData).subscribe({
      next: (response: any) => {
        console.log('Respuesta de éxito:', response);
        this.showSuccess('Usuario creado correctamente');
        this.userDialog = false;
        this.loadUsers();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error completo:', error);
        this.showError('Error al crear usuario', error);
        this.loading = false;
      }
    });
  }

  deleteUser(user: User): void {
    this.confirmationService.confirm({
      message: `¿Está seguro que desea eliminar al usuario ${user.nombres} ${user.apellidos}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (!user.id) return;
        
        this.loading = true;
        this.userService.deleteUser(user.id).subscribe({
          next: () => {
            this.users = this.users.filter(val => val.id !== user.id);
            this.showSuccess('Usuario eliminado correctamente');
            this.loading = false;
          },
          error: (error: any) => {
            this.showError('Error al eliminar usuario', error);
            this.loading = false;
          }
        });
      }
    });
  }

  deleteSelectedUsers(): void {
    this.confirmationService.confirm({
      message: '¿Está seguro que desea eliminar los usuarios seleccionados?',
      header: 'Confirmar eliminación múltiple',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          this.loading = true;
          const deletionPromises = this.selectedUsers
            .filter(user => user.id)
            .map(user => firstValueFrom(this.userService.deleteUser(user.id!)));

          await Promise.all(deletionPromises);

          this.users = this.users.filter(
            val => !this.selectedUsers.some(selectedUser => selectedUser.id === val.id)
          );
          this.showSuccess('Usuarios eliminados correctamente');
          this.selectedUsers = [];
          this.loading = false;
        } catch (error) {
          this.showError('Error al eliminar usuarios', error as any);
          this.loading = false;
        }
      }
    });
  }

  getStatusLabel(status: boolean | string): string {
    // Convierte a booleano si es un string
    const boolStatus = typeof status === 'string' 
      ? status.toLowerCase() === 'true' 
      : status;
    
    return boolStatus ? 'Activo' : 'Inactivo';
  }
  
  getStatusSeverity(status: boolean | string): "success" | "danger" {
    // Convierte a booleano si es un string
    const boolStatus = typeof status === 'string' 
      ? status.toLowerCase() === 'true' 
      : status;
    
    return boolStatus ? "success" : "danger";
  }

  getRoleLabel(roles: string[]): string {
    if (!roles || roles.length === 0) return 'Usuario';
    
    if (roles.includes('admin')) {
      return 'Administrador';
    } else if (roles.includes('ventas')) {
      return 'Ventas';
    }
    return 'Usuario';
  }

  private showSuccess(detail: string): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail,
      life: 3000
    });
  }

  private showError(detail: string, error?: any): void {
    console.error(detail, error);
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: error?.error?.message ? `${detail}: ${error.error.message}` : detail,
      life: 5000
    });
  }

  onGlobalFilter(table: Table, event: Event): void {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  async exportCSV(): Promise<void> {
    try {
      // Preparar datos para exportación
      const exportData = this.users.map(user => ({
        ID: user.id,
        Usuario: user.username,
        Nombres: user.nombres,
        Apellidos: user.apellidos,
        Email: user.email,
        Roles: user.roles ? user.roles : '',
        Estado: this.getStatusLabel(user.activo),
        'Fecha Creación': user.fechaCreacion ? new Date(user.fechaCreacion).toLocaleDateString() : '',
        'Fecha Actualización': user.fechaActualizacion ? new Date(user.fechaActualizacion).toLocaleDateString() : ''
      }));

      const xlsx = await import('xlsx');
      const worksheet = xlsx.utils.json_to_sheet(exportData);
      const workbook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
      const excelBuffer: any = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
      this.saveAsExcelFile(excelBuffer, 'usuarios');
    } catch (error) {
      this.showError('Error al exportar usuarios', error);
    }
  }

  private async saveAsExcelFile(buffer: any, fileName: string): Promise<void> {
    const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const EXCEL_EXTENSION = '.xlsx';
    const data: Blob = new Blob([buffer], { type: EXCEL_TYPE });
    const fileSaver = await import('file-saver');
    fileSaver.saveAs(data, fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION);
  }
}
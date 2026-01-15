import { Component, inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ToastModule } from 'primeng/toast';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { MessageService } from 'primeng/api';
import { AppFloatingConfigurator } from '../../shared/components/layout/component/app.floatingconfigurator';
import { AuthService } from '../../core/services/auth.service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { AnimationService } from '../../core/animations/animation.service';

interface RoleOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  providers: [MessageService],
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    FloatLabelModule,
    ToastModule,
    DropdownModule,
    MultiSelectModule,
    AppFloatingConfigurator,
    NgxSpinnerModule,
  ],
  templateUrl: './register.component.html',
})
export class RegisterComponent implements AfterViewInit {
  // Campos del formulario
  nombre = '';
  apellidos = '';
  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  selectedRoles: string[] = [];

  loading = false;
  private animationsEnabled = true;

  // Opciones de roles disponibles
  roleOptions: RoleOption[] = [
    { label: 'Administrador', value: 'admin' },
    { label: 'Ventas', value: 'ventas' },
  ];

  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private spinner = inject(NgxSpinnerService);
  private animService = inject(AnimationService);

  ngAfterViewInit(): void {
    // Esperamos un poco a que el DOM esté renderizado
    if (this.animationsEnabled) {
      setTimeout(() => {
        this.initializeFormAnimation();
      }, 100);
    }
  }

  private initializeFormAnimation(): void {
    const form = document.querySelector('.register-form');
    if (form && this.animationsEnabled) {
      // Animación del formulario completo
      this.animService.animateLoginForm(form as HTMLElement);
    }
  }

  onRegister(form: NgForm): void {
    if (!form.valid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Por favor, completa todos los campos correctamente',
      });
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Las contraseñas no coinciden',
      });
      return;
    }

    if (this.selectedRoles.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Por favor, selecciona al menos un rol',
      });
      return;
    }

    this.spinner.show('registerSpinner');
    this.loading = true;

    const registroRequest = {
      nombre: this.nombre,
      apellidos: this.apellidos,
      username: this.username,
      email: this.email,
      password: this.password,
      roles: this.selectedRoles,
    };

    this.authService.registro(registroRequest).subscribe({
      next: (response) => {
        this.spinner.hide('registerSpinner');
        this.loading = false;

        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Usuario ${response.username} registrado correctamente`,
        });

        // Redirigir al login después de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        this.spinner.hide('registerSpinner');
        this.loading = false;

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.mensaje || 'Error al registrar usuario',
        });
      },
    });
  }
}

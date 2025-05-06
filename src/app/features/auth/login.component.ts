import {Component, ElementRef, ViewChild, AfterViewInit, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { AppFloatingConfigurator } from '../../shared/components/layout/component/app.floatingconfigurator';
import { ToastModule } from 'primeng/toast';
import { PasswordModule } from 'primeng/password';
import { FloatLabelModule } from 'primeng/floatlabel';
import { MessageService } from 'primeng/api';
import { AnimationService } from '../../core/animations/animation.service';

interface LoginResponse {
  token: string;
  tokenType: string;
  refreshToken: string;
  id: number;
  username: string;
  email: string;
  roles: string[];
}

@Component({
  selector: 'app-auth',
  standalone: true,
  providers: [MessageService],
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, ReactiveFormsModule,
    AppFloatingConfigurator, ToastModule, PasswordModule, FloatLabelModule],
  templateUrl: './login.component.html',


})
export class LoginComponent implements OnInit, AfterViewInit {
  username: string = '';
  password: string = '';
  forgotVisible: boolean = false;

  @ViewChild('loginForm') loginForm!: ElementRef;
  @ViewChild('forgotDialog') forgotDialog!: ElementRef;
  @ViewChild('cardContainer') cardContainer!: ElementRef;
  @ViewChild('loginButton') loginButton!: ElementRef;
  @ViewChild('welcomeText') welcomeText!: ElementRef;

  private loginResponse: LoginResponse | undefined;
  private animationsEnabled = true;

  constructor(
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService,
    private animService: AnimationService
  ) {}

  ngOnInit() {
    // Desactivar animaciones en entornos problemáticos o modo de depuración
    if (window.location.search.includes('no-animations')) {
      this.animationsEnabled = false;
    }
  }

  ngAfterViewInit() {
    // Esperamos un poco a que el DOM esté completamente renderizado
    if (this.animationsEnabled) {
      setTimeout(() => {
        this.initializeFormAnimation();
      }, 200);
    }
  }

  private initializeFormAnimation() {
    const form = document.querySelector('.login-form');
    if (form && this.animationsEnabled) {
      this.animService.animateLoginForm(form as HTMLElement);
    }
  }

  onLogin(form: NgForm) {
    if (!form.valid) {
      this.showInvalidFormMessage();
      return;
    }

    const buttonElement = this.loginButton?.nativeElement?.querySelector('button');
    if (buttonElement && this.animationsEnabled) {
      this.animService.buttonLoadingAnimation(buttonElement);
    }

    const loginRequest = { username: this.username, password: this.password };
    this.authService.login(loginRequest).subscribe({
      next: (response: LoginResponse) => {
        this.loginResponse = response;

        console.log('Respuesta de login completa:', this.loginResponse);
        console.log('Token:', this.loginResponse.token);
        console.log('Username:', this.loginResponse.username);
        console.log('Email:', this.loginResponse.email);
        console.log('ID:', this.loginResponse.id);
        console.log('Roles:', this.loginResponse.roles);
        console.log('Tipo de token:', this.loginResponse.tokenType);
        console.log('Refresh token:', this.loginResponse.refreshToken);

        if (buttonElement && this.animationsEnabled) {
          this.animService.buttonSuccessAnimation(buttonElement);
        }

        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Bienvenido ${response.username}`
        });

        setTimeout(() => {
          if (this.cardContainer && this.cardContainer.nativeElement && this.animationsEnabled) {
            this.animService.successExit(this.cardContainer.nativeElement, {}, () => {
              this.authService.redirectBasedOnRole();
            });
          } else {
            this.authService.redirectBasedOnRole();
          }
        }, 1000);
      },
      error: (error) => {
        if (buttonElement && this.animationsEnabled) {
          this.animService.buttonErrorAnimation(buttonElement);
        }
        if (this.loginForm && this.loginForm.nativeElement && this.animationsEnabled) {
          this.animService.shakeElement(this.loginForm.nativeElement);
        }
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.mensaje || 'Error al iniciar sesión'
        });
      }
    });
  }


  private showInvalidFormMessage() {
    const formElement = document.querySelector('.login-form');
    if (formElement && this.animationsEnabled) {
      this.animService.shakeElement(formElement as HTMLElement);
    }

    this.messageService.add({
      severity: 'warn',
      summary: 'Advertencia',
      detail: 'Por favor, completa todos los campos',
      life: 4000
    });
  }

  openForgotPassword(event: Event) {
    event.preventDefault();
    this.forgotVisible = true;

    // Esperamos al siguiente ciclo para asegurar que el diálogo esté en el DOM
    if (this.animationsEnabled) {
      setTimeout(() => {
        this.animateDialog();
      }, 10);
    }
  }

  private animateDialog() {
    if (!this.forgotDialog || !this.forgotDialog.nativeElement || !this.animationsEnabled) return;

    const dialog = this.forgotDialog.nativeElement;
    this.animService.dialogEntrance(dialog);

    // Animar los elementos internos
    const dialogElements = dialog.querySelectorAll('h2, p, p-floatLabel, .flex');
    this.animService.dialogContentEntrance(dialogElements);
  }
}

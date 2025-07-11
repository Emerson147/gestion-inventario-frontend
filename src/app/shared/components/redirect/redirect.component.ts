import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  template:  `
    <div class="redirect-container">
      <div class="redirect-message">
        <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
        <p>Redirigiendo a tu panel...</p>
      </div>
    </div>
  `,
  styles: [`
    .redirect-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: var(--surface-ground);
    }
    .redirect-message {
      text-align: center;
      color: var(--text-color);
      font-size: 1.2rem;
    }
    .pi {
      color: var(--primary-color);
      margin-bottom: 1rem;
    }
  `]
})
export class RedirectComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    // Redireccionar según el rol
    setTimeout(() => {
      this.authService.redirectBasedOnRole();
    }, 2000);
  }
}
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  template: '<div>Redirigiendo...</div>' // Opcional: mostrar un spinner o mensaje
})
export class RedirectComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Redireccionar según el rol
    setTimeout(() => {
      this.authService.redirectBasedOnRole();
    }, 100);
  }
}

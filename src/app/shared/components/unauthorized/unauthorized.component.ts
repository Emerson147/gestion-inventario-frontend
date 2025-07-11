import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './unauthorized.component.html'
})
export class UnauthorizedComponent {
  userRole: string | null;
  private authService = inject(AuthService);

  constructor() {
    this.userRole = this.authService.getUserRole();
  }

  goToHomePage() {
    this.authService.redirectBasedOnRole();
  }
}
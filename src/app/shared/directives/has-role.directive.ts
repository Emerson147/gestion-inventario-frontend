import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective implements OnInit, OnDestroy {
  @Input() appHasRole: string | string[] = [];

  private subscription = new Subscription();

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.updateView();
  }

  private updateView(): void {
    // Limpiar vista
    this.viewContainer.clear();

    // Comprobar roles
    const roles = Array.isArray(this.appHasRole) ? this.appHasRole : [this.appHasRole];

    // Si el usuario no está autenticado, no mostrar el elemento
    if (!this.authService.isLoggedIn()) {
      return;
    }

    // Verificar si el usuario tiene alguno de los roles especificados
    const userRoles = this.authService.getUserRoles();
    const hasPermission = roles.some(role => userRoles.includes(role));

    if (hasPermission) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}

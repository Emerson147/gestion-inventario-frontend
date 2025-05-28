import { Directive, Input, TemplateRef, ViewContainerRef, OnInit, inject } from '@angular/core';
import { PermissionService, PermissionType } from '../../core/services/permission.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit {
  // Entrada puede ser un objeto o un string simple
  @Input() appHasPermission!: { module: string; permission: PermissionType } | string;

  // Inyección usando el nuevo patrón de Angular 19
  private templateRef = inject(TemplateRef);
  private viewContainer = inject(ViewContainerRef);
  private permissionService = inject(PermissionService);

  ngOnInit(): void {
    this.updateView();
  }

  private updateView(): void {
    // Limpiar vista
    this.viewContainer.clear();

    // Si es string, asumimos que es el módulo y queremos VIEW permission
    if (typeof this.appHasPermission === 'string') {
      const hasPermission = this.permissionService.canView(this.appHasPermission);
      if (hasPermission) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
      return;
    }

    // Si es objeto, verificamos el permiso específico
    const { module, permission } = this.appHasPermission;

    // Verificar si se proporcionaron los valores necesarios
    if (!module || !permission) {
      console.warn('HasPermission: module y permission son requeridos');
      return;
    }

    // Verificar si el usuario tiene el permiso para el módulo
    const hasPermission = this.permissionService.hasPermission(module, permission);

    if (hasPermission) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }
}
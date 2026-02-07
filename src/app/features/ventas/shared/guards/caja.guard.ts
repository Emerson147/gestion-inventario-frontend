 import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { CajaStateService } from '../services/caja-state.service';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class CajaGuard implements CanActivate, CanActivateChild {
  
  constructor(
    private cajaStateService: CajaStateService,
    private router: Router,
    private messageService: MessageService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.verificarCajaAbierta(state.url);
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.verificarCajaAbierta(state.url);
  }

  private verificarCajaAbierta(url: string): boolean {
    const cajaAbierta = this.cajaStateService.isCajaAbierta();
    
    if (!cajaAbierta) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Caja Cerrada',
        detail: 'Debe abrir la caja antes de acceder a esta sección',
        life: 4000
      });
      
      // Redirigir a la página principal de ventas para abrir caja
      this.router.navigate(['/ventas']);
      return false;
    }
    
    return true;
  }
}

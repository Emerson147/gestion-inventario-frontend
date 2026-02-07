import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd, ActivatedRoute } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Subscription, filter } from 'rxjs';

// Servicios
import { ToastService } from '../../../shared/services/toast.service';
import { CajaStateService } from '../shared/services/caja-state.service';

// Componentes
import { ToastNotificationComponent } from '../../../shared/components/toast-notification/toast-notification.component';
import { AperturaCajaDialogComponent } from '../shared/components/apertura-caja-dialog/apertura-caja-dialog.component';

/**
 * Layout para el módulo de ventas
 * Maneja la apertura automática de caja cuando es requerida
 * Escucha NavigationEnd para verificar si la ruta activa requiere caja
 */
@Component({
  selector: 'app-ventas-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ConfirmDialogModule,
    ToastNotificationComponent
  ],
  providers: [DialogService],
  templateUrl: './ventas-layout.component.html',
  styleUrls: ['./ventas-layout.component.scss']
})
export class VentasLayoutComponent implements OnInit, OnDestroy {
  // Servicios
  public toastService = inject(ToastService);
  public cajaStateService = inject(CajaStateService);
  private dialogService = inject(DialogService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  
  private dialogRef: DynamicDialogRef | null = null;
  private routerSub: Subscription | null = null;

  /** Indica si la ruta activa requiere caja abierta */
  rutaRequiereCaja = false;

  ngOnInit(): void {
    // Verificar en la primera carga
    setTimeout(() => this.actualizarEstadoRuta(), 100);
    
    // Escuchar cada navegación dentro del módulo de ventas
    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.actualizarEstadoRuta();
    });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.dialogRef?.close();
  }

  /**
   * Actualiza si la ruta actual requiere caja (para mostrar/ocultar el banner)
   */
  private actualizarEstadoRuta(): void {
    const childRoute = this.activatedRoute.firstChild;
    if (!childRoute) {
      this.rutaRequiereCaja = false;
      return;
    }
    const requiresCaja = childRoute.snapshot.data['requiresCaja'];
    this.rutaRequiereCaja = requiresCaja !== false;
  }

  /**
   * Abre el modal de apertura de caja (solo cuando se hace clic en el botón)
   */
  abrirCaja(): void {
    if (this.dialogRef) return;

    this.dialogRef = this.dialogService.open(AperturaCajaDialogComponent, {
      header: 'Apertura de Caja',
      width: '600px',
      modal: true,
      closable: true,
      draggable: false,
      dismissableMask: true,
      data: {
        sugerencias: this.obtenerUltimaConfiguracion()
      }
    });

    this.dialogRef.onClose.subscribe((result) => {
      this.dialogRef = null;
      
      if (result) {
        this.abrirCajaExitosamente(result);
      }
    });
  }

  /**
   * Procesa apertura exitosa de caja
   */
  private abrirCajaExitosamente(data: any): void {
    const userStr = localStorage.getItem('user');
    const userData = userStr ? JSON.parse(userStr) : null;
    const usuario = userData?.username || 'Usuario';
    
    this.cajaStateService.abrirCaja(data, usuario);
    this.guardarUltimaConfiguracion(data);

    this.toastService.success(
      '✅ Caja Abierta',
      `Bienvenido ${usuario}! Sistema listo para operar`,
      { 
        duration: 4000,
        icon: 'pi pi-check-circle'
      }
    );
  }

  private obtenerUltimaConfiguracion(): any {
    try {
      const config = localStorage.getItem('ultima_config_caja');
      return config ? JSON.parse(config) : {};
    } catch (error) {
      return {};
    }
  }

  private guardarUltimaConfiguracion(data: any): void {
    try {
      const config = {
        tiendaId: data.tiendaId,
        impresoraId: data.impresoraId,
        turno: data.turno
      };
      localStorage.setItem('ultima_config_caja', JSON.stringify(config));
    } catch (error) {
      console.warn('Error al guardar configuración:', error);
    }
  }

  onToastDismissed(id: string): void {
    // El servicio de toast maneja esto automáticamente
  }
}

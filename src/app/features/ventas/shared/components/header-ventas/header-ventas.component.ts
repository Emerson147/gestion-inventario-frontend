import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header-ventas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header-ventas.component.html',
  styleUrls: ['./header-ventas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderVentasComponent {
  @Input() cajaAbierta: boolean = false;
  @Input() totalVentasDelDia: number = 0;
  @Input() contarVentasDelDia: number = 0;
  @Input() promedioVenta: number = 0;
  @Input() currentTime: Date = new Date();

  @Output() irAPOS = new EventEmitter<void>();
  @Output() imprimirReporteCaja = new EventEmitter<void>();
  @Output() verTotalesDelDia = new EventEmitter<void>();
  @Output() cerrarCaja = new EventEmitter<void>();
  @Output() abrirCaja = new EventEmitter<void>();

  onIrAPOS() {
    this.irAPOS.emit();
  }

  onImprimirReporteCaja() {
    this.imprimirReporteCaja.emit();
  }

  onVerTotalesDelDia() {
    this.verTotalesDelDia.emit();
  }

  onCerrarCaja() {
    this.cerrarCaja.emit();
  }

  onAbrirCaja() {
    this.abrirCaja.emit();
  }
}
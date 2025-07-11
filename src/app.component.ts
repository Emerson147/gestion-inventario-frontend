import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { environment } from './environments/environment';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>',
})
export class AppComponent implements OnInit {
  title = 'gestion-inventario-frontend';

  // 👈 Agregar este método
  ngOnInit() {
    console.log('=== DIAGNÓSTICO DE ENVIRONMENT ===');
    console.log('Environment completo:', environment);
    console.log('API URL:', environment.apiUrl);
    console.log('Production:', environment.production);
    console.log('=====================================');
  }
}
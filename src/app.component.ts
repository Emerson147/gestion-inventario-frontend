import { Component, OnInit } from '@angular/core';
import { RouterOutlet, ChildrenOutletContexts } from '@angular/router';
import { environment } from './environments/environment';
import { routeAnimations } from './app/core/animations/route.animations';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    <div [@routeAnimations]="getRouteAnimationData()">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        position: relative;
        min-height: 100vh;
        overflow-x: hidden;
      }
    `,
  ],
  animations: [routeAnimations],
})
export class AppComponent implements OnInit {
  title = 'gestion-inventario-frontend';

  constructor(private contexts: ChildrenOutletContexts) {}

  getRouteAnimationData() {
    const routeData =
      this.contexts.getContext('primary')?.route?.snapshot?.data;
    return (
      routeData?.['animation'] ??
      this.contexts.getContext('primary')?.route?.snapshot?.routeConfig?.path
    );
  }

  ngOnInit() {
    console.log('=== DIAGNÓSTICO DE ENVIRONMENT ===');
    console.log('Environment completo:', environment);
    console.log('API URL:', environment.apiUrl);
    console.log('Production:', environment.production);
    console.log('=====================================');
  }
}

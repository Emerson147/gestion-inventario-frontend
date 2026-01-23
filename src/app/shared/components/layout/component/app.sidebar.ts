import { Component, ElementRef, inject } from '@angular/core';
import { AppMenu } from './app.menu';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [AppMenu],
  template: ` <div
    class="layout-sidebar bg-surface-0/95 backdrop-blur-md border-r border-surface-border"
  >
    <app-menu></app-menu>
  </div>`,
  styles: [':host { display: contents; }'],
})
export class AppSidebar {
  el = inject(ElementRef);
}

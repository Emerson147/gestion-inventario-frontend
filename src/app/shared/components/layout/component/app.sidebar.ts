import { Component, ElementRef, inject } from '@angular/core';
import { AppMenu } from './app.menu';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [AppMenu],
  template: ` <div
    class="layout-sidebar bg-surface-0 dark:bg-surface-900 border-r border-surface-200 dark:border-surface-700"
  >
    <app-menu></app-menu>
  </div>`,
  styles: [':host { display: contents; }'],
})
export class AppSidebar {
  el = inject(ElementRef);
}

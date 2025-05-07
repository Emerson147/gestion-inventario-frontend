import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import {provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling} from '@angular/router';
import {provideHttpClient, withFetch, withInterceptors} from '@angular/common/http';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { routes } from './app.routes';
import {providePrimeNG} from 'primeng/config';
import Aura from '@primeng/themes/aura';
import {authInterceptor} from './app/core/interceptors/auth.interceptor';
import {provideAnimations} from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }), withEnabledBlockingInitialNavigation()),
    provideHttpClient(withFetch()),
    providePrimeNG({ theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } } }),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    provideAnimations(),
  ]
};

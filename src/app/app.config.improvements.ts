import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MessageService, ConfirmationService } from 'primeng/api';

import { routes } from './app.routes';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';

// Servicios mejorados
import { CacheService } from './core/services/cache.service';
import { NotificationService } from './core/services/notification.service';
import { ExportService } from './core/services/export.service';
import { LoadingService } from './core/services/loading.service';

export const appConfigImprovements: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations(),
    
    // Interceptors
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    },
    
    // Servicios de PrimeNG
    MessageService,
    ConfirmationService,
    
    // Servicios mejorados
    CacheService,
    NotificationService,
    ExportService,
    LoadingService,
  ]
};
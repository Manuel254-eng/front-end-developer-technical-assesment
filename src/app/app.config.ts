import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

/**
 * Root Angular application configuration.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // Coalesce events to reduce redundant change detection cycles.
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes)
  ]
};

import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAuth0 } from '@auth0/auth0-angular';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAuth0({
      domain: 'dev-sj1bmj8255bwte7r.us.auth0.com',
      clientId: '9KHWGCfSSg9wUr1oREiUYIgP15EDIppJ',
      authorizationParams: {
        redirect_uri: window.location.origin + '/callback'
      }
    })
  ]
};
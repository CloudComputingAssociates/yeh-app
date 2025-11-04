import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideAuth0 } from '@auth0/auth0-angular';
import { routes } from './app.routes';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideAuth0({
      domain: 'dev-sj1bmj8255bwte7r.us.auth0.com',
      clientId: '9KHWGCfSSg9wUr1oREiUYIgP15EDIppJ',
      authorizationParams: {
        redirect_uri: window.location.origin
      },
      useRefreshTokens: true,
      cacheLocation: 'localstorage',
      httpInterceptor: {
        allowedList: [
          // Allow all API calls - attach token if user is authenticated, allow through if not
          `${environment.apiUrl}/*`
        ]
      }
    })
  ]
};
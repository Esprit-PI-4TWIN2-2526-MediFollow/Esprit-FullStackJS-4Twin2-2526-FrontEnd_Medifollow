import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

/**
 * Disable console.log in production for better performance and security
 * Keeps console.error and console.warn for monitoring
 */
if (environment.production) {
  // Save original console methods
  const originalError = console.error;
  const originalWarn = console.warn;

  // Disable all console methods
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
  console.table = () => {};
  console.dir = () => {};
  console.trace = () => {};

  // Restore error and warn for production monitoring
  console.error = originalError;
  console.warn = originalWarn;
}

platformBrowserDynamic().bootstrapModule(AppModule, {
  ngZoneEventCoalescing: true
})
  .catch(err => console.error(err));

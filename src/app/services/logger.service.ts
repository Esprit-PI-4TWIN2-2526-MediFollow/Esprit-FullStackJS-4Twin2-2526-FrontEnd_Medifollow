import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Production-safe logging service for Angular
 * Automatically disables logs in production builds
 */
@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private readonly isProduction = environment.production;

  /**
   * Log general information (disabled in production)
   */
  log(...args: any[]): void {
    if (!this.isProduction) {
      console.log(...args);
    }
  }

  /**
   * Log debug information (disabled in production)
   */
  debug(...args: any[]): void {
    if (!this.isProduction) {
      console.debug(...args);
    }
  }

  /**
   * Log info messages (disabled in production)
   */
  info(...args: any[]): void {
    if (!this.isProduction) {
      console.info(...args);
    }
  }

  /**
   * Log warnings (always enabled)
   */
  warn(...args: any[]): void {
    console.warn(...args);
  }

  /**
   * Log errors (always enabled)
   */
  error(...args: any[]): void {
    console.error(...args);
  }

  /**
   * Log tables (disabled in production)
   */
  table(data: any): void {
    if (!this.isProduction) {
      console.table(data);
    }
  }

  /**
   * Log directory (disabled in production)
   */
  dir(obj: any): void {
    if (!this.isProduction) {
      console.dir(obj);
    }
  }
}

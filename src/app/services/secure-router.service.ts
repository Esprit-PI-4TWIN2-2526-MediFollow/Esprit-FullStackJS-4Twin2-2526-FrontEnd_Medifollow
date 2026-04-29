import { Injectable } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';
import { UrlEncryptionService } from './url-encryption.service';
import { environment } from '../../environments/environment';

/**
 * Secure router service that automatically encodes IDs in URLs for production
 * Use this instead of Router directly for navigation with IDs
 */
@Injectable({
  providedIn: 'root'
})
export class SecureRouterService {
  constructor(
    private router: Router,
    private urlEncryption: UrlEncryptionService
  ) {}

  /**
   * Navigate with automatic ID encoding in production
   * Usage: secureRouter.navigate(['/patient', patientId, 'responses'])
   */
  navigate(commands: any[], extras?: NavigationExtras): Promise<boolean> {
    // Only encode in production
    if (environment.production) {
      const encodedCommands = this.encodeIdsInCommands(commands);
      return this.router.navigate(encodedCommands, extras);
    }
    
    // In development, use plain IDs
    return this.router.navigate(commands, extras);
  }

  /**
   * Navigate by URL with automatic ID encoding
   */
  navigateByUrl(url: string, extras?: NavigationExtras): Promise<boolean> {
    if (environment.production) {
      const encodedUrl = this.encodeIdsInUrl(url);
      return this.router.navigateByUrl(encodedUrl, extras);
    }
    
    return this.router.navigateByUrl(url, extras);
  }

  /**
   * Encode IDs in command array
   */
  private encodeIdsInCommands(commands: any[]): any[] {
    return commands.map(segment => {
      // If it's a string that looks like a MongoDB ID, encode it
      if (typeof segment === 'string' && this.looksLikeId(segment)) {
        return this.urlEncryption.encodeId(segment);
      }
      return segment;
    });
  }

  /**
   * Encode IDs in URL string
   */
  private encodeIdsInUrl(url: string): string {
    // Split URL by / and encode segments that look like IDs
    const segments = url.split('/');
    const encodedSegments = segments.map(segment => {
      if (this.looksLikeId(segment)) {
        return this.urlEncryption.encodeId(segment);
      }
      return segment;
    });
    return encodedSegments.join('/');
  }

  /**
   * Check if a string looks like a MongoDB ObjectID or UUID
   */
  private looksLikeId(str: string): boolean {
    if (!str || str.length < 20) return false;
    
    // MongoDB ObjectID (24 hex characters)
    if (/^[a-f\d]{24}$/i.test(str)) return true;
    
    // UUID
    if (/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(str)) return true;
    
    return false;
  }
}

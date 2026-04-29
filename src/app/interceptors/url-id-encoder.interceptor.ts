import { Injectable } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { UrlEncryptionService } from '../services/url-encryption.service';
import { environment } from '../../environments/environment';

/**
 * Intercepts router navigation and encodes IDs in URLs
 * This runs automatically without needing to change components
 */
@Injectable({
  providedIn: 'root'
})
export class UrlIdEncoderInterceptor {
  constructor(
    private router: Router,
    private urlEncryption: UrlEncryptionService
  ) {
    this.interceptNavigation();
  }

  private interceptNavigation(): void {
    // Only in production
    if (!environment.production) {
      return;
    }

    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        const url = event.url;
        
        // Check if URL contains MongoDB IDs
        if (this.containsMongoId(url)) {
          const encodedUrl = this.encodeIdsInUrl(url);
          
          // If URL changed, navigate to encoded version
          if (encodedUrl !== url) {
            // Cancel current navigation and navigate to encoded URL
            this.router.navigateByUrl(encodedUrl);
          }
        }
      }
    });
  }

  private containsMongoId(url: string): boolean {
    // Check if URL contains MongoDB ObjectID pattern
    return /[a-f\d]{24}/i.test(url);
  }

  private encodeIdsInUrl(url: string): string {
    // Split URL into segments
    const parts = url.split('?');
    const path = parts[0];
    const query = parts[1];

    // Encode IDs in path
    const segments = path.split('/');
    const encodedSegments = segments.map(segment => {
      if (this.isMongoId(segment)) {
        return this.urlEncryption.encodeId(segment);
      }
      return segment;
    });

    let encodedUrl = encodedSegments.join('/');
    
    // Add query string back if it exists
    if (query) {
      encodedUrl += '?' + query;
    }

    return encodedUrl;
  }

  private isMongoId(str: string): boolean {
    return /^[a-f\d]{24}$/i.test(str);
  }
}

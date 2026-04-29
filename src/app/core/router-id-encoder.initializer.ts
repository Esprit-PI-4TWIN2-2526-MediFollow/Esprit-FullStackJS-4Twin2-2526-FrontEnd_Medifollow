import { Router } from '@angular/router';
import { UrlEncryptionService } from '../services/url-encryption.service';
import { environment } from '../../environments/environment';

/**
 * Patches the Router to automatically encode IDs in URLs
 * This runs once at app startup and affects all navigation
 */
export function initializeRouterIdEncoder(
  router: Router,
  urlEncryption: UrlEncryptionService
) {
  return () => {
    // Only patch in production
    if (!environment.production || !environment.encryptIds) {
      return;
    }

    // Save original navigate method
    const originalNavigate = router.navigate.bind(router);
    const originalNavigateByUrl = router.navigateByUrl.bind(router);

    // Override navigate method
    router.navigate = function(commands: any[], extras?: any): Promise<boolean> {
      const encodedCommands = encodeIdsInCommands(commands, urlEncryption);
      return originalNavigate(encodedCommands, extras);
    };

    // Override navigateByUrl method
    router.navigateByUrl = function(url: string | any, extras?: any): Promise<boolean> {
      if (typeof url === 'string') {
        const encodedUrl = encodeIdsInUrl(url, urlEncryption);
        return originalNavigateByUrl(encodedUrl, extras);
      }
      return originalNavigateByUrl(url, extras);
    };

    console.log('✅ Router ID encoder initialized');
  };
}

/**
 * Encode IDs in command array
 */
function encodeIdsInCommands(commands: any[], urlEncryption: UrlEncryptionService): any[] {
  return commands.map(segment => {
    if (typeof segment === 'string' && isMongoId(segment)) {
      return urlEncryption.encodeId(segment);
    }
    return segment;
  });
}

/**
 * Encode IDs in URL string
 */
function encodeIdsInUrl(url: string, urlEncryption: UrlEncryptionService): string {
  const parts = url.split('?');
  const path = parts[0];
  const query = parts[1];

  const segments = path.split('/');
  const encodedSegments = segments.map(segment => {
    if (isMongoId(segment)) {
      return urlEncryption.encodeId(segment);
    }
    return segment;
  });

  let encodedUrl = encodedSegments.join('/');
  if (query) {
    encodedUrl += '?' + query;
  }

  return encodedUrl;
}

/**
 * Check if string is a MongoDB ObjectID
 */
function isMongoId(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  return /^[a-f\d]{24}$/i.test(str);
}

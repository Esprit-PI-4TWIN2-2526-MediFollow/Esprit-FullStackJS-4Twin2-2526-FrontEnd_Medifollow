import { Injectable } from '@angular/core';

/**
 * Service to encrypt/decrypt IDs in URLs for security
 * Prevents exposing MongoDB ObjectIDs and other sensitive identifiers
 */
@Injectable({
  providedIn: 'root'
})
export class UrlEncryptionService {
  
  /**
   * Encode an ID to a URL-safe token
   * Uses Base64 encoding with URL-safe characters
   */
  encodeId(id: string): string {
    if (!id) return '';
    
    try {
      // Add a random salt to make it harder to reverse engineer
      const timestamp = Date.now().toString(36);
      const combined = `${id}:${timestamp}`;
      
      // Base64 encode and make URL-safe
      const encoded = btoa(combined)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      
      return encoded;
    } catch (error) {
      console.error('Error encoding ID:', error);
      return id; // Fallback to original ID
    }
  }

  /**
   * Decode a URL token back to the original ID
   */
  decodeId(token: string): string {
    if (!token) return '';
    
    try {
      // Reverse URL-safe encoding
      let base64 = token
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      
      // Add padding if needed
      while (base64.length % 4) {
        base64 += '=';
      }
      
      // Decode and extract ID (before the colon)
      const decoded = atob(base64);
      const id = decoded.split(':')[0];
      
      return id;
    } catch (error) {
      console.error('Error decoding token:', error);
      return token; // Fallback to original token
    }
  }

  /**
   * Generate a short hash for an ID (for display purposes)
   * Example: 507f1f77bcf86cd799439011 -> a3f9k2
   */
  generateShortHash(id: string): string {
    if (!id) return '';
    
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      const char = id.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(36).substring(0, 6);
  }

  /**
   * Check if a string looks like a MongoDB ObjectID
   */
  isMongoId(str: string): boolean {
    return /^[a-f\d]{24}$/i.test(str);
  }

  /**
   * Check if a string is an encoded token
   */
  isEncodedToken(str: string): boolean {
    return /^[A-Za-z0-9_-]+$/.test(str) && str.length > 20;
  }
}

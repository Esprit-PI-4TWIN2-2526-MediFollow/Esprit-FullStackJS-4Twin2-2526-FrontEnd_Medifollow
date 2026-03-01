import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { 
  startRegistration, 
  startAuthentication,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser';
import { Observable, from, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebauthnService {
  private apiUrl = 'http://localhost:3000/api/webauthn';

  constructor(private http: HttpClient) {}

  // Register Face ID
  registerFaceId(userId: string): Observable<any> {
    return this.http.post<PublicKeyCredentialCreationOptionsJSON>(
      `${this.apiUrl}/register/options`,
      { userId }
    ).pipe(
      switchMap(options => from(this.performRegistration(options, userId)))
    );
  }

  private async performRegistration(
    options: PublicKeyCredentialCreationOptionsJSON,
    userId: string
  ) {
    try {
      const registrationResponse = await startRegistration({ optionsJSON: options });
      
      return this.http.post(`${this.apiUrl}/register/verify`, {
        userId,
        response: registrationResponse
      }).toPromise();
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  }

  // Authenticate with Face ID
  authenticateWithFaceId(email: string): Observable<any> {
    return this.http.post<PublicKeyCredentialRequestOptionsJSON>(
      `${this.apiUrl}/authenticate/options`,
      { email }
    ).pipe(
      switchMap(options => from(this.performAuthentication(options, email)))
    );
  }

  private async performAuthentication(
    options: PublicKeyCredentialRequestOptionsJSON,
    email: string
  ) {
    try {
      const authenticationResponse = await startAuthentication({ optionsJSON: options });
      
      return this.http.post(`${this.apiUrl}/authenticate/verify`, {
        email,
        response: authenticationResponse
      }).toPromise();
    } catch (error: any) {
      throw new Error(error.message || 'Authentication failed');
    }
  }

  // Get user's registered authenticators
  getUserAuthenticators(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/authenticators/${userId}`);
  }

  // Delete authenticator
  deleteAuthenticator(userId: string, authenticatorId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/authenticators/${userId}/${authenticatorId}`);
  }

  // Check if browser supports WebAuthn
  isWebAuthnSupported(): boolean {
    return window?.PublicKeyCredential !== undefined &&
           typeof window.PublicKeyCredential === 'function';
  }

  // Check if platform authenticator is available (Face ID, Touch ID, Windows Hello)
  async isPlatformAuthenticatorAvailable(): Promise<boolean> {
    if (!this.isWebAuthnSupported()) {
      return false;
    }
    
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  }
}

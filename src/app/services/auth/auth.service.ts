import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Users } from '../../models/users';
import {
  FirstLoginChangePasswordRequest,
  FirstLoginChangePasswordResponse,
  SignInRequest,
  SignInResponse,
} from '../../models/auth';
import { Router } from '@angular/router';
import { Role } from '../../models/roles';
import { ApiConfig } from '../../config/api.config';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = ApiConfig.AUTH;
  private readonly ONBOARDING_TOKEN_KEY = 'onboardingToken';

  constructor(private http: HttpClient, private router: Router) { }

  signIn(payload: SignInRequest): Observable<SignInResponse> {
    return this.http.post<SignInResponse>(`${this.API_URL}/signin`, payload);
  }

  changePasswordOnFirstLogin(
    payload: FirstLoginChangePasswordRequest
  ): Observable<FirstLoginChangePasswordResponse> {
    return this.http.post<FirstLoginChangePasswordResponse>(
      `${this.API_URL}/first-login/change-password`,
      payload
    );
  }

  persistAuthSession(token: string, user: any): void {
    localStorage.removeItem('accessToken');  // ← vide d'abord
    localStorage.removeItem('user');         // ← vide d'abord
    localStorage.setItem('accessToken', token);
    localStorage.setItem('user', JSON.stringify(user));
  }


  getPostLoginRoute(user: Users): string {
    const roleName = typeof user?.role === 'string'
      ? user.role
      : (user?.role as any)?.name ?? '';

    if (!roleName) return '/signin';

    const adminRoles = ['SUPERADMIN', 'ADMIN'];
    if (adminRoles.includes(roleName.toUpperCase())) return '/dashboard';

    return `/${roleName.toLowerCase()}`;
  }
  setOnboardingToken(token: string): void {
    sessionStorage.setItem(this.ONBOARDING_TOKEN_KEY, token);
  }

  getOnboardingToken(): string | null {
    return sessionStorage.getItem(this.ONBOARDING_TOKEN_KEY);
  }

  clearOnboardingToken(): void {
    sessionStorage.removeItem(this.ONBOARDING_TOKEN_KEY);
  }

  logout() {
    localStorage.clear();
    sessionStorage.clear();
    this.router.navigate(['/signin']);
  }

}


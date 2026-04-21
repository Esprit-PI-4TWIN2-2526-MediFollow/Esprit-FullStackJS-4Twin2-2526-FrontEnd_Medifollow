import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  TwoFactorEnableDisableRequest,
  TwoFactorEnableDisableResponse,
  TwoFactorSetupResponse,
  TwoFactorStatusResponse,
} from '../../models/two-factor';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TwoFactorService {
  private readonly API_URL = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  getStatus(): Observable<TwoFactorStatusResponse> {
    return this.http.get<TwoFactorStatusResponse>(
      `${this.API_URL}/users/me/2fa/status`
    );
  }

  setup(): Observable<TwoFactorSetupResponse> {
    return this.http.post<TwoFactorSetupResponse>(
      `${this.API_URL}/users/me/2fa/setup`,
      {}
    );
  }

  enable(payload: TwoFactorEnableDisableRequest): Observable<TwoFactorEnableDisableResponse> {
    return this.http.post<TwoFactorEnableDisableResponse>(
      `${this.API_URL}/users/me/2fa/enable`,
      payload
    );
  }

  disable(payload: TwoFactorEnableDisableRequest): Observable<TwoFactorEnableDisableResponse> {
    return this.http.post<TwoFactorEnableDisableResponse>(
      `${this.API_URL}/users/me/2fa/disable`,
      payload
    );
  }
}


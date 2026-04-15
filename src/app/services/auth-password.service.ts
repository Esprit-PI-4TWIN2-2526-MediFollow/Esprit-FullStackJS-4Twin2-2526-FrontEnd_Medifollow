import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConfig } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class AuthPasswordService {
  private readonly baseUrl = ApiConfig.FORGET_PASSWORD;

  constructor(private http: HttpClient) {}

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(this.baseUrl, { email });
  }

  resetPassword(token: string, password: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/reset/${token}`, { password });
  }
}

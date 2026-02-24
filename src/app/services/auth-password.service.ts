import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthPasswordService {
  private readonly baseUrl = 'http://localhost:3000/users/forgetpassword';

  constructor(private http: HttpClient) {}

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(this.baseUrl, { email });
  }

  resetPassword(token: string, password: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/reset/${token}`, { password });
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../../models/users';



@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }
  signIn(payload: { email: string; password: string }): Observable<User> {
    return this.http.post<User>(`${this.API_URL}/signin`, payload);
  }

  logout() {
    localStorage.clear();
  }
}

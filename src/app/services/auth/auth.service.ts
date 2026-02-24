import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Users } from '../../models/users';



@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }
  signIn(payload: { email: string; password: string }): Observable<Users> {
    return this.http.post<Users>(`${this.API_URL}/signin`, payload);
  }

  logout() {
    localStorage.clear();
  }
}


import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { Role } from '@amcharts/amcharts5/.internal/core/util/Accessibility';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private readonly apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

getAllRoles(): Observable<Role[]> {
    // Essayez sans attendre { data: Role[] } au cas où l'API retourne directement un tableau
    return this.http.get<Role[]>(this.apiUrl).pipe(
      map(response => {
        console.log('API Response:', response);
        return response || [];
      }),
      catchError(error => {
        console.error('Error fetching roles:', error);
        return throwError(() => new Error('Failed to fetch roles'));
      })
    );
  }


}

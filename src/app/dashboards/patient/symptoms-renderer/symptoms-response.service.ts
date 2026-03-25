import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, of, throwError } from 'rxjs';

import {
  SymptomsAssignedForm,
  SymptomsSubmitPayload,
  SymptomsTodayResponse,
} from './symptoms-response.model';

@Injectable({ providedIn: 'root' })
export class SymptomsResponseService {
  private readonly apiUrl = 'http://localhost:3000/symptoms';

  constructor(private http: HttpClient) {}

  getAssignedForm(patientId: string): Observable<SymptomsAssignedForm | null> {
    return this.http.get<SymptomsAssignedForm>(`${this.apiUrl}/form/patient/${patientId}`).pipe(
      catchError((error) => {
        if (error.status === 404) {
          return of(null);
        }
        return throwError(() => error);
      })
    );
  }

  getTodayResponse(patientId: string): Observable<SymptomsTodayResponse | null> {
    return this.http.get<SymptomsTodayResponse>(`${this.apiUrl}/response/today/${patientId}`).pipe(
      catchError((error) => {
        if (error.status === 404) {
          return of(null);
        }
        return throwError(() => error);
      })
    );
  }

  submitResponse(payload: SymptomsSubmitPayload): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/response`, payload);
  }
}

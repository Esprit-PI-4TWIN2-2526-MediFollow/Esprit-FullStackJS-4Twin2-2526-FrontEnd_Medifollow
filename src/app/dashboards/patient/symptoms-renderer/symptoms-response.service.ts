import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';

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
      map((form) => this.normalizeAssignedForm(form)),
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

  getPatientResponses(patientId: string): Observable<SymptomsTodayResponse[]> {
    return this.http.get<SymptomsTodayResponse[]>(`${this.apiUrl}/response/${patientId}`).pipe(
      catchError((error) => {
        if (error.status === 404) {
          return of([]);
        }
        return throwError(() => error);
      })
    );
  }

  getResponsesByDate(patientId: string, date: string): Observable<SymptomsTodayResponse[]> {
    return this.getPatientResponses(patientId).pipe(
      map((responses) => responses.filter((response) => this.extractResponseDateKey(response) === date))
    );
  }

  submitResponse(payload: SymptomsSubmitPayload): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/response`, payload);
  }

  private extractResponseDateKey(response: SymptomsTodayResponse): string | null {
    const rawDate = response.submittedAt ?? response.responseDate ?? response.date ?? response.createdAt;
    if (!rawDate) {
      return null;
    }

    const parsedDate = new Date(rawDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    const year = parsedDate.getFullYear();
    const month = `${parsedDate.getMonth() + 1}`.padStart(2, '0');
    const day = `${parsedDate.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private normalizeAssignedForm(form: SymptomsAssignedForm): SymptomsAssignedForm {
    return {
      ...form,
      questions: (form.questions ?? []).map((question) => {
        const measurementsPerDay =
          question.measurementsPerDay ??
          question.occurrencesPerDay ??
          question.maxOccurrencesPerDay ??
          1;
        return {
          ...question,
          measurementsPerDay,
          occurrencesPerDay: measurementsPerDay,
          maxOccurrencesPerDay: measurementsPerDay,
        };
      }),
    };
  }
}

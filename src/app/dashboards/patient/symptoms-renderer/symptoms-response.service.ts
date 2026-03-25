import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';

import {
  SymptomsAssignedForm,
  SymptomsSubmitAnswer,
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

  getResponsesByDate(patientId: string, date: string): Observable<SymptomsSubmitAnswer[]> {
    return this.getPatientResponses(patientId).pipe(
      map((responses) => {
        const matchedResponse = responses.find((response) => this.extractResponseDateKey(response) === date);
        return matchedResponse ? this.normalizeAnswers(matchedResponse.answers) : [];
      })
    );
  }

  submitResponse(payload: SymptomsSubmitPayload): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/response`, payload);
  }

  private normalizeAnswers(answers: SymptomsTodayResponse['answers']): SymptomsSubmitAnswer[] {
    if (Array.isArray(answers)) {
      return answers.filter((answer): answer is SymptomsSubmitAnswer => {
        return !!answer && typeof answer.questionId === 'string';
      });
    }

    if (!answers || typeof answers !== 'object') {
      return [];
    }

    return Object.entries(answers).map(([questionId, value]) => ({
      questionId,
      value,
    }));
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
}

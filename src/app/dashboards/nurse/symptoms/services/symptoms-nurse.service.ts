import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, switchMap, throwError } from 'rxjs';

export interface NurseVitalSnapshot {
  bloodPressure?: string | number | null;
  heartRate?: string | number | null;
  temperature?: string | number | null;
  weight?: string | number | null;
}

export interface NurseSymptomsResponse {
  _id: string;
  patientId?: string;
  patientName?: string;
  patientDepartment?: string;
  submittedAt?: string | Date | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  vitals?: NurseVitalSnapshot | null;
  answers?: Array<{ question?: string; label?: string; answer?: unknown; value?: unknown }>;
  validated?: boolean;
  validatedBy?: string;
  validatedByName?: string;
  validatedAt?: string | Date | null;
  validationNote?: string;
  issueReported?: boolean;
}

interface NurseIdentity {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  assignedDepartment?: string;
  department?: string;
  service?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SymptomsNurseService {
  private readonly apiUrl = 'http://localhost:3000/symptoms';

  constructor(private http: HttpClient) {}

  getResponsesForNurse(): Observable<NurseSymptomsResponse[]> {
    const department = this.getCurrentNurseDepartment();

    return this.fetchAllResponses().pipe(
      map((responses) => {
        if (!department) {
          return responses;
        }

        return responses.filter((response) => {
          const responseDepartment = this.normalizeDepartment(response.patientDepartment);
          return !!responseDepartment && responseDepartment === department;
        });
      }),
      map((responses) => responses.sort((left, right) => this.getSubmittedTimestamp(right) - this.getSubmittedTimestamp(left)))
    );
  }

  getPendingResponses(): Observable<NurseSymptomsResponse[]> {
    return this.getResponsesForNurse().pipe(
      map((responses) => responses.filter((response) => !response.validated))
    );
  }

  getValidatedResponses(): Observable<NurseSymptomsResponse[]> {
    return this.getResponsesForNurse().pipe(
      map((responses) => responses.filter((response) => !!response.validated))
    );
  }

  getPendingCount(): Observable<number> {
    return this.getPendingResponses().pipe(map((responses) => responses.length));
  }

  getResponseDetails(id: string): Observable<NurseSymptomsResponse> {
    return this.getResponsesForNurse().pipe(
      map((responses) => responses.find((response) => response._id === id) ?? null),
      switchMap((response) => {
        if (response) {
          return of(response);
        }

        return throwError(() => new Error('Symptoms response not found'));
      })
    );
  }

  validateResponse(id: string, note: string): Observable<NurseSymptomsResponse> {
    const nurse = this.getCurrentNurse();
    const payload = {
      validated: true,
      validationNote: note,
      validatedAt: new Date().toISOString(),
      validatedBy: nurse?._id || nurse?.id || '',
      validatedByName: this.getCurrentNurseName(nurse),
      issueReported: false
    };

    return this.http.patch<NurseSymptomsResponse>(`${this.apiUrl}/response/${id}/validate`, payload);
  }

  signalProblem(id: string, note: string): Observable<NurseSymptomsResponse> {
    const nurse = this.getCurrentNurse();
    const payload = {
      issueReported: true,
      validationNote: note,
      validatedAt: new Date().toISOString(),
      validatedBy: nurse?._id || nurse?.id || '',
      validatedByName: this.getCurrentNurseName(nurse)
    };

    return this.http.patch<NurseSymptomsResponse>(`${this.apiUrl}/response/${id}/signal-problem`, payload);
  }

  private fetchAllResponses(): Observable<NurseSymptomsResponse[]> {
    return this.http.get<NurseSymptomsResponse[]>(`${this.apiUrl}/response`).pipe(
      catchError((error) => {
        if (error.status === 404) {
          return of([]);
        }

        return throwError(() => error);
      })
    );
  }

  private getCurrentNurse(): NurseIdentity | null {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as NurseIdentity;
    } catch {
      return null;
    }
  }

  private getCurrentNurseDepartment(): string {
    const nurse = this.getCurrentNurse();
    return this.normalizeDepartment(
      nurse?.assignedDepartment || nurse?.department || nurse?.service || ''
    );
  }

  private getCurrentNurseName(nurse: NurseIdentity | null): string {
    const fullName = `${nurse?.firstName || ''} ${nurse?.lastName || ''}`.trim();
    return fullName || 'Assigned nurse';
  }

  private normalizeDepartment(value: string | null | undefined): string {
    return String(value || '').trim().toLowerCase();
  }

  private getSubmittedTimestamp(response: NurseSymptomsResponse): number {
    const rawTimestamp = response.submittedAt || response.createdAt || response.updatedAt || null;
    if (!rawTimestamp) {
      return 0;
    }

    const parsedDate = new Date(rawTimestamp);
    return Number.isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime();
  }
}

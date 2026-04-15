import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, switchMap, throwError, forkJoin } from 'rxjs';
import { Users } from '../../../../models/users';
import { UsersService } from '../../../../services/user/users.service';
import { ApiConfig } from '../../../../config/api.config';

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
  patientEmail?: string;
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
  private readonly apiUrl = ApiConfig.SYMPTOMS;

  constructor(
    private http: HttpClient,
    private usersService: UsersService
  ) {}

  getResponsesForNurse(): Observable<NurseSymptomsResponse[]> {
    const department = this.getCurrentNurseDepartment();

    return forkJoin({
      responses: this.fetchAllResponses(),
      users: this.fetchAllUsers()
    }).pipe(
      map(({ responses, users }) => {
        const patientsIndex = this.buildPatientsIndex(users);
        const enrichedResponses = responses.map((response) => this.enrichResponse(response, patientsIndex));

        if (!department) {
          return enrichedResponses;
        }

        return enrichedResponses.filter((response) => {
          const responseDepartment = this.normalizeDepartment(
            response.patientDepartment
          );
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

  private fetchAllUsers(): Observable<Users[]> {
    return this.usersService.getUsers().pipe(
      catchError((error) => {
        console.error('Failed to load users for nurse symptoms mapping', error);
        return of([]);
      })
    );
  }

  private buildPatientsIndex(users: Users[]): Record<string, Users> {
    return users.reduce<Record<string, Users>>((accumulator, user) => {
      if (user?._id) {
        accumulator[user._id] = user;
      }

      return accumulator;
    }, {});
  }

  private enrichResponse(
    response: NurseSymptomsResponse,
    patientsIndex: Record<string, Users>
  ): NurseSymptomsResponse {
    const patient = response.patientId ? patientsIndex[response.patientId] : undefined;
    const patientName = patient
      ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim()
      : '';

    return {
      ...response,
      patientName: response.patientName || patientName || 'Unknown patient',
      patientDepartment: response.patientDepartment || patient?.assignedDepartment || '',
      patientEmail: response.patientEmail || patient?.email || ''
    };
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

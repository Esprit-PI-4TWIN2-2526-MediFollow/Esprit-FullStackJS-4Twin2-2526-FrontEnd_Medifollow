import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

export type CoordinatorSymptomsFilter = 'all' | 'pending' | 'validated';

export interface CoordinatorSymptomsResponse {
  _id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientDepartment: string;
  submittedAt: string | null;
  validated: boolean;
  issueReported: boolean;
  validatedAt: string | null;
  validatedByName: string;
  validationNote: string;
  answers: Array<{ label: string; value: string }>;
  vitals: Record<string, string>;
}

@Injectable({
  providedIn: 'root'
})
export class CoordinatorSymptomsService {
  private readonly apiUrls = [
    'http://localhost:3000/symptoms/coordinator/responses',
    'http://localhost:3000/api/symptoms/coordinator/responses'
  ] as const;

  constructor(private http: HttpClient) {}

  getResponses(filter: CoordinatorSymptomsFilter): Observable<CoordinatorSymptomsResponse[]> {
    const suffix = filter === 'pending'
      ? '/pending'
      : filter === 'validated'
        ? '/validated'
        : '';

    return this.getWithFallback([...this.apiUrls].map((base) => `${base}${suffix}`)).pipe(
      map((payload) => this.extractArray(payload).map((item) => this.mapResponse(item)))
    );
  }

  getResponseDetails(id: string): Observable<CoordinatorSymptomsResponse> {
    return this.getWithFallback([...this.apiUrls].map((base) => `${base}/${id}`)).pipe(
      map((payload) => this.mapResponse(payload))
    );
  }

  validateResponse(id: string, note: string): Observable<CoordinatorSymptomsResponse> {
    return this.postWithFallback(
      [...this.apiUrls].map((base) => `${base}/${id}/validate`),
      { note }
    ).pipe(
      map((payload) => this.mapResponse(payload))
    );
  }

  reportIssue(id: string, note: string): Observable<CoordinatorSymptomsResponse> {
    return this.postWithFallback(
      [...this.apiUrls].map((base) => `${base}/${id}/report-issue`),
      { note }
    ).pipe(
      map((payload) => this.mapResponse(payload))
    );
  }

  private getWithFallback(urls: string[]): Observable<unknown> {
    const [head, ...tail] = urls;
    if (!head) {
      return throwError(() => new Error('No coordinator symptoms URL configured'));
    }

    return this.http.get<unknown>(head).pipe(
      catchError((error) => {
        if (tail.length === 0) {
          return throwError(() => error);
        }
        return this.getWithFallback(tail);
      })
    );
  }

  private postWithFallback(urls: string[], body: unknown): Observable<unknown> {
    const [head, ...tail] = urls;
    if (!head) {
      return throwError(() => new Error('No coordinator symptoms URL configured'));
    }

    return this.http.post<unknown>(head, body).pipe(
      catchError((error) => {
        if (tail.length === 0) {
          return throwError(() => error);
        }
        return this.postWithFallback(tail, body);
      })
    );
  }

  private mapResponse(payload: unknown): CoordinatorSymptomsResponse {
    const source = this.unwrapObject(payload);
    const patient = source.patient ?? source.patientId ?? {};
    const vitals = this.unwrapObject(source.vitals ?? source.vitalSigns);
    const answers = Array.isArray(source.answers) ? source.answers : [];

    return {
      _id: String(source?._id ?? source?.id ?? ''),
      patientId: String(source?.patientId ?? patient?._id ?? patient?.id ?? ''),
      patientName: String((
        source?.patientName
        ?? patient?.fullName
        ?? `${patient?.firstName ?? ''} ${patient?.lastName ?? ''}`.trim()
      ) || 'Unknown patient'),
      patientEmail: String(source?.patientEmail ?? patient?.email ?? ''),
      patientDepartment: String(source?.patientDepartment ?? patient?.assignedDepartment ?? patient?.department ?? ''),
      submittedAt: this.readDate(source?.submittedAt ?? source?.createdAt ?? source?.updatedAt),
      validated: !!(source?.validated ?? source?.isValidated),
      issueReported: !!(source?.issueReported ?? source?.reportedIssue),
      validatedAt: this.readDate(source?.validatedAt),
      validatedByName: String(source?.validatedByName ?? source?.validatorName ?? ''),
      validationNote: String(source?.validationNote ?? source?.note ?? ''),
      answers: answers.map((answer: any) => ({
        label: String(answer?.label ?? answer?.question ?? answer?.name ?? 'Question'),
        value: this.formatValue(answer?.value ?? answer?.answer)
      })),
      vitals: Object.entries(vitals).reduce<Record<string, string>>((accumulator, [key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          accumulator[key] = this.formatValue(value);
        }
        return accumulator;
      }, {})
    };
  }

  private extractArray(payload: unknown): any[] {
    if (Array.isArray(payload)) {
      return payload;
    }

    const source = this.unwrapObject(payload);
    return Array.isArray(source?.data)
      ? source.data
      : Array.isArray(source?.items)
        ? source.items
        : Array.isArray(source?.responses)
          ? source.responses
          : [];
  }

  private unwrapObject(payload: unknown): any {
    if (!payload || typeof payload !== 'object') {
      return {};
    }

    const source = payload as any;
    return source.data && typeof source.data === 'object' && !Array.isArray(source.data)
      ? source.data
      : source;
  }

  private readDate(value: unknown): string | null {
    if (!value) {
      return null;
    }

    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  private formatValue(value: unknown): string {
    if (Array.isArray(value)) {
      return value.join(', ');
    }

    if (value === null || value === undefined || value === '') {
      return 'Not provided';
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    return String(value);
  }
}

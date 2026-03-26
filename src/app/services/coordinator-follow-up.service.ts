import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

export interface CoordinatorProtocolStatus {
  key: 'questionnaireCompleted' | 'symptomsSubmitted' | 'vitalSignsSubmitted' | 'coordinatorValidation';
  label: string;
  done: boolean;
}

export interface CoordinatorProtocolPatient {
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientDepartment: string;
  statuses: CoordinatorProtocolStatus[];
  updatedAt: string | null;
}

export interface CoordinatorProtocolDetails {
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientDepartment: string;
  statuses: CoordinatorProtocolStatus[];
  submittedAt: string | null;
  questionnaireResponses: Array<{ title: string; submittedAt: string | null; status: string; answersCount: number }>;
  symptoms: Array<{ label: string; value: string }>;
  vitalSigns: Array<{ label: string; value: string }>;
  validationNote: string;
  rawSections: Array<{ title: string; rows: Array<{ label: string; value: string }> }>;
}

@Injectable({
  providedIn: 'root'
})
export class CoordinatorFollowUpService {
  private readonly protocolUrls = [
    'http://localhost:3000/coordinator/follow-up/protocol',
    'http://localhost:3000/api/coordinator/follow-up/protocol'
  ] as const;

  constructor(private http: HttpClient) {}

  getProtocol(): Observable<CoordinatorProtocolPatient[]> {
    return this.getWithFallback([...this.protocolUrls]).pipe(
      map((payload) => this.extractArray(payload).map((row) => this.mapProtocolPatient(row)))
    );
  }

  getProtocolDetails(patientId: string): Observable<CoordinatorProtocolDetails> {
    return this.getDetailsWithFallback([...this.protocolUrls], patientId).pipe(
      map((payload) => this.mapProtocolDetails(payload, patientId))
    );
  }

  private getWithFallback(urls: string[]): Observable<unknown> {
    const [head, ...tail] = urls;
    if (!head) {
      return throwError(() => new Error('No coordinator protocol URL configured'));
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

  private getDetailsWithFallback(urls: string[], patientId: string): Observable<unknown> {
    const [head, ...tail] = urls;
    if (!head) {
      return throwError(() => new Error('No coordinator protocol URL configured'));
    }

    return this.http.get<unknown>(`${head}/${patientId}`).pipe(
      catchError((error) => {
        if (tail.length === 0) {
          return throwError(() => error);
        }
        return this.getDetailsWithFallback(tail, patientId);
      })
    );
  }

  private mapProtocolPatient(row: any): CoordinatorProtocolPatient {
    const patient = row?.patient ?? row?.patientId ?? {};
    const patientId = String(row?.patientId ?? patient?._id ?? patient?.id ?? '');
    const patientName = this.readPatientName(row, patient);

    return {
      patientId,
      patientName,
      patientEmail: String(row?.patientEmail ?? patient?.email ?? ''),
      patientDepartment: String(row?.patientDepartment ?? patient?.assignedDepartment ?? patient?.department ?? ''),
      statuses: this.buildStatuses(row),
      updatedAt: this.readDate(row?.updatedAt ?? row?.submittedAt ?? row?.createdAt)
    };
  }

  private mapProtocolDetails(payload: unknown, fallbackPatientId: string): CoordinatorProtocolDetails {
    const source = this.unwrapObject(payload);
    const patient = source.patient ?? source.patientId ?? {};
    const symptoms = Array.isArray(source.symptoms) ? source.symptoms : [];
    const vitals = this.unwrapObject(source.vitalSigns ?? source.vitals);
    const questionnaireResponses = Array.isArray(source.questionnaireResponses)
      ? source.questionnaireResponses
      : Array.isArray(source.questionnaires)
        ? source.questionnaires
        : [];

    const symptomRows = symptoms.map((item: any) => ({
      label: String(item?.label ?? item?.question ?? item?.name ?? 'Symptom'),
      value: this.formatValue(item?.value ?? item?.answer ?? item?.status)
    }));

    const vitalRows = Object.entries(vitals)
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => ({
        label: this.humanizeKey(key),
        value: this.formatValue(value)
      }));

    const rawSections = Array.isArray(source.sections)
      ? source.sections.map((section: any) => ({
          title: String(section?.title ?? 'Section'),
          rows: Array.isArray(section?.rows)
            ? section.rows.map((row: any) => ({
                label: String(row?.label ?? row?.key ?? 'Field'),
                value: this.formatValue(row?.value)
              }))
            : []
        }))
      : [];

    return {
      patientId: String(source?.patientId ?? patient?._id ?? patient?.id ?? fallbackPatientId),
      patientName: this.readPatientName(source, patient),
      patientEmail: String(source?.patientEmail ?? patient?.email ?? ''),
      patientDepartment: String(source?.patientDepartment ?? patient?.assignedDepartment ?? patient?.department ?? ''),
      statuses: this.buildStatuses(source),
      submittedAt: this.readDate(source?.submittedAt ?? source?.updatedAt ?? source?.createdAt),
      questionnaireResponses: questionnaireResponses.map((item: any) => ({
        title: String(item?.title ?? item?.questionnaireTitle ?? item?.name ?? 'Questionnaire'),
        submittedAt: this.readDate(item?.submittedAt ?? item?.createdAt ?? item?.updatedAt),
        status: String(item?.status ?? (item?.completed ? 'Completed' : 'Pending')),
        answersCount: this.toNumber(item?.answersCount ?? item?.answers?.length)
      })),
      symptoms: symptomRows,
      vitalSigns: vitalRows,
      validationNote: String(source?.validationNote ?? source?.coordinatorNote ?? ''),
      rawSections
    };
  }

  private buildStatuses(source: any): CoordinatorProtocolStatus[] {
    return [
      { key: 'questionnaireCompleted', label: 'Questionnaire completed', done: this.readBoolean(source, 'questionnaireCompleted', 'isQuestionnaireCompleted') },
      { key: 'symptomsSubmitted', label: 'Symptoms submitted', done: this.readBoolean(source, 'symptomsSubmitted', 'isSymptomsSubmitted') },
      { key: 'vitalSignsSubmitted', label: 'Vital signs submitted', done: this.readBoolean(source, 'vitalSignsSubmitted', 'isVitalSignsSubmitted') },
      { key: 'coordinatorValidation', label: 'Coordinator validation', done: this.readBoolean(source, 'coordinatorValidation', 'isCoordinatorValidation', 'validated') }
    ];
  }

  private extractArray(payload: unknown): any[] {
    if (Array.isArray(payload)) {
      return payload;
    }

    const source = this.unwrapObject(payload);

    if (Array.isArray(source?.patients)) {
      return source.patients;
    }

    if (Array.isArray(source?.items)) {
      return source.items;
    }

    if (Array.isArray(source?.rows)) {
      return source.rows;
    }

    return [];
  }

  private unwrapObject(payload: unknown): any {
    if (!payload || typeof payload !== 'object') {
      return {};
    }

    const source = payload as any;
    return source.data && typeof source.data === 'object' ? source.data : source;
  }

  private readPatientName(source: any, patient: any): string {
    const value = source?.patientName
      ?? patient?.fullName
      ?? `${patient?.firstName ?? ''} ${patient?.lastName ?? ''}`.trim();

    return String(value || 'Unknown patient');
  }

  private readBoolean(source: any, ...keys: string[]): boolean {
    for (const key of keys) {
      const value = source?.[key];
      if (value !== undefined && value !== null) {
        return !!value;
      }
    }

    return false;
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

  private humanizeKey(value: string): string {
    return value
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/^\w/, (letter) => letter.toUpperCase());
  }

  private toNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}

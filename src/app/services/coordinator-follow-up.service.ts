import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { ApiConfig } from '../config/api.config';

declare const ngDevMode: boolean | undefined;

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
  questionnaireExpectedCount: number | null;
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
    `${ApiConfig.BASE_URL}/coordinator/follow-up/protocol`,
    `${ApiConfig.BASE_URL}/api/coordinator/follow-up/protocol`
  ] as const;

  constructor(private http: HttpClient) {}

  getProtocol(): Observable<CoordinatorProtocolPatient[]> {
    return this.getWithFallback([...this.protocolUrls]).pipe(
      map((payload) => {
        const rows = this.extractArray(payload);
        if (typeof ngDevMode !== 'undefined' && ngDevMode && rows.length > 0) {
          console.log('[CoordinatorFollowUp] raw first row', rows[0]);
        }
        return rows.map((row) => this.mapProtocolPatient(row));
      })
    );
  }

  getProtocolDetails(patientId: string): Observable<CoordinatorProtocolDetails> {
    return this.getDetailsWithFallback([...this.protocolUrls], patientId).pipe(
      map((payload) => {
        if (typeof ngDevMode !== 'undefined' && ngDevMode) {
          console.log('[CoordinatorFollowUp] raw details payload', payload);
        }
        return this.mapProtocolDetails(payload, patientId);
      })
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
      patientDepartment: String(
        row?.patientDepartment
        ?? row?.assignedDepartment
        ?? row?.department
        ?? patient?.assignedDepartment
        ?? patient?.department
        ?? ''
      ),
      statuses: this.buildStatuses(row),
      updatedAt: this.readDate(row?.updatedAt ?? row?.submittedAt ?? row?.createdAt)
    };
  }

  private mapProtocolDetails(payload: unknown, fallbackPatientId: string): CoordinatorProtocolDetails {
    const source = this.unwrapObject(payload);
    const patient = source.patient ?? source.patientId ?? {};
    const symptoms = Array.isArray(source.symptoms) ? source.symptoms : [];
    const vitals = this.unwrapObject(source.vitalSigns ?? source.vitals);
    let questionnaireResponses = this.extractQuestionnaireResponses(source);
    if (questionnaireResponses.length === 0) {
      questionnaireResponses = this.buildQuestionnaireProgressFallback(source);
    }
    const questionnaireMeta = source.questionnaire ?? source.questionnaires ?? null;
    const questionnaireExpectedCount = questionnaireMeta && typeof questionnaireMeta === 'object'
      ? this.coerceNumber((questionnaireMeta as any).expectedCount ?? (questionnaireMeta as any).expected)
      : null;

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
      patientDepartment: String(
        source?.patientDepartment
        ?? source?.assignedDepartment
        ?? source?.department
        ?? patient?.assignedDepartment
        ?? patient?.department
        ?? ''
      ),
      statuses: this.buildStatuses(source),
      submittedAt: this.readDate(source?.submittedAt ?? source?.updatedAt ?? source?.createdAt),
      questionnaireExpectedCount: questionnaireExpectedCount ?? null,
      questionnaireResponses: questionnaireResponses.map((item: any) => ({
        title: String(item?.title ?? item?.questionnaireTitle ?? item?.name ?? item?.questionnaireName ?? 'Questionnaire'),
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
    const statusContainer = this.unwrapObject(
      source?.status ?? source?.statuses ?? source?.protocolStatus ?? source?.followUpStatus ?? {}
    );
    const merged = { ...statusContainer, ...source };

    const questionnaireSection = source?.questionnaire ?? source?.questionnaires ?? null;
    const symptomsSection = source?.symptoms ?? source?.symptom ?? null;
    const vitalsSection = source?.vitalSigns ?? source?.vitals ?? source?.vital_signs ?? null;
    const coordinatorValidationSection = source?.coordinatorValidation ?? source?.validation ?? null;

    return [
      {
        key: 'questionnaireCompleted',
        label: 'Questionnaire completed',
        done: this.resolveQuestionnaireAllDone(questionnaireSection) ?? this.resolveDone(merged, {
          booleanKeys: ['questionnaireCompleted', 'isQuestionnaireCompleted', 'questionnairesCompleted', 'isQuestionnairesCompleted'],
          countKeys: ['completedQuestionnaires', 'completedQuestionnairesCount', 'questionnairesCompletedCount', 'questionnaireResponsesCount'],
          arrayKeys: ['questionnaireResponses', 'questionnaires', 'responses'],
          statusKeys: ['questionnaireStatus', 'questionnairesStatus']
        })
      },
      {
        key: 'symptomsSubmitted',
        label: 'Symptoms submitted',
        done: this.resolveSectionDone(symptomsSection) ?? this.resolveDone(merged, {
          booleanKeys: ['symptomsSubmitted', 'isSymptomsSubmitted', 'hasSymptoms'],
          countKeys: ['submittedSymptoms', 'submittedSymptomsCount', 'symptomsCount', 'symptomResponsesCount'],
          arrayKeys: ['symptoms', 'symptomResponses', 'symptomsResponses', 'answers'],
          statusKeys: ['symptomsStatus']
        })
      },
      {
        key: 'vitalSignsSubmitted',
        label: 'Vital signs submitted',
        done: this.resolveSectionDone(vitalsSection) ?? this.resolveDone(merged, {
          booleanKeys: ['vitalSignsSubmitted', 'isVitalSignsSubmitted', 'vitalsSubmitted', 'isVitalsSubmitted', 'hasVitals'],
          countKeys: ['submittedVitalSigns', 'submittedVitalSignsCount', 'vitalSignsCount', 'vitalsCount'],
          arrayKeys: ['vitalSigns', 'vitals', 'vitalSignsSubmissions', 'vitalsSubmissions'],
          statusKeys: ['vitalSignsStatus', 'vitalsStatus']
        })
      },
      {
        key: 'coordinatorValidation',
        label: 'Coordinator validation',
        done: this.resolveSectionDone(coordinatorValidationSection) ?? this.resolveDone(merged, {
          booleanKeys: ['coordinatorValidation', 'isCoordinatorValidation', 'validated', 'isValidated'],
          countKeys: ['validatedSymptoms', 'validatedSymptomsCount'],
          arrayKeys: [],
          statusKeys: ['validationStatus', 'coordinatorValidationStatus']
        })
      }
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

  private extractQuestionnaireResponses(source: any): any[] {
    if (!source || typeof source !== 'object') {
      return [];
    }

    const direct = source.questionnaireResponses
      ?? source.questionnaires
      ?? source.questionnaireSubmissions
      ?? source.submissions;

    if (Array.isArray(direct)) {
      return direct;
    }

    const questionnaire = source.questionnaire ?? source.questionnaires ?? null;
    if (questionnaire && typeof questionnaire === 'object') {
      const nested = (questionnaire as any).responses
        ?? (questionnaire as any).submissions
        ?? (questionnaire as any).items
        ?? (questionnaire as any).history
        ?? (questionnaire as any).list;

      if (Array.isArray(nested)) {
        return nested;
      }
    }

    return [];
  }

  private buildQuestionnaireProgressFallback(source: any): any[] {
    if (!source || typeof source !== 'object') {
      return [];
    }

    const questionnaire = source.questionnaire ?? source.questionnaires ?? null;
    if (!questionnaire || typeof questionnaire !== 'object') {
      return [];
    }

    const statusText = String((questionnaire as any).status ?? '').trim();
    const completedCount = this.coerceNumber((questionnaire as any).completedCount ?? (questionnaire as any).submittedCount) ?? 0;
    const expectedCount = this.coerceNumber((questionnaire as any).expectedCount ?? (questionnaire as any).expected) ?? 0;
    const latestSubmissionAt = (questionnaire as any).latestSubmissionAt ?? null;

    const progressLabel = expectedCount > 0
      ? `${completedCount}/${expectedCount} submitted`
      : `${completedCount} submitted`;

    const statusLabel = statusText ? `${statusText} (${progressLabel})` : progressLabel;

    return [
      {
        title: 'Questionnaires',
        submittedAt: latestSubmissionAt,
        status: statusLabel,
        answersCount: completedCount
      }
    ];
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

  private resolveDone(
    source: any,
    spec: {
      booleanKeys: string[];
      countKeys: string[];
      arrayKeys: string[];
      statusKeys: string[];
    }
  ): boolean {
    const readValue = (key: string): unknown => source?.[key];

    for (const key of spec.booleanKeys) {
      const value = readValue(key);
      const resolved = this.coerceBoolean(value);
      if (resolved !== null) {
        return resolved;
      }
    }

    for (const key of spec.countKeys) {
      const value = readValue(key);
      const numeric = this.coerceNumber(value);
      if (numeric !== null) {
        return numeric > 0;
      }
    }

    for (const key of spec.arrayKeys) {
      const value = readValue(key);
      if (Array.isArray(value)) {
        return value.length > 0;
      }
    }

    for (const key of spec.statusKeys) {
      const value = readValue(key);
      const normalized = String(value || '').trim().toLowerCase();
      if (!normalized) {
        continue;
      }

      if (['done', 'completed', 'complete', 'submitted', 'validated', 'ok', 'true', 'yes'].includes(normalized)) {
        return true;
      }

      if (['pending', 'missing', 'no', 'false'].includes(normalized)) {
        return false;
      }
    }

    return false;
  }

  private resolveSectionDone(section: unknown): boolean | null {
    if (!section || typeof section !== 'object') {
      return null;
    }

    const source = section as any;

    // Preferred: explicit boolean flag.
    const completedBool = this.coerceBoolean(source.completed);
    if (completedBool !== null) {
      return completedBool;
    }

    // Next: string status.
    const statusText = String(source.status || '').trim().toLowerCase();
    if (statusText) {
      if (['done', 'completed', 'complete', 'submitted', 'validated', 'ok', 'true', 'yes'].includes(statusText)) {
        return true;
      }
      if (['pending', 'missing', 'no', 'false'].includes(statusText)) {
        return false;
      }
    }

    // Next: counts. Many APIs provide expectedCount/completedCount.
    const completedCount = this.coerceNumber(source.completedCount ?? source.count ?? source.total);
    const expectedCount = this.coerceNumber(source.expectedCount ?? source.expected);

    if (completedCount !== null && expectedCount !== null) {
      if (expectedCount <= 0) {
        return completedCount > 0;
      }
      return completedCount >= expectedCount;
    }

    if (completedCount !== null) {
      return completedCount > 0;
    }

    return null;
  }

  private resolveQuestionnaireAllDone(section: unknown): boolean | null {
    if (!section || typeof section !== 'object') {
      return null;
    }

    const source = section as any;

    const completedBool = this.coerceBoolean(source.completed);
    if (completedBool !== null) {
      return completedBool;
    }

    const statusText = String(source.status || '').trim().toLowerCase();
    if (statusText) {
      if (['done', 'completed', 'complete', 'validated', 'ok', 'true', 'yes'].includes(statusText)) {
        return true;
      }
      if (['pending', 'missing', 'no', 'false'].includes(statusText)) {
        // keep evaluating counts below
      }
    }

    const completedCount = this.coerceNumber(source.completedCount ?? source.submittedCount ?? source.count ?? source.total);
    const expectedCount = this.coerceNumber(source.expectedCount ?? source.expected);

    if (expectedCount !== null) {
      if (expectedCount <= 0) {
        return true;
      }

      if (completedCount !== null) {
        return completedCount >= expectedCount;
      }

      return false;
    }

    if (completedCount !== null) {
      return completedCount > 0;
    }

    return null;
  }

  private coerceBoolean(value: unknown): boolean | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return value > 0;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['true', 'yes', 'done', 'completed', 'submitted', 'validated', 'ok'].includes(normalized)) {
        return true;
      }
      if (['false', 'no', 'pending'].includes(normalized)) {
        return false;
      }
    }

    return null;
  }

  private coerceNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
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

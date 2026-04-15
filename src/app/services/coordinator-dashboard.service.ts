import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { ApiConfig } from '../config/api.config';

export type CoordinatorRange = '7d' | '30d' | '90d';

declare const ngDevMode: boolean | undefined;

export interface CoordinatorActivityPoint {
  label: string;
  value: number;
}

export interface CoordinatorDashboardMetrics {
  completedQuestionnaires: number;
  submittedSymptoms: number;
  submittedVitalSigns: number;
  validatedSymptoms: number;
  pendingValidations: number;
  questionnaireActivity: CoordinatorActivityPoint[];
  symptomActivity: CoordinatorActivityPoint[];
  generalActivity: CoordinatorActivityPoint[];
}

@Injectable({
  providedIn: 'root'
})
export class CoordinatorDashboardService {
  private readonly apiUrls = [
    `${ApiConfig.BASE_URL}/coordinator/dashboard`,
    `${ApiConfig.BASE_URL}/api/coordinator/dashboard`
  ] as const;

  constructor(private http: HttpClient) {}

  getDashboard(range: CoordinatorRange): Observable<CoordinatorDashboardMetrics> {
    const params = new HttpParams().set('range', range);
    return this.getWithFallback([...this.apiUrls], { params }).pipe(
      tap((payload) => {
        // eslint-disable-next-line no-undef
        const isDev = typeof ngDevMode !== 'undefined' && !!(ngDevMode as any);
        if (isDev) {
          console.log('[CoordinatorDashboard] raw payload', payload);
        }
      }),
      map((payload) => this.normalizeDashboard(payload)),
      tap((metrics) => {
        // eslint-disable-next-line no-undef
        const isDev = typeof ngDevMode !== 'undefined' && !!(ngDevMode as any);
        if (isDev) {
          console.log('[CoordinatorDashboard] normalized metrics', metrics);
        }
      })
    );
  }

  private getWithFallback(urls: string[], options: { params: HttpParams }): Observable<unknown> {
    const [head, ...tail] = urls;
    if (!head) {
      return throwError(() => new Error('No coordinator dashboard URL configured'));
    }

    return this.http.get<unknown>(head, options).pipe(
      catchError((error) => {
        if (tail.length === 0) {
          return throwError(() => error);
        }
        return this.getWithFallback(tail, options);
      })
    );
  }

  private normalizeDashboard(payload: unknown): CoordinatorDashboardMetrics {
    const source = this.deepUnwrapObject(payload);
    const counts = this.deepUnwrapObject(
      source.statistics ?? source.counts ?? source.metrics ?? source.stats ?? source.summary ?? {}
    );
    const activity = this.deepUnwrapObject(
      source.activity ?? source.activities ?? {}
    );
    const charts = this.deepUnwrapObject(
      source.charts ?? source.chart ?? {}
    );

    const questionnaireActivity = this.readActivity(
      source.questionnaireActivity
        ?? activity.questionnaireActivity
        ?? charts.questionnaireActivity
        ?? source.questionnaireChart
        ?? charts.questionnaires
        ?? charts.questionnaire
    );

    const symptomActivity = this.readActivity(
      source.symptomActivity
        ?? activity.symptomActivity
        ?? charts.symptomActivity
        ?? source.symptomChart
        ?? charts.symptoms
        ?? charts.symptom
    );

    const generalActivity = this.readActivity(
      source.generalActivity
        ?? activity.generalActivity
        ?? charts.generalActivity
        ?? source.generalChart
        ?? charts.general
        ?? charts.activity
    );

    const completedQuestionnairesFromStats = this.readNumber(
        source,
        counts,
        'completedQuestionnaires',
        'completed_questionnaires',
        'questionnairesCompleted',
        'questionnaires_completed',
        'completedQuestionnaireCount'
      );

    // Some backends provide correct questionnaire completion only in the chart series.
    // If stats are stuck at 0 but the chart has data, use the chart total for the card.
    const completedQuestionnaires = completedQuestionnairesFromStats > 0
      ? completedQuestionnairesFromStats
      : this.sumActivity(questionnaireActivity);

    return {
      completedQuestionnaires,
      submittedSymptoms: this.readNumber(
        source,
        counts,
        'submittedSymptoms',
        'submitted_symptoms',
        'symptomsSubmitted',
        'symptoms_submitted',
        'submittedSymptomsCount'
      ),
      submittedVitalSigns: this.readNumber(
        source,
        counts,
        'submittedVitalSigns',
        'submitted_vital_signs',
        'vitalSignsSubmitted',
        'vital_signs_submitted',
        'submittedVitalsCount'
      ),
      validatedSymptoms: this.readNumber(
        source,
        counts,
        'validatedSymptoms',
        'validated_symptoms',
        'symptomsValidated',
        'symptoms_validated',
        'validatedSymptomsCount'
      ),
      pendingValidations: this.readNumber(
        source,
        counts,
        'pendingValidations',
        'pending_validations',
        'pendingValidation',
        'pending_validation',
        'validationsPending',
        'validations_pending',
        'pendingValidationCount'
      ),
      questionnaireActivity,
      symptomActivity,
      generalActivity
    };
  }

  private readActivity(payload: unknown): CoordinatorActivityPoint[] {
    const unwrapped = this.deepUnwrapObject(payload);
    const rows = Array.isArray(unwrapped)
      ? unwrapped
      : Array.isArray((unwrapped as any)?.data)
        ? (unwrapped as any).data
        : Array.isArray((unwrapped as any)?.points)
          ? (unwrapped as any).points
          : [];

    return rows.map((row: any, index: number) => this.toActivityPoint(row, index));
  }

  private toActivityPoint(row: any, index: number): CoordinatorActivityPoint {
    const label = String(
      row?.label
      ?? row?.date
      ?? row?.day
      ?? row?.week
      ?? row?.month
      ?? row?.period
      ?? row?.bucket
      ?? row?.name
      ?? row?.x
      ?? row?._id
      ?? `Point ${index + 1}`
    );

    const preferredValue =
      row?.value
      ?? row?.count
      ?? row?.total
      ?? row?.y
      ?? row?.completed
      ?? row?.submitted
      ?? row?.activity
      ?? row?.responses
      ?? row?.questionnaires
      ?? row?.symptoms
      ?? row?.validated;

    if (preferredValue !== undefined) {
      return { label, value: this.toNumber(preferredValue) };
    }

    // Generic fallback: if the row contains a single numeric-like field, use it.
    if (row && typeof row === 'object') {
      for (const [key, value] of Object.entries(row)) {
        if (key === 'label' || key === 'date' || key === 'day' || key === 'week' || key === 'month' || key === 'period' || key === 'bucket' || key === 'name' || key === 'x' || key === '_id') {
          continue;
        }
        const numeric = this.toNumber(value);
        if (numeric !== 0 || value === 0) {
          return { label, value: numeric };
        }
      }
    }

    return { label, value: 0 };
  }

  private sumActivity(points: CoordinatorActivityPoint[]): number {
    const total = points.reduce((accumulator, point) => accumulator + this.toNumber(point?.value), 0);
    return total > 0 ? total : 0;
  }

  private readNumber(primary: any, secondary: any, ...keys: string[]): number {
    for (const key of keys) {
      if (primary?.[key] !== undefined && primary?.[key] !== null) {
        return this.toNumber(primary[key]);
      }
      if (secondary?.[key] !== undefined && secondary?.[key] !== null) {
        return this.toNumber(secondary[key]);
      }
    }
    return 0;
  }

  private deepUnwrapObject(payload: unknown): any {
    let current: any = payload;
    let safety = 0;

    while (safety < 4 && current && typeof current === 'object' && !Array.isArray(current)) {
      const next = (current as any).data ?? (current as any).result ?? (current as any).payload;
      if (next && typeof next === 'object') {
        current = next;
        safety += 1;
        continue;
      }
      break;
    }

    return current ?? {};
  }

  private toNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}

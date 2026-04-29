import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiConfig } from '../config/api.config';

export interface DoctorSymptomsSubmission {
  _id: string;
  patientId?: string;
  submittedAt: string | null;

  // Symptoms = Questions + Réponses du patient (ce qui doit s'afficher maintenant)
  symptoms: Array<{ label: string; value: string }>;

  vitalSigns: Array<{ label: string; value: string }>;
  validationNote: string;

  // === Réponses brutes pour l'analyse IA ===
  answers: Array<{
    question: string;
    answer: any;
  }>;

  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface DoctorVitalsHistoryPoint {
  recordedAt: string;
  temperature: number | null;
  heartRate: number | null;
  systolic: number | null;
  diastolic: number | null;
  spo2: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class DoctorSymptomsService {

  constructor(private http: HttpClient) {}

  getPatientSymptoms(patientId: string): Observable<DoctorSymptomsSubmission[]> {
    return this.http.get<unknown>(`${ApiConfig.SYMPTOMS}/doctor/patient/${patientId}/view-symptoms`).pipe(
      map((payload) => this.extractArray(payload).map((item) => this.mapSubmission(item)))
    );
  }

  getPatientVitalsHistory(patientId: string): Observable<DoctorVitalsHistoryPoint[]> {
    return this.http.get<unknown>(`${ApiConfig.BASE_URL}/symptoms/doctor/patient/${patientId}/vitals-history`)
      .pipe(
        map((payload) => this.extractArray(payload)
          .map((item) => this.mapVitalsPoint(item))
          .filter((point) => !!point.recordedAt))
      );
  }

  private mapSubmission(payload: unknown): DoctorSymptomsSubmission {
    const source = this.unwrapObject(payload);

    // Extraction des réponses brutes (pour IA + affichage symptoms)
    const rawAnswers = Array.isArray(source.answers)
      ? source.answers
      : Array.isArray(source.responses)
        ? source.responses
        : [];

    // Extraction des vital signs
    const vitals = this.unwrapObject(source.vitals ?? source.vitalSigns ?? {});

    return {
      _id: String(source?._id ?? source?.id ?? ''),
      patientId: String(source?.patientId ?? source?.patient ?? ''),

      submittedAt: this.readDate(source?.submittedAt ?? source?.createdAt ?? source?.updatedAt),

      // ==================== CORRECTION ICI ====================
      // On utilise les "answers" pour afficher les questions + réponses du patient
      symptoms: rawAnswers.map((item: any) => ({
        label: String(item?.question ?? item?.label ?? item?.name ?? 'Question'),
        value: this.formatValue(item?.answer ?? item?.value ?? item)
      })),

      // Vital Signs (reste inchangé)
      vitalSigns: Object.entries(vitals).map(([key, value]) => ({
        label: this.humanizeKey(key),
        value: this.formatValue(value)
      })),

      validationNote: String(source?.validationNote ?? source?.note ?? ''),

      // Answers bruts pour l'IA (inchangé)
      answers: rawAnswers.map((item: any) => ({
        question: String(item?.question ?? item?.label ?? item?.name ?? 'Question inconnue'),
        answer: item?.answer ?? item?.value ?? item
      })),

      createdAt: this.readDate(source?.createdAt),
      updatedAt: this.readDate(source?.updatedAt)
    };
  }

  private extractArray(payload: unknown): any[] {
    if (Array.isArray(payload)) return payload;

    const source = this.unwrapObject(payload);
    return Array.isArray(source?.data) ? source.data
         : Array.isArray(source?.items) ? source.items
         : Array.isArray(source?.responses) ? source.responses
         : [source];
  }

  private mapVitalsPoint(payload: unknown): DoctorVitalsHistoryPoint {
    const source = this.unwrapObject(payload);

    const vitalsSource = this.unwrapObject(
      source.vitals ??
      source.vitalSigns ??
      source.measurements ??
      source.metrics ??
      {}
    );

    const recordedAt = this.readDate(
      source.recordedAt ??
      source.submittedAt ??
      source.date ??
      source.createdAt ??
      source.timestamp
    ) ?? '';

    const temperature = this.readNumber(
      vitalsSource.temperature ??
      vitalsSource.temp ??
      source.temperature
    );

    const heartRate = this.readNumber(
      vitalsSource.heartRate ??
      vitalsSource.heart_rate ??
      vitalsSource.pulse ??
      source.heartRate
    );

    const systolic = this.readNumber(
      vitalsSource.systolic ??
      vitalsSource.bpSystolic ??
      vitalsSource.bp_systolic ??
      source.systolic
    );

    const diastolic = this.readNumber(
      vitalsSource.diastolic ??
      vitalsSource.bpDiastolic ??
      vitalsSource.bp_diastolic ??
      source.diastolic
    );

    const spo2 = this.readNumber(
      vitalsSource.spo2 ??
      vitalsSource.SpO2 ??
      vitalsSource.oxygen ??
      source.spo2
    );

    const bloodPressure = source.bloodPressure ?? vitalsSource.bloodPressure;
    const parsedBloodPressure = this.parseBloodPressure(bloodPressure);

    return {
      recordedAt,
      temperature,
      heartRate,
      systolic: systolic ?? parsedBloodPressure.systolic,
      diastolic: diastolic ?? parsedBloodPressure.diastolic,
      spo2
    };
  }

  private unwrapObject(payload: unknown): any {
    if (!payload || typeof payload !== 'object') return {};
    const source = payload as any;
    return source.data && typeof source.data === 'object' && !Array.isArray(source.data)
      ? source.data
      : source;
  }

  private readDate(value: unknown): string | null {
    if (!value) return null;
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  private readNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private parseBloodPressure(value: unknown): { systolic: number | null; diastolic: number | null } {
    if (typeof value !== 'string') {
      return { systolic: null, diastolic: null };
    }

    const [systolicRaw, diastolicRaw] = value.split('/');
    return {
      systolic: this.readNumber(systolicRaw),
      diastolic: this.readNumber(diastolicRaw)
    };
  }

  private formatValue(value: unknown): string {
    if (Array.isArray(value)) return value.join(', ');
    if (value === null || value === undefined || value === '') return 'Not provided';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  }

  private humanizeKey(value: string): string {
    return value
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/^\w/, (letter) => letter.toUpperCase());
  }
}

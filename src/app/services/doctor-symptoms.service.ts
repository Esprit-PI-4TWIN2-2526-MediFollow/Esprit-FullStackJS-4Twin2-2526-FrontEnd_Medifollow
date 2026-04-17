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

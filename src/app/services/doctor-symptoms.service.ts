import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

export interface DoctorSymptomsSubmission {
  _id: string;
  submittedAt: string | null;
  symptoms: Array<{ label: string; value: string }>;
  vitalSigns: Array<{ label: string; value: string }>;
  validationNote: string;
}

@Injectable({
  providedIn: 'root'
})
export class DoctorSymptomsService {
  constructor(private http: HttpClient) {}

  getPatientSymptoms(patientId: string): Observable<DoctorSymptomsSubmission[]> {
    return this.http.get<unknown>(`http://localhost:3000/symptoms/doctor/patient/${patientId}/view-symptoms`).pipe(
      map((payload) => this.extractArray(payload).map((item) => this.mapSubmission(item)))
    );
  }

  private mapSubmission(payload: unknown): DoctorSymptomsSubmission {
    const source = this.unwrapObject(payload);
    const vitals = this.unwrapObject(source.vitals ?? source.vitalSigns);
    const symptoms = Array.isArray(source.answers)
      ? source.answers
      : Array.isArray(source.symptoms)
        ? source.symptoms
        : [];

    return {
      _id: String(source?._id ?? source?.id ?? ''),
      submittedAt: this.readDate(source?.submittedAt ?? source?.createdAt ?? source?.updatedAt),
      symptoms: symptoms.map((row: any) => ({
        label: String(row?.label ?? row?.question ?? row?.name ?? 'Symptom'),
        value: this.formatValue(row?.value ?? row?.answer)
      })),
      vitalSigns: Object.entries(vitals).map(([key, value]) => ({
        label: this.humanizeKey(key),
        value: this.formatValue(value)
      })),
      validationNote: String(source?.validationNote ?? source?.note ?? '')
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
          : [source];
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

  private humanizeKey(value: string): string {
    return value
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/^\w/, (letter) => letter.toUpperCase());
  }
}


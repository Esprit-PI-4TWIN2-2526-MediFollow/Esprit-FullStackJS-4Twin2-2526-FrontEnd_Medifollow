import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Consultation, CreateConsultationDto, UpdateConsultationDto } from '../models/consultation.model';

@Injectable({
  providedIn: 'root'
})
export class ConsultationService {
  private apiUrl = 'http://localhost:3000/consultations';

  constructor(private http: HttpClient) {}

  create(dto: CreateConsultationDto): Observable<Consultation> {
    return this.http.post<Consultation>(this.apiUrl, dto);
  }

  findAll(filters?: {
    status?: string;
    patientId?: string;
    doctorId?: string;
    startDate?: string;
    endDate?: string;
  }): Observable<Consultation[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof typeof filters];
        if (value) {
          params = params.set(key, value);
        }
      });
    }
    return this.http.get<Consultation[]>(this.apiUrl, { params });
  }

  findOne(id: string): Observable<Consultation> {
    return this.http.get<Consultation>(`${this.apiUrl}/${id}`);
  }

  findByDoctor(doctorId: string): Observable<Consultation[]> {
    return this.http.get<Consultation[]>(`${this.apiUrl}/doctor/${doctorId}`);
  }

  findByPatient(patientId: string): Observable<Consultation[]> {
    return this.http.get<Consultation[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  getTodayConsultations(doctorId: string): Observable<Consultation[]> {
    return this.http.get<Consultation[]>(`${this.apiUrl}/doctor/${doctorId}/today`);
  }

  getUpcomingConsultations(doctorId: string, days: number = 7): Observable<Consultation[]> {
    return this.http.get<Consultation[]>(`${this.apiUrl}/doctor/${doctorId}/upcoming?days=${days}`);
  }

  update(id: string, dto: UpdateConsultationDto): Observable<Consultation> {
    return this.http.patch<Consultation>(`${this.apiUrl}/${id}`, dto);
  }

  start(id: string): Observable<Consultation> {
    return this.http.post<Consultation>(`${this.apiUrl}/${id}/start`, {});
  }

  end(id: string, notes?: string, diagnosis?: string): Observable<Consultation> {
    return this.http.post<Consultation>(`${this.apiUrl}/${id}/end`, { notes, diagnosis });
  }

  cancel(id: string): Observable<Consultation> {
    return this.http.post<Consultation>(`${this.apiUrl}/${id}/cancel`, {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

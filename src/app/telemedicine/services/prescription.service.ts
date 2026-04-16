import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Prescription, CreatePrescriptionDto, IssuePrescriptionDto } from '../models/prescription.model';
import { ApiConfig } from '../../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class PrescriptionService {
  private apiUrl = `${ApiConfig.BASE_URL}/prescriptions`;

  constructor(private http: HttpClient) {}

  create(dto: CreatePrescriptionDto): Observable<Prescription> {
    return this.http.post<Prescription>(this.apiUrl, dto);
  }

  findAll(filters?: {
    patientId?: string;
    doctorId?: string;
    consultationId?: string;
    status?: string;
  }): Observable<Prescription[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof typeof filters];
        if (value) {
          params = params.set(key, value);
        }
      });
    }
    return this.http.get<Prescription[]>(this.apiUrl, { params });
  }

  findOne(id: string): Observable<Prescription> {
    return this.http.get<Prescription>(`${this.apiUrl}/${id}`);
  }

  findByQRCode(qrCode: string): Observable<Prescription> {
    return this.http.get<Prescription>(`${this.apiUrl}/qr/${qrCode}`);
  }

  findByPatient(patientId: string): Observable<Prescription[]> {
    return this.http.get<Prescription[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  findByConsultation(consultationId: string): Observable<Prescription[]> {
    return this.http.get<Prescription[]>(`${this.apiUrl}/consultation/${consultationId}`);
  }

  issue(id: string, dto: IssuePrescriptionDto): Observable<Prescription> {
    return this.http.post<Prescription>(`${this.apiUrl}/${id}/issue`, dto);
  }

  markAsSent(id: string): Observable<Prescription> {
    return this.http.post<Prescription>(`${this.apiUrl}/${id}/send`, {});
  }

  markAsDispensed(id: string): Observable<Prescription> {
    return this.http.post<Prescription>(`${this.apiUrl}/${id}/dispense`, {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

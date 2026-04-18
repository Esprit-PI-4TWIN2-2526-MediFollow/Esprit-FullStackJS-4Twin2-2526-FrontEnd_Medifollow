import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MedicalDocument, UploadDocumentDto } from '../models/medical-document.model';

@Injectable({
  providedIn: 'root'
})
export class MedicalDocumentService {
  private apiUrl = 'http://localhost:3000/medical-documents';

  constructor(private http: HttpClient) {}

  upload(dto: UploadDocumentDto, uploadedById: string): Observable<MedicalDocument> {
    const formData = new FormData();
    formData.append('file', dto.file);
    formData.append('patientId', dto.patientId);
    formData.append('type', dto.type);
    formData.append('title', dto.title);
    
    if (dto.consultationId) formData.append('consultationId', dto.consultationId);
    if (dto.description) formData.append('description', dto.description);
    if (dto.examDate) formData.append('examDate', dto.examDate);
    if (dto.laboratory) formData.append('laboratory', dto.laboratory);
    if (dto.radiologist) formData.append('radiologist', dto.radiologist);
    if (dto.sharedWith) {
      dto.sharedWith.forEach(id => formData.append('sharedWith[]', id));
    }

    return this.http.post<MedicalDocument>(`${this.apiUrl}/upload`, formData);
  }

  findAll(filters?: {
    patientId?: string;
    consultationId?: string;
    type?: string;
    uploadedById?: string;
  }): Observable<MedicalDocument[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof typeof filters];
        if (value) {
          params = params.set(key, value);
        }
      });
    }
    return this.http.get<MedicalDocument[]>(this.apiUrl, { params });
  }

  findOne(id: string): Observable<MedicalDocument> {
    return this.http.get<MedicalDocument>(`${this.apiUrl}/${id}`);
  }

  findByPatient(patientId: string): Observable<MedicalDocument[]> {
    return this.http.get<MedicalDocument[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  findByConsultation(consultationId: string): Observable<MedicalDocument[]> {
    return this.http.get<MedicalDocument[]>(`${this.apiUrl}/consultation/${consultationId}`);
  }

  share(id: string, userIds: string[]): Observable<MedicalDocument> {
    return this.http.patch<MedicalDocument>(`${this.apiUrl}/${id}/share`, { userIds });
  }

  unshare(id: string, userId: string): Observable<MedicalDocument> {
    return this.http.patch<MedicalDocument>(`${this.apiUrl}/${id}/unshare`, { userId });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

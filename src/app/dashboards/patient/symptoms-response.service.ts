import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { SymptomAssignedForm, SymptomResponse } from './symptoms-response.model';
import { ApiConfig } from '../../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class SymptomsResponseService {
  private readonly apiUrl = ApiConfig.SYMPTOMS;

  constructor(private http: HttpClient) {}

  getPatientResponses(patientId: string): Observable<SymptomResponse[]> {
    return this.http.get<SymptomResponse[]>(`${this.apiUrl}/response/${patientId}`);
  }

  getAssignedForm(patientId: string): Observable<SymptomAssignedForm> {
    return this.http.get<SymptomAssignedForm>(`${this.apiUrl}/form/patient/${patientId}`);
  }
}

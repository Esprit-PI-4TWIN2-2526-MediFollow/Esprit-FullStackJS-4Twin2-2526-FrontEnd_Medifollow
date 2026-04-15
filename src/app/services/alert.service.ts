import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Alert } from '../models/alert';
import { ApiConfig } from '../config/api.config';


@Injectable({ providedIn: 'root' })
export class AlertService {

  private apiUrl = ApiConfig.ALERTS;

  constructor(private http: HttpClient) {}

  getUnreadAlertsForDoctor(doctorId: string): Observable<Alert[]> {
    return this.http.get<Alert[]>(`${this.apiUrl}/doctor/${doctorId}/unread`);
  }

  getAlertsByPatient(patientId: string): Observable<Alert[]> {
    return this.http.get<Alert[]>(`${this.apiUrl}/patient/${patientId}`);
  }

getAlertById(alertId: string): Observable<Alert> {
    return this.http.get<Alert>(`${this.apiUrl}/${alertId}`);
  }

  markAsRead(alertId: string): Observable<Alert> {
    return this.http.patch<Alert>(`${this.apiUrl}/${alertId}/read`, {});
  }
}

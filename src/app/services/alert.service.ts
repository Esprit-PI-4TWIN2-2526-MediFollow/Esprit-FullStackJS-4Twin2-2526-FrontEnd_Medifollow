import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Alert } from '../models/alert';


@Injectable({ providedIn: 'root' })
export class AlertService {

  private apiUrl = 'http://localhost:3000/alerts';

  constructor(private http: HttpClient) {}

  getUnreadAlertsForDoctor(doctorId: string): Observable<Alert[]> {
    return this.http.get<Alert[]>(`${this.apiUrl}/doctor/${doctorId}/unread`);
  }

  getAlertsByPatient(patientId: string): Observable<Alert[]> {
    return this.http.get<Alert[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  markAsRead(alertId: string): Observable<Alert> {
    return this.http.patch<Alert>(`${this.apiUrl}/${alertId}/read`, {});
  }
}

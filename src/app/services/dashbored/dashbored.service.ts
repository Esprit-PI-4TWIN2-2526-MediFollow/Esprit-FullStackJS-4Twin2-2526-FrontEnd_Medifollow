import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ActivityPoint, Alert, ComplianceService, GlobalFollowupRate, HighRiskPatient, InactivePatient, QuestionnaireStats, Summary } from '../../models/dashbored.interfaces';
import { ApiConfig } from '../../config/api.config';



@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly API = `${ApiConfig.BASE_URL}/dashboard`;

  constructor(private http: HttpClient) {}

  getSummary(): Observable<Summary> {
    return this.http.get<Summary>(`${this.API}/summary`);
  }

  getActivity(range?: '7d' | '30d' | '90d'): Observable<ActivityPoint[]> {
    const url = range ? `${this.API}/followup-activity?range=${range}` : `${this.API}/followup-activity`;
    return this.http.get<ActivityPoint[]>(url);
  }

  getCompliance(): Observable<ComplianceService[]> {
    return this.http.get<ComplianceService[]>(`${this.API}/compliance-by-service`);
  }

  getQuestionnaireStats(): Observable<QuestionnaireStats> {
    return this.http.get<QuestionnaireStats>(`${this.API}/questionnaires-stats`);
  }

  getAlerts(): Observable<Alert[]> {
    return this.http.get<Alert[]>(`${this.API}/alerts`);
  }

  getHighRiskPatients(): Observable<HighRiskPatient[]> {
    return this.http.get<HighRiskPatient[]>(`${this.API}/high-risk-patients`);
  }

  getGlobalFollowupRate(): Observable<GlobalFollowupRate> {
    return this.http.get<GlobalFollowupRate>(`${this.API}/global-followup-rate`);
  }

  getAIInsights(): Observable<{ type: string; message: string; recommendation: string }[]> {
    return this.http.get<{ type: string; message: string; recommendation: string }[]>(`${this.API}/ai-insights`);
  }

  getInactivePatients(): Observable<InactivePatient[]> {
    return this.http.get<InactivePatient[]>(`${this.API}/inactive-patients`);
  }
}

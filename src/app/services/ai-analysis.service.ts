import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AiAnalysis } from '../models/ai-analysis';



@Injectable({
  providedIn: 'root'
})
export class AiAnalysisService {

  private readonly apiUrl = 'http://localhost:3000/ai-analysis';

  constructor(private http: HttpClient) {}

  /**
   * Génère une nouvelle analyse IA à partir des réponses du formulaire
   */
  generateAnalysis(patientId: string, answers: any[]): Observable<AiAnalysis> {
    return this.http.post<AiAnalysis>(`${this.apiUrl}/generate`, {
      patientId,
      answers
    });
  }

  /**
   * Récupère toutes les analyses d'un patient
   */
  getAnalysesByPatient(patientId: string): Observable<AiAnalysis[]> {
    return this.http.get<AiAnalysis[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  /**
   * Récupère la dernière analyse d'un patient
   */
  getLatestAnalysis(patientId: string): Observable<AiAnalysis> {
    return this.http.get<AiAnalysis>(`${this.apiUrl}/patient/${patientId}/latest`);
  }

  /**
   * Récupère une analyse par son ID
   */
  getAnalysisById(id: string): Observable<AiAnalysis> {
    return this.http.get<AiAnalysis>(`${this.apiUrl}/${id}`);
  }
}

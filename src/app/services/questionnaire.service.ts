import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Questionnaire } from '../models/questionnaire';
import { Question } from '../models/question';
import { QuestionnaireResponse, QuestionnaireResponsePopulated } from '../models/questionnaire-response';
import { ApiConfig } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class QuestionnaireService {

  private readonly API = ApiConfig.QUESTIONNAIRES;

  constructor(private http: HttpClient) {}

  // ── Questionnaires ──────────────────────────────────────

  create(questionnaire: Partial<Questionnaire>): Observable<Questionnaire> {
    return this.http.post<Questionnaire>(this.API, questionnaire);
  }

  getAll(medicalService?: string): Observable<Questionnaire[]> {
    let params = new HttpParams();
    if (medicalService) {
      params = params.set('medicalService', medicalService);
    }
    return this.http.get<Questionnaire[]>(this.API, { params });
  }

  getOne(id: string): Observable<Questionnaire> {
    return this.http.get<Questionnaire>(`${this.API}/${id}`);
  }

  update(id: string, questionnaire: Partial<Questionnaire>): Observable<Questionnaire> {
    return this.http.patch<Questionnaire>(`${this.API}/${id}`, questionnaire);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }

  toggleStatus(id: string): Observable<Questionnaire> {
    return this.http.patch<Questionnaire>(`${this.API}/${id}/toggle-status`, {});
  }

// questionnaire.service.ts

archive(id: string): Observable<Questionnaire> {
  return this.http.patch<Questionnaire>(`${this.API}/${id}/archive`, {});
}

restore(id: string): Observable<Questionnaire> {
  return this.http.patch<Questionnaire>(`${this.API}/${id}/restore`, {});
}
//generate with ai
generateQuestionsWithAI(
  medicalService: string,
  title: string,
  description: string,
  count: number = 7
): Observable<{ questions: Question[] }> {
  return this.http.post<{ questions: Question[] }>(
    `${ApiConfig.AI}/generate-questions`,
    { medicalService, title, description, count }
  );
}
  // ── Questions ────────────────────────────────────────────

  addQuestion(questionnaireId: string, question: Partial<Question>): Observable<Questionnaire> {
    return this.http.post<Questionnaire>(
      `${this.API}/${questionnaireId}/questions`,
      question
    );
  }

  updateQuestion(
    questionnaireId: string,
    questionId: string,
    question: Partial<Question>
  ): Observable<Questionnaire> {
    return this.http.patch<Questionnaire>(
      `${this.API}/${questionnaireId}/questions/${questionId}`,
      question
    );
  }

  deleteQuestion(questionnaireId: string, questionId: string): Observable<Questionnaire> {
    return this.http.delete<Questionnaire>(
      `${this.API}/${questionnaireId}/questions/${questionId}`
    );
  }

  reorderQuestions(questionnaireId: string, orderedIds: string[]): Observable<Questionnaire> {
    return this.http.patch<Questionnaire>(
      `${this.API}/${questionnaireId}/questions/reorder`,
      { orderedIds }
    );
  }

  // ── Responses ────────────────────────────────────────────

  submitResponse(
    questionnaireId: string,
    response: Partial<QuestionnaireResponse>
  ): Observable<QuestionnaireResponse> {
    return this.http.post<QuestionnaireResponse>(
      `${this.API}/${questionnaireId}/responses`,
      response
    );
  }

  getResponses(questionnaireId: string): Observable<QuestionnaireResponsePopulated[]> {
    return this.http.get<QuestionnaireResponsePopulated[]>(
      `${this.API}/${questionnaireId}/responses`
    );
  }

  getPatientResponses(patientId: string): Observable<QuestionnaireResponsePopulated[]> {
    return this.http.get<QuestionnaireResponsePopulated[]>(
      `${this.API}/patient/${patientId}/responses`
    );
  }

//summary with ai
generatePatientSummary(patientName: string, medicalService: string, responses: any[]) {
  return this.http.post<{ summary: string }>(
    `${ApiConfig.AI}/generate-summary`,
    {
      patientName,
      medicalService,
      responses
    }
  );
}
}

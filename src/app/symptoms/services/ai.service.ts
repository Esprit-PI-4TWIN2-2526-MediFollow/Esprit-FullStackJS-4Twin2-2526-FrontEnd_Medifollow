import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { SymptomAiQuestion } from './symptom.service';
import { ApiConfig } from '../../config/api.config';

export interface GenerateQuestionsPayload {
  title: string;
  description: string;
  medicalService: string;
  category: string;
  numberOfQuestions: number;
}

export interface GenerateQuestionsResponse {
  questions: SymptomAiQuestion[];
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly symptomsGenerateApi = `${ApiConfig.BASE_URL}/symptoms/generate`;

  constructor(private http: HttpClient) {}

  generateQuestions(data: GenerateQuestionsPayload): Observable<GenerateQuestionsResponse> {
    const payload = {
      title: data.title.trim(),
      description: data.description.trim(),
      medicalService: data.medicalService,
      category: data.category,
      numberOfQuestions: data.numberOfQuestions,
    };

    return this.http
      .post<GenerateQuestionsResponse | SymptomAiQuestion[]>(this.symptomsGenerateApi, payload)
      .pipe(map((response) => this.normalizeResponse(response)));
  }

  private normalizeResponse(
    response: GenerateQuestionsResponse | SymptomAiQuestion[]
  ): GenerateQuestionsResponse {
    const questions = Array.isArray(response) ? response : response?.questions;

    return {
      questions: Array.isArray(questions)
        ? questions.filter((question) => !!question && typeof question.label === 'string')
        : [],
    };
  }
}

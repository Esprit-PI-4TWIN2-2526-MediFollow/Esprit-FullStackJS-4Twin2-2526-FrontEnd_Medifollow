import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

export type SymptomQuestionType =
  | 'text'
  | 'number'
  | 'scale'
  | 'single_choice'
  | 'multiple_choice'
  | 'date'
  | 'boolean';

export type QuestionCategory =
  | 'vital_parameters'
  | 'subjective_symptoms'
  | 'patient_context'
  | 'clinical_data';

export interface SymptomQuestion {
  _id?: string;
  label: string;
  type: SymptomQuestionType;
  options?: string[];
  required?: boolean;
  occurrencesPerDay?: number;
  measurementsPerDay?: number;
  maxOccurrencesPerDay?: number;
  order?: number;
  category?: QuestionCategory;
}

export interface SymptomForm {
  _id?: string;
  title: string;
  description?: string;
  medicalService?: string;
  patientId?: string;
  patientIds?: string[];
  questions: SymptomQuestion[];
  status?: 'active' | 'inactive';
  responsesCount?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface SymptomResponsePayload {
  formId?: string;
  answers: {
    questionId: string;
    value: string | number | boolean | string[] | null;
  }[];
}

export interface SymptomAiQuestion {
  label: string;
  type: SymptomQuestionType | string;
  options?: string[];
  category?: QuestionCategory;
}

export interface SymptomQuestionTodayStatus {
  questionId?: string;
  questionText?: string;
  question?: string | { _id?: string };
  required?: boolean;
  isRequired?: boolean;
  isBlocked?: boolean;
  remainingRequired?: number;
  remainingOptional?: number;
  occurrencesPerDay?: number;
  occurrencesToday?: number;
  completedOccurrences?: number;
  currentOccurrence?: number;
}

@Injectable({ providedIn: 'root' })
export class SymptomService {
  private readonly API = 'http://localhost:3000/symptoms';

  constructor(private http: HttpClient) {}

  createForm(data: Partial<SymptomForm>): Observable<SymptomForm> {
    return this.http
      .post<SymptomForm>(`${this.API}/form`, this.normalizeFormPayload(data))
      .pipe(map((form) => this.normalizeForm(form)));
  }

  updateForm(id: string, data: Partial<SymptomForm>): Observable<SymptomForm> {
    return this.http
      .put<SymptomForm>(`${this.API}/form/${id}`, this.normalizeFormPayload(data))
      .pipe(map((form) => this.normalizeForm(form)));
  }

  getForms(): Observable<SymptomForm[]> {
    return this.http
      .get<SymptomForm[]>(`${this.API}/form`)
      .pipe(map((forms) => forms.map((form) => this.normalizeForm(form))));
  }

  getLatestForm(): Observable<SymptomForm> {
    return this.http
      .get<SymptomForm>(`${this.API}/form/latest`)
      .pipe(map((form) => this.normalizeForm(form)));
  }

  getFormById(id: string): Observable<SymptomForm> {
    return this.http.get<SymptomForm>(`${this.API}/form/${id}`).pipe(
      map((form) => this.normalizeForm(form)),
      catchError(() =>
        this.getForms().pipe(
          map((forms) => {
            const form = forms.find((item) => item._id === id);
            if (!form) {
              throw new Error('Symptoms form not found');
            }
            return form;
          }),
          catchError((error) => throwError(() => error))
        )
      )
    );
  }

  getTodayQuestionStatus(patientId: string): Observable<SymptomQuestionTodayStatus[]> {
    return this.http.get<
      SymptomQuestionTodayStatus[] | { questions?: SymptomQuestionTodayStatus[]; statuses?: SymptomQuestionTodayStatus[] }
    >(`${this.API}/questions/status/today/${patientId}`).pipe(
      map((response) => {
        if (Array.isArray(response)) {
          return response;
        }

        return response.questions ?? response.statuses ?? [];
      })
    );
  }

  deleteForm(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/form/${id}`);
  }

  submitResponse(data: SymptomResponsePayload): Observable<unknown> {
    return this.http.post(`${this.API}/response`, data);
  }

  generateQuestionsWithAI(
    title: string,
    description: string,
    count = 5,
    category?: QuestionCategory
  ): Observable<{ questions: SymptomAiQuestion[] }> {
    return this.http.post<{ questions: SymptomAiQuestion[] }>(
      'http://localhost:3000/ai/generate-questions',
      {
        medicalService: 'Symptoms Monitoring',
        title,
        description,
        count,
        ...(category ? { category } : {}),
      }
    );
  }

  private normalizeForm(form: SymptomForm): SymptomForm {
    return {
      ...form,
      questions: (form.questions ?? []).map((question) => {
        const measurementsPerDay =
          question.measurementsPerDay ??
          question.occurrencesPerDay ??
          question.maxOccurrencesPerDay ??
          1;
        return {
          ...question,
          measurementsPerDay,
          occurrencesPerDay: measurementsPerDay,
          maxOccurrencesPerDay: measurementsPerDay,
        };
      }),
    };
  }

  private normalizeFormPayload(data: Partial<SymptomForm>): Partial<SymptomForm> {
    if (!Array.isArray(data.questions)) {
      return data;
    }

    return {
      ...data,
      questions: data.questions.map((question) => {
        const measurementsPerDay =
          question.measurementsPerDay ??
          question.occurrencesPerDay ??
          question.maxOccurrencesPerDay ??
          1;
        return {
          ...question,
          measurementsPerDay,
          occurrencesPerDay: measurementsPerDay,
          maxOccurrencesPerDay: measurementsPerDay,
        };
      }),
    };
  }
}

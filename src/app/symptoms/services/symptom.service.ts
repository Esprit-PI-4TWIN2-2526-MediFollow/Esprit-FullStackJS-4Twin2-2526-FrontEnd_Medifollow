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
  order?: number;
  category?: QuestionCategory;
}

export interface SymptomForm {
  _id?: string;
  title: string;
  description?: string;
  medicalService?: string;
  patientId?: string;
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

@Injectable({ providedIn: 'root' })
export class SymptomService {
  private readonly API = 'http://localhost:3000/symptoms';

  constructor(private http: HttpClient) {}

  createForm(data: Partial<SymptomForm>): Observable<SymptomForm> {
    return this.http.post<SymptomForm>(`${this.API}/form`, data);
  }

  updateForm(id: string, data: Partial<SymptomForm>): Observable<SymptomForm> {
    return this.http.put<SymptomForm>(`${this.API}/form/${id}`, data);
  }

  getForms(): Observable<SymptomForm[]> {
    return this.http.get<SymptomForm[]>(`${this.API}/form`);
  }

  getLatestForm(): Observable<SymptomForm> {
    return this.http.get<SymptomForm>(`${this.API}/form/latest`);
  }

  getFormById(id: string): Observable<SymptomForm> {
    return this.http.get<SymptomForm>(`${this.API}/form/${id}`).pipe(
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
}

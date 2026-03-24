export type SymptomsQuestionType =
  | 'text'
  | 'number'
  | 'single_choice'
  | 'multiple_choice'
  | 'select'
  | 'date'
  | 'boolean'
  | 'yes_no'
  | 'scale';

export interface SymptomsQuestionValidation {
  min?: number;
  max?: number;
}

export interface SymptomsQuestion {
  _id?: string;
  label: string;
  type: SymptomsQuestionType | string;
  options?: string[];
  required?: boolean;
  order?: number;
  validation?: SymptomsQuestionValidation;
}

export interface SymptomsAssignedForm {
  _id?: string;
  title: string;
  description?: string;
  patientId?: string;
  medicalService?: string;
  status?: 'active' | 'inactive';
  questions: SymptomsQuestion[];
}

export interface SymptomsTodayResponse {
  _id?: string;
  patientId?: string;
  formId?: string;
  answers?: Record<string, unknown>;
  date?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface SymptomsSubmitAnswer {
  questionId: string;
  value: unknown;
}

export interface SymptomsSubmitPayload {
  patientId: string;
  formId: string;
  answers: SymptomsSubmitAnswer[];
  date: Date;
}

export type QuestionType =
  | 'text'
  | 'number'
  | 'scale'
  | 'single_choice'
  | 'multiple_choice'
  | 'date'
  | 'boolean';

export interface Question {
  _id?: string;
  label: string;
  type: QuestionType;
  order: number;
  required: boolean;
  options: string[];
  validation?: {
    min?: number;
    max?: number;
  };
}

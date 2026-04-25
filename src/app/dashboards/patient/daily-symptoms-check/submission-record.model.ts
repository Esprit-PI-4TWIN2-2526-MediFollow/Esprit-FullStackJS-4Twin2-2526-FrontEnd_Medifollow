export type OverallFeeling = 'good' | 'average' | 'poor';
export type Severity = 'normal' | 'warning' | 'alert';

export interface SymptomAnswer {
  questionLabel: string;
  value: string;
  severity: Severity;
}

export interface SubmissionRecord {
  day: number;
  date: string;
  submittedAt: string;
  overallFeeling: OverallFeeling;
  answers: SymptomAnswer[];
}

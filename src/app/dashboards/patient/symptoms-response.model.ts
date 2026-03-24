export type SymptomDayStatus =
  | 'submitted'
  | 'missed'
  | 'today'
  | 'today-submitted'
  | 'empty';

export interface SymptomResponse {
  _id?: string;
  patientId?: string;
  createdAt?: string | Date;
  submittedAt?: string | Date;
  responseDate?: string | Date;
  date?: string | Date;
}

export interface SymptomDayCell {
  date: Date;
  status: SymptomDayStatus;
  tooltip: string;
  isToday: boolean;
}

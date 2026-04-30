export type SymptomDayStatus =
  | 'submitted'
  | 'missed'
  | 'today'
  | 'future';

export interface SymptomAssignedForm {
  _id?: string;
  startDate?: string | Date;
  durationInDays?: number;
  assignedAt?: string | Date;
  createdAt?: string | Date;
}

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
  submitted: boolean;
}

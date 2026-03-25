import { Question } from './question';

export interface Questionnaire {
  _id?: string;
  title: string;
  description?: string;
  medicalService: string;
 status: 'active' | 'inactive' | 'archived';

  archivedAt?: Date | null;
  questions: Question[];
  responsesCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

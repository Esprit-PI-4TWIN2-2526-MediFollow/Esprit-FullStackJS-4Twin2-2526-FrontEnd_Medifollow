export interface Answer {
  questionId: string;
  value: any;
}

export interface QuestionnaireResponse {
  _id?: string;
  questionnaireId: string;
  patientId: string;
  answers: Answer[];
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
// Pour l'affichage avec populate
export interface QuestionnaireResponsePopulated {
  _id?: string;
  questionnaireId: {
    _id: string;
    title: string;
    medicalService: string;
  };
  patientId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  answers: Answer[];
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

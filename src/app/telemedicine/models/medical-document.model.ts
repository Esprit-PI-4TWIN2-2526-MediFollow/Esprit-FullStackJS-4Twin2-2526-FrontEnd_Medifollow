export interface MedicalDocument {
  _id: string;
  patient: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  uploadedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  consultation?: string;
  type: 'lab-result' | 'imaging' | 'report' | 'prescription' | 'other';
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  metadata?: {
    examDate?: Date;
    laboratory?: string;
    radiologist?: string;
    [key: string]: any;
  };
  sharedWith?: string[];
  uploadedAt: Date;
  createdAt: Date;
}

export interface UploadDocumentDto {
  file: File;
  patientId: string;
  consultationId?: string;
  type: 'lab-result' | 'imaging' | 'report' | 'prescription' | 'other';
  title: string;
  description?: string;
  examDate?: string;
  laboratory?: string;
  radiologist?: string;
  sharedWith?: string[];
}

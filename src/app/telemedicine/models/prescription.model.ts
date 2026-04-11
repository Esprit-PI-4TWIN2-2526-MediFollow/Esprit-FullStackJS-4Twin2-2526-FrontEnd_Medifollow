export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface Prescription {
  _id: string;
  consultation: string;
  patient: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    dateOfBirth?: Date;
  };
  doctor: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    specialization?: string;
  };
  medications: Medication[];
  status: 'draft' | 'issued' | 'sent' | 'dispensed';
  qrCode: string;
  digitalSignature?: string;
  pharmacyNotes?: string;
  issuedAt?: Date;
  validUntil?: Date;
  createdAt: Date;
}

export interface CreatePrescriptionDto {
  consultationId: string;
  medications: Medication[];
  pharmacyNotes?: string;
}

export interface IssuePrescriptionDto {
  digitalSignature: string;
}
